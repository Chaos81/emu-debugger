// Save states for the arena (Genesis, SNES and the other cores share the same code).
//
// Adds "Save state" and "Load state" buttons to the SAVES & LEAGUE STATS group, plus
// matching buttons in full screen.  Keyboard: [ = save state,  ] = load state.
//   Save state  -> downloads a .state file at any point in a match
//   Load state  -> pick a .state file to restore it
//
// Either button works any time a game is running. Every state is checked against
// the running game's system, emulator build and size before it is used.
//
// File layout (.state):
//   bytes 0-3   magic "NHLS"
//   bytes 4-7   header length N (uint32, big endian)
//   next N      JSON header (ROM hash, core version, platform, teams, frame ...)
//   remainder   raw emulator state exactly as the core produced it
(function () {
  'use strict';

  var MAGIC = [0x4e, 0x48, 0x4c, 0x53]; // "NHLS"
  var FORMAT = 1;
  var api = null;
  var saveBtn, loadBtn, saveFs, loadFs, fileInput, msg, toast, msgTimer, toastTimer;

  function hook() { return globalThis.__arena || null; }

  function say(text, isError) {
    if (msg) {
      msg.textContent = text;
      msg.style.color = isError ? '#b3261e' : '';
      clearTimeout(msgTimer);
      msgTimer = setTimeout(function () { msg.textContent = ''; }, 12000);
    }
    if (toast) {
      toast.textContent = text;
      toast.classList.add('show');
      toast.style.color = isError ? '#ffb3a7' : '';
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 6000);
    }
    try { api.status(text); } catch (e) { /* the status line is optional */ }
  }

  // ---------- availability ----------
  function inMatch() {
    return !!(api && api.emu && (api.phase === 'lineup' || api.phase === 'playing'));
  }
  function canSave() { return inMatch(); }
  function canLoad() { return inMatch(); }

  function refresh() {
    api = hook();
    var s = canSave(), l = canLoad();
    [saveBtn, saveFs].forEach(function (b) { if (b) b.disabled = !s; });
    [loadBtn, loadFs].forEach(function (b) { if (b) b.disabled = !l; });
    var st = s ? 'Download a save state of this game right now'
      : !api ? 'Starting…' : 'Start a game to use save states.';
    var lt = l ? 'Restore a saved state'
      : !api ? 'Starting…'
      : 'Start a game to use save states.';
    [saveBtn, saveFs].forEach(function (b) { if (b) b.title = st; });
    [loadBtn, loadFs].forEach(function (b) { if (b) b.title = lt; });
  }

  // ---------- helpers ----------
  function baseName() {                      // the ROM's file name without its extension, e.g. nhl94.bin -> nhl94
    var n = String((api && api.romName) || '').replace(/\.(bin|md|gen|smd|sfc|smc|rom|zip)$/i, '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
    return n || ('game-' + (api ? api.platform : 'state'));
  }

  function stamp() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  // ---------- save ----------
  function saveState() {
    refresh();
    if (!canSave()) { say('Start a game first, then save.', true); return; }
    try {
      var snap = api.snapshot();                       // { bytes: Uint8Array, frame }
      var header = {
        format: FORMAT,
        created: new Date().toISOString(),
        platform: api.platform,
        romSha256: api.emu.romSha256,
        coreVersion: api.coreVersion || null,
        coreHash: api.coreHash || null,
        stateSize: snap.bytes.length,
        frame: snap.frame,
        phase: api.phase,
        savedFrom: api.mode
      };
      var head = new TextEncoder().encode(JSON.stringify(header));
      var len = new Uint8Array(4);
      new DataView(len.buffer).setUint32(0, head.length, false);
      var blob = new Blob([new Uint8Array(MAGIC), len, head, snap.bytes], { type: 'application/octet-stream' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = baseName() + '.state';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
      say('State saved (' + Math.round(snap.bytes.length / 1024) + ' KB). Check your downloads.');
    } catch (e) {
      console.error(e);
      say('Could not save the state: ' + (e && e.message || e), true);
    }
  }

  // ---------- load: parsing and validation ----------
  function parse(buffer) {
    var u8 = new Uint8Array(buffer);
    if (u8.length < 8 || MAGIC.some(function (b, i) { return u8[i] !== b; })) {
      throw new Error('This is not a save state made by this site.');
    }
    var n = new DataView(buffer).getUint32(4, false);
    if (n < 2 || n > 65536 || 8 + n > u8.length) throw new Error('The save state header is damaged.');
    var header = JSON.parse(new TextDecoder().decode(u8.subarray(8, 8 + n)));
    if (header.format !== FORMAT) throw new Error('Unsupported save state version.');
    return { header: header, bytes: u8.slice(8 + n) };
  }

  function validate(s) {
    var h = s.header;
    if (h.platform !== api.platform) throw new Error('This state is for ' + h.platform + '; the arena is set to ' + api.platform + '.');
    if (h.coreVersion && api.coreVersion && h.coreVersion !== api.coreVersion) throw new Error('This state was made with a different emulator version.');
    if (h.coreHash && api.coreHash && h.coreHash !== api.coreHash) throw new Error('This state was made with a different emulator build.');
    if (!Number.isSafeInteger(h.frame) || h.frame < 0) throw new Error('The save state header is damaged.');
    if (s.bytes.length !== h.stateSize) throw new Error('The save state is incomplete.');
    if (!api.emu.stateSize || s.bytes.length !== api.emu.stateSize) throw new Error('This state does not fit the running game.');
  }

  function loadBuffer(buffer) {
    refresh();
    if (!canLoad()) throw new Error('Start a game first, then load.');
    var s = parse(buffer);
    validate(s);
    api.emu.load({ bytes: s.bytes, frame: s.header.frame });
    api.afterLoad();
    say('State loaded (saved ' + new Date(s.header.created).toLocaleString() + ').');
  }

  // ---------- UI ----------
  function onFile() {
    var f = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { say('That file is too large to be a save state.', true); return; }
    f.arrayBuffer().then(loadBuffer).catch(function (e) {
      console.error(e);
      say(e && e.message || String(e), true);
    });
  }

  function chooseFile() {
    refresh();
    if (!canLoad()) { say('Start a game first, then load.', true); return; }
    fileInput.click();
  }

  function addStyle() {
    var st = document.createElement('style');
    st.textContent =
      '.k94-in-game{z-index:4;color:#fff;cursor:pointer;background:#101b31;border:1px solid #99b4ee;padding:10px 14px;' +
      'font-family:inherit;font-size:14px;font-weight:700;min-height:44px;display:none;position:absolute;left:16px}' +
      '.screen-wrap.is-fullscreen .k94-in-game{display:block}.k94-in-game:disabled{opacity:.5;cursor:default}' +
      '#k94-save-fs{top:108px}#k94-load-fs{top:160px}' +
      '.k94-toast{z-index:5;display:none;position:absolute;bottom:18px;left:50%;transform:translateX(-50%);max-width:80%;' +
      'text-align:center;color:#f5f3ec;background:#05070dd1;padding:9px 15px;font-size:14px;pointer-events:none}' +
      '.screen-wrap.is-fullscreen .k94-toast.show{display:block}' +
      '.k94-state-message{color:#526078;margin-top:10px;font-size:13px;line-height:1.6;min-height:1.2em}';
    document.head.appendChild(st);
  }

  function mkBtn(id, label, cls) {
    var b = document.createElement('button');
    b.id = id; b.type = 'button'; b.className = cls; b.textContent = label; b.disabled = true;
    return b;
  }

  function addHelp() { /* the Save states help topic is part of index.html */ }

  function build() {
    var theirs = document.getElementById('load-state');           // the setup-time recovery button
    var group = theirs && theirs.parentNode;
    var tools = group && group.closest('.arena-tools');
    var wrap = document.getElementById('screen-wrap');
    if (!group || !tools) return false;
    addStyle();

    saveBtn = mkBtn('k94-save-state', 'Save state', 'text-button');
    loadBtn = mkBtn('k94-load-state', 'Load state', 'text-button');
    saveBtn.addEventListener('click', saveState);
    loadBtn.addEventListener('click', chooseFile);
    group.insertBefore(saveBtn, theirs);
    group.insertBefore(loadBtn, theirs);
    theirs.hidden = true;

    var help = tools.querySelector('.arena-actions-help');
    if (help) {
      help.innerHTML = '<strong>Save state</strong> downloads a save at any point in a game; <strong>Load state</strong> restores one. ' +
        'Keyboard: <kbd>[</kbd> saves, <kbd>]</kbd> loads.';
    }

    fileInput = document.createElement('input');
    fileInput.type = 'file'; fileInput.accept = '.state'; fileInput.hidden = true;
    fileInput.addEventListener('change', onFile);
    tools.appendChild(fileInput);

    msg = document.createElement('p');
    msg.id = 'k94-state-message'; msg.className = 'k94-state-message';
    msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite');
    tools.appendChild(msg);

    if (wrap) {
      saveFs = mkBtn('k94-save-fs', 'Save state', 'k94-in-game');
      loadFs = mkBtn('k94-load-fs', 'Load state', 'k94-in-game');
      saveFs.addEventListener('click', saveState);
      loadFs.addEventListener('click', chooseFile);
      toast = document.createElement('div');
      toast.className = 'k94-toast'; toast.setAttribute('role', 'status');
      wrap.appendChild(saveFs); wrap.appendChild(loadFs); wrap.appendChild(toast);
    }

    addHelp();

    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target && e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      if (e.key === '[') { e.preventDefault(); saveState(); }
      else if (e.key === ']') { e.preventDefault(); chooseFile(); }
    });

    setInterval(refresh, 250);
    refresh();
    return true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
