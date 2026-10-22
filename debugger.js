// Debugger window: run control, an editable watch list with freezing, and an editable memory view.
//
// Genesis work RAM is $FF0000-$FFFFFF (64 KiB, big-endian values); SNES work RAM is
// $7E0000-$7FFFFF (128 KiB, little-endian values). Short addresses such as 1234 are treated
// as offsets from the start of work RAM.
//
// All emulator access goes through globalThis.__arena (the main page): pause / step, RAM
// writes, and frozen bytes, which the main page rewrites after every emulated frame.
(function () {
  'use strict';

  var PLATFORMS = {
    genesis: { base: 0xFF0000, size: 0x10000, big: true, name: 'GENESIS' },
    snes: { base: 0x7E0000, size: 0x20000, big: false, name: 'SNES' }
  };
  var TYPES = {
    u8: { n: 1, signed: false, label: '8-bit' }, s8: { n: 1, signed: true, label: '8-bit signed' },
    u16: { n: 2, signed: false, label: '16-bit' }, s16: { n: 2, signed: true, label: '16-bit signed' },
    u32: { n: 4, signed: false, label: '32-bit' }
  };
  var ROWS = 16, PAGE = ROWS * 16;

  var state = { watches: [], nextId: 1, platform: null, memAddr: null, prevMem: null, prevVal: {}, win: null, view: null, timer: null };

  function arena() { return globalThis.__arena || null; }
  function cfg() { return PLATFORMS[state.platform]; }
  function hex(n, w) { var s = (n >>> 0).toString(16).toUpperCase(); while (s.length < w) s = '0' + s; return s; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function watchKey() { return 'emu-debugger-ramwatch-' + state.platform; }
  function oldKey() { return 'nhl94online-ramwatch-' + state.platform; }   // before the rename; read once

  function save() {
    store(watchKey(), JSON.stringify(state.watches.map(function (w) { return { label: w.label, addr: w.addr, type: w.type }; })));
  }
  function load() {
    state.watches = [];
    try {
      var list = JSON.parse(store(watchKey()) || store(oldKey()) || '[]');
      list.forEach(function (w) { if (w && TYPES[w.type] && typeof w.addr === 'number') addWatch(String(w.label || ''), w.addr, w.type, true); });
    } catch (e) { /* ignore a damaged list */ }
    var m = parseInt(store('emu-debugger-memaddr-' + state.platform) || '', 10);
    setMemAddr(isFinite(m) ? m : cfg().base, true);
  }
  function addWatch(label, addr, type, quiet) {
    state.watches.push({ id: state.nextId++, label: label.slice(0, 30), addr: addr, type: type });
    if (!quiet) save();
  }

  // ---------- parsing ----------
  // Resolve a typed address to a full work-RAM address.
  function parseAddress(text) {
    var c = cfg(), t = String(text || '').trim();
    if (!t) return { error: 'Type an address such as ' + hex(c.base + 0x1234, 6) + '.' };
    var h = t.replace(/^\$/, '').replace(/^0x/i, '').replace(/h$/i, '');
    if (!/^[0-9a-f]{1,6}$/i.test(h)) return { error: 'Not a hex address.' };
    var a = parseInt(h, 16);
    if (a >= 0 && a < c.size) return { addr: c.base + a };
    if (state.platform === 'genesis' && a >= 0xE00000 && a <= 0xFFFFFF) return { addr: c.base | (a & 0xFFFF) };   // RAM mirrors
    if (a >= c.base && a < c.base + c.size) return { addr: a };
    return { error: 'Outside work RAM ($' + hex(c.base, 6) + '-$' + hex(c.base + c.size - 1, 6) + ').' };
  }
  // A value typed for a watch: decimal (may be negative) or hex ($1F, 0x1F, 1Fh) as raw bits.
  function parseValue(text, type) {
    var t = String(text || '').trim(), T = TYPES[type], bits = Math.pow(2, 8 * T.n), v;
    if (/^-?\d+$/.test(t)) {
      v = parseInt(t, 10);
      var lo = T.signed ? -bits / 2 : 0, hi = T.signed ? bits / 2 - 1 : bits - 1;
      if (v < lo || v > hi) return { error: 'A ' + T.label + ' value must be ' + lo + ' to ' + hi + '.' };
      if (v < 0) v += bits;
    } else {
      var m = /^(?:\$|0x)([0-9a-f]+)$/i.exec(t) || /^([0-9a-f]+)h$/i.exec(t);
      if (!m) return { error: 'Type a number (12, -3) or hex ($0C).' };
      v = parseInt(m[1], 16);
      if (v >= bits) return { error: 'Too large for a ' + T.label + ' value.' };
    }
    return { bytes: toBytes(v, T.n, cfg().big) };
  }
  function toBytes(v, n, big) {
    var out = [];
    for (var i = 0; i < n; i++) { out.push(v % 256); v = Math.floor(v / 256); }   // little-endian first
    return big ? out.reverse() : out;
  }
  function readBytes(emu, addr, n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(emu.byte(addr + i) & 0xFF);
    return out;
  }
  function valueOf(bytes, type, big) {
    var t = TYPES[type], v = 0, i;
    if (big) { for (i = 0; i < t.n; i++) v = v * 256 + bytes[i]; }
    else { for (i = t.n - 1; i >= 0; i--) v = v * 256 + bytes[i]; }
    if (t.signed) { var lim = Math.pow(2, 8 * t.n - 1); if (v >= lim) v -= lim * 2; }
    return v;
  }
  function frozenCount(a, addr, n) {
    var c = 0;
    for (var i = 0; i < n; i++) if (a.isFrozen(addr + i)) c++;
    return c;
  }

  // ---------- run control ----------
  function live() { var a = arena(); return a && a.emu && a.phase === 'playing' ? a : null; }
  function togglePause() { var a = live(); if (a) a.setPaused(!a.paused); tick(); }
  function step(n) { var a = live(); if (a) a.step(n); tick(); }
  function stepCount() { var v = parseInt(state.view.stepN.value, 10); return v >= 1 && v <= 600 ? v : 10; }

  function say(text, bad) {
    var v = state.view; if (!v) return;
    v.msg.textContent = text; v.msg.className = 'msg' + (bad ? ' bad' : '');
    clearTimeout(v.msgTimer); v.msgTimer = v.win.setTimeout(function () { v.msg.textContent = ''; }, 8000);
  }
  function write(addr, bytes, what) {
    var a = live();
    if (!a) { say('Start a game first.', true); return false; }
    var wasRecording = a.recording;
    try { a.writeRam(addr, bytes); } catch (e) { say(e.message, true); return false; }
    say('Wrote ' + what + (wasRecording && !a.recording ? '. Replay recording stopped for this game (RAM was changed).' : '.'));
    tick();
    return true;
  }
  function setFreeze(addr, n, on) {
    var a = live();
    if (!a) { say('Start a game first.', true); return; }
    try {
      if (on) { var wasRecording = a.recording; a.freezeRam(addr, readBytes(a.emu, addr, n)); say('Frozen $' + hex(addr, 6) + (n > 1 ? '-$' + hex(addr + n - 1, 6) : '') + (wasRecording && !a.recording ? '. Replay recording stopped for this game.' : '.')); }
      else { a.unfreezeRam(addr, n); say('Unfrozen $' + hex(addr, 6) + (n > 1 ? '-$' + hex(addr + n - 1, 6) : '') + '.'); }
    } catch (e) { say(e.message, true); }
    tick();
  }

  // ---------- memory view ----------
  function setMemAddr(addr, quiet) {
    var c = cfg();
    addr = Math.max(c.base, Math.min(c.base + c.size - PAGE, addr - (addr - c.base) % 16));
    state.memAddr = addr; state.prevMem = null;
    store('emu-debugger-memaddr-' + state.platform, String(addr));
    if (state.view && !quiet) { state.view.memAddr.value = hex(addr, 6); paintMemory(true); }
  }

  // ---------- window ----------
  var CSS = '' +
    ':root{--ink:#101b31;--muted:#657080;--line:#e2e8f0;--bg:#f6f7f9;--accent:#2563eb;--chg:#fde68a;--frz:#dbeafe;--frz-ink:#1d4ed8;--bad:#b91c1c}' +
    '*{box-sizing:border-box}html,body{margin:0;height:100%}body{font:13px/1.4 Arial,Helvetica,sans-serif;color:var(--ink);background:var(--bg);display:flex;flex-direction:column}' +
    'button,input,select{font:inherit;color:inherit;border:1px solid #cbd5e1;border-radius:5px;background:#fff;padding:.3rem .55rem;margin:0}' +
    'button{cursor:pointer}button:hover:not(:disabled){background:#eef2f7}button:disabled{opacity:.45;cursor:default}' +
    '.bar{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;padding:.55rem .8rem;background:var(--ink);color:#fff}' +
    '.bar button{background:#1e2a44;border-color:#3a4a6b;color:#fff}.bar button:hover:not(:disabled){background:#2b3b5e}.bar button.primary{background:var(--accent);border-color:var(--accent)}' +
    '.bar input{width:4.2em;background:#1e2a44;border-color:#3a4a6b;color:#fff}' +
    '.state{margin-left:auto;display:flex;align-items:center;gap:.45rem;font-variant-numeric:tabular-nums}' +
    '.dot{width:9px;height:9px;border-radius:50%;background:#64748b}.dot.run{background:#22c55e}.dot.pause{background:#f6c94c}' +
    '.sys{font-size:11px;letter-spacing:.08em;border:1px solid #3a4a6b;border-radius:4px;padding:1px 6px;color:#cbd5e1}' +
    '.msg{margin:0;padding:.35rem .8rem;min-height:1.9em;color:#475569;border-bottom:1px solid var(--line);background:#fff}.msg.bad{color:var(--bad)}' +
    '.cols{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:.8rem;padding:.8rem}' +
    '@media(max-width:820px){.cols{grid-template-columns:1fr;overflow:auto}}' +
    '.pane{background:#fff;border:1px solid var(--line);border-radius:8px;padding:.7rem .8rem;display:flex;flex-direction:column;min-height:0}' +
    '.pane h2{margin:0 0 .5rem;font-size:11px;letter-spacing:.08em;color:var(--muted)}' +
    '.row{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin:0 0 .45rem}' +
    '.row input.addr{width:8.5em}.row input.lbl{flex:1 1 7em;min-width:0}.row .grow{flex:1}' +
    '.scroll{overflow:auto;min-height:0;flex:1}' +
    'table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}' +
    'th,td{text-align:left;padding:.22rem .4rem;border-bottom:1px solid var(--line);white-space:nowrap}' +
    'th{font-size:10.5px;color:var(--muted);letter-spacing:.05em;position:sticky;top:0;background:#fff}' +
    'td.num{font-family:ui-monospace,Menlo,Consolas,monospace}td.val{cursor:text}td.val:hover{background:#f1f5f9}' +
    'td.chg{background:var(--chg)}tr.frz td.num{color:var(--frz-ink)}tr.frz td.val{background:var(--frz)}' +
    'td input.edit{width:7.5em;padding:.1rem .3rem;font-family:ui-monospace,Menlo,Consolas,monospace}' +
    'td.lbl{max-width:11em;overflow:hidden;text-overflow:ellipsis}' +
    '.x{border:0;background:none;color:var(--muted);padding:0 .3rem}.empty{color:var(--muted);padding:.5rem 0;margin:0}' +
    '.hexv{font:12px/1.65 ui-monospace,Menlo,Consolas,monospace;user-select:none}' +
    '.hr{display:flex;white-space:pre}.hr .a{color:var(--muted);width:7.5ch}.hr .t{color:var(--muted);margin-left:1.2ch}' +
    '.b{display:inline-block;width:2.6ch;text-align:center;cursor:text;border-radius:2px}.b:hover{outline:1px solid #94a3b8}.b.gap{margin-left:.8ch}' +
    '.b.chg{background:var(--chg)}.b.frz{background:var(--frz);color:var(--frz-ink);font-weight:700}' +
    '.b input{width:2.6ch;padding:0;border:1px solid var(--accent);border-radius:2px;font:inherit;text-align:center;text-transform:uppercase}' +
    '.hint{color:var(--muted);font-size:12px;margin:.5rem 0 0}' +
    'kbd{font:11px ui-monospace,Menlo,Consolas,monospace;border:1px solid #cbd5e1;border-bottom-width:2px;border-radius:3px;padding:0 4px;background:#fff}' +
    '.foot{padding:0 .8rem .6rem;color:var(--muted);font-size:12px}';

  function build(w) {
    var doc = w.document;
    doc.open();
    doc.write('<!doctype html><meta charset="utf-8"><title>Debugger</title><style>' + CSS + '</style>' +
      '<header class="bar">' +
      '<button id="pause" class="primary" title="Pause or resume the game (F8)">Pause</button>' +
      '<button id="step1" title="Pause and run one frame (F10)">Step frame</button>' +
      '<button id="stepn" title="Pause and run this many frames (Shift+F10)">Step 10</button><input id="nframes" type="number" min="1" max="600" value="10" aria-label="Frames per step">' +
      '<div class="state"><span id="dot" class="dot"></span><b id="runstate">No game</b><span>frame <b id="frame">—</b></span><span id="sys" class="sys"></span></div>' +
      '</header>' +
      '<p id="msg" class="msg" role="status" aria-live="polite"></p>' +
      '<main class="cols">' +
      '<section class="pane"><h2>WATCH</h2>' +
      '<form id="wform" class="row"><input id="waddr" class="addr" placeholder="Address (hex)" aria-label="Address" autocomplete="off"><select id="wtype" aria-label="Value type"></select><input id="wlabel" class="lbl" placeholder="Label (optional)" maxlength="30" aria-label="Label"><button type="submit">Watch</button></form>' +
      '<div class="row"><button id="csvin" type="button" title="Each line: Label, address[, type]">Load CSV…</button><button id="csvout" type="button">Save CSV</button><span class="grow"></span><button id="clear" type="button">Clear all</button><input id="csvfile" type="file" accept=".csv,text/csv,text/plain" hidden></div>' +
      '<div class="scroll"><table id="wtable"><thead><tr><th>NAME</th><th>ADDRESS</th><th>TYPE</th><th>VALUE</th><th>HEX</th><th title="Keep this value fixed">FREEZE</th><th></th></tr></thead><tbody id="wbody"></tbody></table><p id="wempty" class="empty"></p></div>' +
      '<p class="hint">Click a value to change it (decimal, or hex like <kbd>$1F</kbd>). Freeze keeps the value fixed every frame.</p>' +
      '</section>' +
      '<section class="pane"><h2>MEMORY</h2>' +
      '<form id="mform" class="row"><button id="mprev" type="button" title="Previous 256 bytes">◀</button><input id="maddr" class="addr" aria-label="Memory address" autocomplete="off"><button type="submit">Go</button><button id="mnext" type="button" title="Next 256 bytes">▶</button><span class="grow"></span><button id="mwatch" type="button" title="Add the first address of this page to the watch list">Watch this address</button></form>' +
      '<div class="scroll"><div id="hexv" class="hexv"></div></div>' +
      '<p class="hint">Click a byte to edit it (<kbd>Enter</kbd> or <kbd>Tab</kbd> writes, <kbd>Esc</kbd> cancels). Right-click a byte to freeze or unfreeze it. Yellow = changed, blue = frozen.</p>' +
      '</section></main>' +
      '<p class="foot"><kbd>F8</kbd> pause / resume · <kbd>F10</kbd> step one frame · <kbd>Shift</kbd>+<kbd>F10</kbd> step N frames. Steps use the controllers’ current buttons. Changing or freezing RAM stops replay recording for that game.</p>');
    doc.close();

    var $ = function (id) { return doc.getElementById(id); };
    var v = {
      win: w, doc: doc, msg: $('msg'), pause: $('pause'), step1: $('step1'), stepn: $('stepn'), stepN: $('nframes'),
      dot: $('dot'), runstate: $('runstate'), frame: $('frame'), sys: $('sys'),
      wbody: $('wbody'), wtable: $('wtable'), wempty: $('wempty'), wtype: $('wtype'), memAddr: $('maddr'), hexv: $('hexv'),
      rows: {}, cells: [], editing: null
    };
    Object.keys(TYPES).forEach(function (t) { var o = doc.createElement('option'); o.value = t; o.textContent = TYPES[t].label; v.wtype.appendChild(o); });
    v.wtype.value = 'u16';

    v.pause.addEventListener('click', togglePause);
    v.step1.addEventListener('click', function () { step(1); });
    v.stepn.addEventListener('click', function () { step(stepCount()); });
    v.stepN.addEventListener('input', function () { v.stepn.textContent = 'Step ' + stepCount(); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'F8') { e.preventDefault(); togglePause(); }
      else if (e.key === 'F10') { e.preventDefault(); step(e.shiftKey ? stepCount() : 1); }
    });

    // watch list
    $('wform').addEventListener('submit', function (e) {
      e.preventDefault();
      var r = parseAddress($('waddr').value);
      if (r.error) { say(r.error, true); return; }
      var t = v.wtype.value, c = cfg();
      if (r.addr + TYPES[t].n > c.base + c.size) { say('That value runs past the end of work RAM.', true); return; }
      addWatch($('wlabel').value.trim(), r.addr, t);
      $('waddr').value = ''; $('wlabel').value = ''; say('Watching $' + hex(r.addr, 6) + '.');
      renderWatches();
    });
    $('clear').addEventListener('click', function () {
      if (state.watches.length && !w.confirm('Remove all ' + state.watches.length + ' watched addresses?')) return;
      state.watches = []; save(); renderWatches();
    });
    $('csvin').addEventListener('click', function () { $('csvfile').click(); });
    $('csvfile').addEventListener('change', function () {
      var f = this.files && this.files[0]; this.value = ''; if (!f) return;
      f.text().then(function (txt) {
        var r = importCsv(txt, v.wtype.value);
        say('Loaded ' + r.added + ' address' + (r.added === 1 ? '' : 'es') + (r.skipped.length ? '; skipped line' + (r.skipped.length === 1 ? ' ' : 's ') + r.skipped.slice(0, 8).join(', ') + (r.skipped.length > 8 ? '…' : '') : '') + '.', !r.added && r.skipped.length);
      }, function () { say('Could not read that file.', true); });
    });
    $('csvout').addEventListener('click', function () {
      if (!state.watches.length) { say('The watch list is empty.', true); return; }
      var q = function (s) { return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      var text = 'Label,Address,Type\n' + state.watches.map(function (x) { return q(x.label) + ',' + hex(x.addr, 6) + ',' + x.type; }).join('\n') + '\n';
      var a = doc.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
      a.download = 'watch-' + state.platform + '.csv'; doc.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
    });
    v.wbody.addEventListener('click', function (e) {
      var t = e.target, tr = t.closest && t.closest('tr'); if (!tr) return;
      var x = state.watches.filter(function (q) { return String(q.id) === tr.dataset.id; })[0]; if (!x) return;
      if (t.getAttribute('data-del') !== null) {
        if (live()) live().unfreezeRam(x.addr, TYPES[x.type].n);
        state.watches = state.watches.filter(function (q) { return q !== x; }); save(); renderWatches();
      } else if (t.classList.contains('val') && !v.editing) editWatch(x, t);
    });
    v.wbody.addEventListener('change', function (e) {
      var t = e.target, tr = t.closest && t.closest('tr'); if (!tr || t.type !== 'checkbox') return;
      var x = state.watches.filter(function (q) { return String(q.id) === tr.dataset.id; })[0];
      if (x) setFreeze(x.addr, TYPES[x.type].n, t.checked);
    });

    // memory view: 16 rows of 16 byte cells, built once and updated in place
    for (var r = 0; r < ROWS; r++) {
      var row = doc.createElement('div'), ad = doc.createElement('span'), tx = doc.createElement('span');
      row.className = 'hr'; ad.className = 'a'; tx.className = 't'; row.appendChild(ad);
      for (var i = 0; i < 16; i++) {
        var b = doc.createElement('span'); b.className = 'b' + (i === 8 ? ' gap' : ''); b.dataset.i = String(r * 16 + i);
        row.appendChild(b); v.cells.push(b);
      }
      row.appendChild(tx); v.hexv.appendChild(row); v.cells['a' + r] = ad; v.cells['t' + r] = tx;
    }
    $('mform').addEventListener('submit', function (e) {
      e.preventDefault();
      var r = parseAddress(v.memAddr.value);
      if (r.error) { say(r.error, true); return; }
      setMemAddr(r.addr);
    });
    $('mprev').addEventListener('click', function () { setMemAddr(state.memAddr - PAGE); });
    $('mnext').addEventListener('click', function () { setMemAddr(state.memAddr + PAGE); });
    $('mwatch').addEventListener('click', function () { $('waddr').value = hex(state.memAddr, 6); $('waddr').focus(); });
    v.hexv.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.b');
      if (b && !v.editing) editByte(+b.dataset.i);
    });
    v.hexv.addEventListener('contextmenu', function (e) {
      var b = e.target.closest && e.target.closest('.b'); if (!b) return;
      e.preventDefault();
      var a = live(), addr = state.memAddr + +b.dataset.i;
      setFreeze(addr, 1, !(a && a.isFrozen(addr)));
    });
    return v;
  }

  // Inline editors. While one is open, the cell it replaces is not repainted.
  function inlineEdit(cell, initial, width, onCommit, onDone) {
    var v = state.view, doc = v.doc, inp = doc.createElement('input');
    inp.className = 'edit'; inp.value = initial; inp.autocomplete = 'off'; inp.spellcheck = false;
    if (width) inp.maxLength = width;
    cell.textContent = ''; cell.appendChild(inp); inp.focus(); inp.select();
    var closed = false;
    v.editing = cell;
    function close() { if (closed) return; closed = true; v.editing = null; if (inp.parentNode) inp.remove(); tick(); }
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (onCommit(inp.value) === false) { inp.select(); return; }
        close(); if (onDone) onDone(e);
      }
      e.stopPropagation();
    });
    inp.addEventListener('blur', function () { w0(close); });
  }
  function w0(fn) { state.view.win.setTimeout(fn, 0); }

  function editWatch(x, cell) {
    var a = live();
    if (!a) { say('Start a game first.', true); return; }
    var cur = valueOf(readBytes(a.emu, x.addr, TYPES[x.type].n), x.type, cfg().big);
    inlineEdit(cell, String(cur), 0, function (text) {
      var r = parseValue(text, x.type);
      if (r.error) { say(r.error, true); return false; }
      return write(x.addr, r.bytes, (x.label || '$' + hex(x.addr, 6)) + ' = ' + text.trim());
    });
  }
  function editByte(i) {
    var a = live();
    if (!a) { say('Start a game first.', true); return; }
    var v = state.view, addr = state.memAddr + i, cell = v.cells[i];
    inlineEdit(cell, hex(a.emu.byte(addr) & 0xFF, 2), 2, function (text) {
      var t = text.trim();
      if (!/^[0-9a-f]{1,2}$/i.test(t)) { say('Type one byte in hex, 00 to FF.', true); return false; }
      return write(addr, [parseInt(t, 16)], '$' + hex(addr, 6) + ' = $' + hex(parseInt(t, 16), 2));
    }, function (e) {
      if (e.key === 'Tab') {
        var next = i + (e.shiftKey ? -1 : 1);
        if (next >= 0 && next < PAGE) w0(function () { editByte(next); });
      }
    });
  }

  // ---------- painting ----------
  function renderWatches() {
    var v = state.view; if (!v) return;
    v.wbody.textContent = ''; v.rows = {};
    state.watches.forEach(function (x) {
      var doc = v.doc, tr = doc.createElement('tr'), c = {};
      tr.dataset.id = String(x.id);
      function td(cls, text) { var e = doc.createElement('td'); if (cls) e.className = cls; e.textContent = text; tr.appendChild(e); return e; }
      td('lbl', x.label || '—').title = x.label;
      td('num', '$' + hex(x.addr, 6)); td('', x.type);
      c.val = td('num val', ''); c.val.title = 'Click to change';
      c.hex = td('num', '');
      var f = doc.createElement('td'), cb = doc.createElement('input'); cb.type = 'checkbox'; cb.setAttribute('aria-label', 'Freeze'); f.appendChild(cb); tr.appendChild(f); c.cb = cb;
      var del = doc.createElement('td'), b = doc.createElement('button');
      b.className = 'x'; b.type = 'button'; b.textContent = '✕'; b.title = 'Remove'; b.setAttribute('data-del', ''); b.setAttribute('aria-label', 'Remove watch');
      del.appendChild(b); tr.appendChild(del);
      v.wbody.appendChild(tr); v.rows[x.id] = { tr: tr, c: c };
    });
    v.wtable.style.display = state.watches.length ? '' : 'none';
    state.prevVal = {};
    tick();
  }

  function paintToolbar(a) {
    var v = state.view, run = !!(a && a.emu && a.phase === 'playing');
    v.pause.disabled = v.step1.disabled = v.stepn.disabled = !run;
    v.pause.textContent = run && a.paused ? 'Resume' : 'Pause';
    v.dot.className = 'dot' + (run ? (a.paused ? ' pause' : ' run') : '');
    v.runstate.textContent = !run ? (a && a.phase === 'preparing' ? 'Starting…' : 'No game') : a.paused ? 'Paused' : 'Running';
    v.frame.textContent = run ? String(a.frame) : '—';
    v.sys.textContent = cfg().name;
  }

  function paintWatches(a) {
    var v = state.view, run = !!(a && a.emu), big = cfg().big;
    v.wempty.textContent = !state.watches.length ? 'Add an address above, or load a CSV.' : !run ? 'Start a game and the values will appear here.' : '';
    v.wempty.style.display = v.wempty.textContent ? '' : 'none';
    state.watches.forEach(function (x) {
      var row = v.rows[x.id]; if (!row) return;
      var c = row.c, n = TYPES[x.type].n;
      c.cb.disabled = !run;
      if (!run) { if (v.editing !== c.val) c.val.textContent = ''; c.hex.textContent = ''; c.cb.checked = false; row.tr.classList.remove('frz'); return; }
      var bytes = readBytes(a.emu, x.addr, n), val = valueOf(bytes, x.type, big), frozen = frozenCount(a, x.addr, n) === n;
      var changed = state.prevVal[x.id] !== undefined && state.prevVal[x.id] !== val;
      state.prevVal[x.id] = val;
      if (v.editing !== c.val) c.val.textContent = String(val);
      c.hex.textContent = '$' + bytes.map(function (b) { return hex(b, 2); }).join('');
      c.cb.checked = frozen; row.tr.classList.toggle('frz', frozen);
      if (changed) { c.val.classList.add('chg'); c.hex.classList.add('chg'); }
      else if (!a.paused) { c.val.classList.remove('chg'); c.hex.classList.remove('chg'); }
    });
  }

  function paintMemory(force) {
    var v = state.view; if (!v) return;
    var a = arena(), run = !!(a && a.emu), start = state.memAddr;
    if (force || v.memAddr.value === '') v.memAddr.value = hex(start, 6);
    var bytes = run ? readBytes(a.emu, start, PAGE) : null, old = state.prevMem;
    for (var r = 0; r < ROWS; r++) {
      v.cells['a' + r].textContent = '$' + hex(start + r * 16, 6);
      var txt = '';
      for (var i = 0; i < 16; i++) {
        var idx = r * 16 + i, cell = v.cells[idx], b = bytes ? bytes[idx] : null;
        txt += b === null ? ' ' : (b >= 32 && b < 127 ? String.fromCharCode(b) : '.');
        if (v.editing === cell) continue;
        cell.textContent = b === null ? '··' : hex(b, 2);
        var chg = !!(old && bytes && old[idx] !== b);
        cell.classList.toggle('frz', !!(run && a.isFrozen(start + idx)));
        if (chg) cell.classList.add('chg'); else if (!(a && a.paused)) cell.classList.remove('chg');
      }
      v.cells['t' + r].textContent = txt;
    }
    if (bytes) state.prevMem = bytes;
  }

  // Follow the main page's selected system.
  function syncPlatform() {
    var a = arena(), p = a && a.platform;
    if (!PLATFORMS[p]) p = state.platform || 'genesis';
    if (p === state.platform) return false;
    state.platform = p; state.prevMem = null; state.prevVal = {};
    load();
    if (state.view) { state.view.memAddr.value = hex(state.memAddr, 6); renderWatches(); }
    return true;
  }

  function tick() {
    var v = state.view;
    if (!v || v.win.closed) { stop(); return; }
    if (syncPlatform()) return;     // renderWatches() already repainted
    var a = arena();
    if (a && a.phase !== 'playing' && a.phase !== 'preparing') { state.prevMem = null; state.prevVal = {}; }
    paintToolbar(a); paintWatches(a); paintMemory(false);
  }
  function stop() { try { if (state.view) state.view.win.clearInterval(state.timer); } catch (e) { /* window already gone */ } state.timer = null; state.view = null; }

  function open() {
    var w = state.win;
    if (w && !w.closed && state.view) { w.focus(); return; }
    stop();
    w = window.open('', 'emu-debugger', 'width=1080,height=760,resizable=yes,scrollbars=yes');
    if (!w) { alert('The pop-up was blocked. Allow pop-ups for this site, then click Debugger again.'); return; }
    state.win = w;
    if (!state.platform) syncPlatform();
    state.view = build(w);
    state.view.memAddr.value = hex(state.memAddr, 6);
    w.addEventListener('pagehide', stop);
    renderWatches();
    // Refresh from the debugger window's own timer: browsers slow down timers in the
    // main page while the debugger window has focus.
    state.timer = w.setInterval(tick, 100);
    // Keep the game running while the game window gets no animation frames of its own
    // (Chrome treats a window covered by another one as hidden and stops its frames).
    var pumpFrame = function () {
      if (state.view && state.view.win === w && !w.closed) {
        var a = arena(); if (a && a.pump) a.pump();
        w.requestAnimationFrame(pumpFrame);
      }
    };
    w.requestAnimationFrame(pumpFrame);
  }
  function isOpen() { return !!(state.view && state.win && !state.win.closed); }

  // Split one CSV line into fields (handles "quoted, fields").
  function csvFields(line) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out.map(function (f) { return f.trim(); });
  }

  // CSV: "Label, address[, type]" per line. A header row, blank lines and # comments are skipped.
  function importCsv(text, defaultType) {
    var c = cfg(), added = 0, skipped = [];
    text.replace(/^﻿/, '').split(/\r?\n/).forEach(function (line, idx) {
      if (!line.trim() || line.trim()[0] === '#') return;
      var f = csvFields(line);
      if (f.length < 2) { skipped.push(idx + 1); return; }
      var r = parseAddress(f[1]);
      if (r.error) { if (!(idx === 0 && !added)) skipped.push(idx + 1); return; }   // first line may be a header
      var ty = TYPES[(f[2] || '').toLowerCase()] ? f[2].toLowerCase() : defaultType;
      if (r.addr + TYPES[ty].n > c.base + c.size) { skipped.push(idx + 1); return; }
      addWatch(f[0], r.addr, ty, true);
      added++;
    });
    if (added) { save(); renderWatches(); }
    return { added: added, skipped: skipped };
  }

  globalThis.__debugger = { open: open, isOpen: isOpen, importCsv: function (t, ty) { syncPlatform(); return importCsv(t, ty || 'u16'); } };
  globalThis.__ramViewer = globalThis.__debugger;   // older name
})();
