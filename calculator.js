// Hex calculator: integer maths on byte (8-bit), word (16-bit) and double word (32-bit) values,
// shown in hexadecimal, decimal (unsigned and signed) and binary.
//
// The engine below has no DOM code, so it can be tested on its own (module.exports under Node).
// The window code at the bottom runs only inside calculator.html.
//
// Values are kept as unsigned BigInts masked to the current size. Every operation also sets
// N Z V C flags the way the 68000 would for the same operation:
//   N = top bit of the result, Z = result is zero,
//   C = unsigned carry / borrow, or the last bit shifted or rotated out,
//   V = signed overflow (for ASL: the top bit changed at some point during the shift).
(function (root) {
  'use strict';

  var SIZES = { 8: 'Byte', 16: 'Word', 32: 'Dword' };
  var SYMBOLS = {
    add: '+', sub: '−', mul: '×', div: '÷', mod: 'MOD',
    and: 'AND', or: 'OR', xor: 'XOR',
    lsl: 'LSL', lsr: 'LSR', asl: 'ASL', asr: 'ASR', rol: 'ROL', ror: 'ROR'
  };
  var UNARY = { not: 'NOT', neg: 'NEG' };

  function U(v, bits) { return BigInt.asUintN(bits, v); }
  function S(v, bits) { return BigInt.asIntN(bits, v); }
  function bit(v, i) { return i >= 0 ? Number((v >> BigInt(i)) & 1n) : 0; }
  function signedOut(x, bits) { var h = 1n << BigInt(bits - 1); return x < -h || x > h - 1n ? 1 : 0; }

  // a OP b at the given size. Returns { value, C, V } or { error }.
  function binary(op, a, b, bits, signedDiv) {
    a = U(a, bits); b = U(b, bits);
    var r, C = 0, V = 0, full, n, k, x, y;
    switch (op) {
      case 'add':
        full = a + b; r = U(full, bits); C = full >> BigInt(bits) ? 1 : 0;
        V = signedOut(S(a, bits) + S(b, bits), bits); break;
      case 'sub':
        r = U(a - b, bits); C = a < b ? 1 : 0;
        V = signedOut(S(a, bits) - S(b, bits), bits); break;
      case 'mul':
        full = a * b; r = U(full, bits); C = full >> BigInt(bits) ? 1 : 0;
        V = signedOut(S(a, bits) * S(b, bits), bits); break;
      case 'div': case 'mod':
        if (b === 0n) return { error: 'Cannot divide by zero.' };
        if (signedDiv) {                       // truncates toward zero, remainder takes the dividend's sign (like DIVS)
          x = S(a, bits); y = S(b, bits);
          if (op === 'div') { full = x / y; r = U(full, bits); V = signedOut(full, bits); }
          else r = U(x % y, bits);
        } else r = op === 'div' ? a / b : a % b;
        break;
      case 'and': r = a & b; break;
      case 'or': r = a | b; break;
      case 'xor': r = a ^ b; break;
      case 'lsl': case 'asl': case 'lsr': case 'asr': case 'rol': case 'ror':
        n = b > 255n ? 256 : Number(b);        // the count is the right-hand value, unsigned
        if (op === 'lsl' || op === 'asl') {
          r = n >= bits ? 0n : U(a << BigInt(n), bits);
          C = n === 0 ? 0 : n <= bits ? bit(a, bits - n) : 0;
          if (op === 'asl' && n > 0) {
            if (n >= bits) V = a !== 0n ? 1 : 0;
            else { var t = a >> BigInt(bits - n - 1); V = t === 0n || t === (1n << BigInt(n + 1)) - 1n ? 0 : 1; }
          }
        } else if (op === 'lsr') {
          r = n >= bits ? 0n : a >> BigInt(n);
          C = n === 0 ? 0 : n <= bits ? bit(a, n - 1) : 0;
        } else if (op === 'asr') {
          r = U(S(a, bits) >> BigInt(Math.min(n, bits)), bits);
          C = n === 0 ? 0 : n <= bits ? bit(a, n - 1) : bit(a, bits - 1);
        } else {
          k = n % bits;
          r = k === 0 ? a : op === 'rol'
            ? U((a << BigInt(k)) | (a >> BigInt(bits - k)), bits)
            : U((a >> BigInt(k)) | (a << BigInt(bits - k)), bits);
          C = n === 0 ? 0 : op === 'rol' ? bit(r, 0) : bit(r, bits - 1);
        }
        break;
      default: return { error: 'Unknown operation ' + op + '.' };
    }
    return { value: r, C: C, V: V };
  }

  function unary(op, a, bits) {
    a = U(a, bits);
    if (op === 'not') return { value: U(~a, bits), C: 0, V: 0 };
    if (op === 'neg') return { value: U(-a, bits), C: a !== 0n ? 1 : 0, V: a === 1n << BigInt(bits - 1) ? 1 : 0 };
    return { error: 'Unknown operation ' + op + '.' };
  }

  function hex(v, bits) { return U(v, bits).toString(16).toUpperCase().padStart(bits / 4, '0'); }
  function bin(v, bits) { return U(v, bits).toString(2).padStart(bits, '0').replace(/(.{4})(?=.)/g, '$1 '); }
  function dec(v, bits) { return U(v, bits).toString(); }
  function sdec(v, bits) { return S(v, bits).toString(); }

  // Read a pasted or typed number: $1F, 0x1F, 1Fh (hex), %1010, 0b1010 (binary), -12 (decimal);
  // anything else is read in the current base.
  function parseText(text, base, bits) {
    var t = String(text || '').trim().replace(/[\s_]/g, ''), m, v;
    if (!t) return { error: 'Nothing to read.' };
    try {
      if ((m = /^(?:\$|0x)([0-9a-f]+)$/i.exec(t) || /^([0-9a-f]+)h$/i.exec(t))) v = BigInt('0x' + m[1]);
      else if ((m = /^(?:%|0b)([01]+)$/i.exec(t))) v = BigInt('0b' + m[1]);
      else if (/^-\d+$/.test(t)) v = BigInt(t);
      else if (base === 16 && /^[0-9a-f]+$/i.test(t)) v = BigInt('0x' + t);
      else if (base === 10 && /^\d+$/.test(t)) v = BigInt(t);
      else return { error: 'Not a number: ' + text.slice(0, 20) };
    } catch (e) { return { error: 'Not a number: ' + text.slice(0, 20) }; }
    var h = 1n << BigInt(bits);
    if (v < -(h >> 1n) || v >= h) return { error: 'Too large for a ' + SIZES[bits].toLowerCase() + ' (' + bits + ' bits).' };
    return { value: U(v, bits) };
  }

  // ---------- calculator state: entry, pending operator, result ----------
  function Calc() {
    this.bits = 16; this.base = 16; this.signedDiv = false;
    this.value = 0n;       // what the display shows
    this.entry = '';       // digits typed so far (in the current base)
    this.fresh = true;     // the next digit starts a new number
    this.typed = false;    // a right-hand value was given since the operator
    this.acc = null;       // left-hand value of the pending operator
    this.op = null;
    this.last = null;      // { op, b } for repeating "="
    this.expr = '';        // the line above the display
    this.flags = null;     // { N, Z, V, C } of the last operation
    this.error = '';
    this.history = [];     // { text, value, bits }
  }
  Calc.prototype.fmt = function (v) { return this.base === 16 ? '$' + hex(v, this.bits) : dec(v, this.bits); };
  Calc.prototype.display = function () {
    if (!this.fresh && this.entry) return this.entry;
    return this.base === 16 ? hex(this.value, this.bits) : dec(this.value, this.bits);
  };
  Calc.prototype.setFlags = function (res) {
    this.flags = { N: bit(res.value, this.bits - 1), Z: res.value === 0n ? 1 : 0, V: res.V, C: res.C };
  };
  Calc.prototype.remember = function (text, value) {
    this.history.unshift({ text: text, value: value, bits: this.bits });
    if (this.history.length > 12) this.history.length = 12;
  };
  Calc.prototype.digit = function (d) {
    d = String(d).toUpperCase();
    if (!(this.base === 16 ? /^[0-9A-F]$/ : /^[0-9]$/).test(d)) return false;
    var entry = this.fresh ? '' : this.entry;
    if (entry === '0') entry = '';
    var next = entry + d;
    if (this.base === 16 ? next.length > this.bits / 4 : BigInt(next) >= 1n << BigInt(this.bits)) return false;
    this.entry = next; this.fresh = false; this.typed = true; this.error = '';
    if (!this.op) this.expr = '';
    this.flags = null;
    this.value = BigInt(this.base === 16 ? '0x' + next : next);
    return true;
  };
  Calc.prototype.back = function () {
    if (this.fresh || !this.entry) return false;
    this.entry = this.entry.slice(0, -1);
    this.value = this.entry ? BigInt(this.base === 16 ? '0x' + this.entry : this.entry) : 0n;
    return true;
  };
  Calc.prototype.clearEntry = function () {
    this.value = 0n; this.entry = ''; this.fresh = false; this.typed = true; this.error = ''; this.flags = null;
  };
  Calc.prototype.clearAll = function () {
    this.value = 0n; this.entry = ''; this.fresh = true; this.typed = false;
    this.acc = null; this.op = null; this.last = null; this.expr = ''; this.flags = null; this.error = '';
  };
  Calc.prototype.compute = function (a, op, b) {
    var res = binary(op, a, b, this.bits, this.signedDiv);
    if (res.error) { this.error = res.error; return null; }
    this.setFlags(res);
    this.remember(this.fmt(a) + ' ' + SYMBOLS[op] + ' ' + this.fmt(b) + ' = ' + this.fmt(res.value), res.value);
    return res.value;
  };
  // An operator key: chains left to right, so 2 + 3 × 4 gives 20 like a hand calculator.
  Calc.prototype.setOp = function (op) {
    if (!SYMBOLS[op]) return false;
    this.error = '';
    if (this.op && this.typed) {
      var r = this.compute(this.acc, this.op, this.value);
      if (r === null) return false;
      this.value = r;
    }
    this.acc = this.value; this.op = op; this.fresh = true; this.typed = false;
    this.expr = this.fmt(this.acc) + ' ' + SYMBOLS[op];
    return true;
  };
  Calc.prototype.equals = function () {
    var a, op, b;
    if (this.op) { a = this.acc; op = this.op; b = this.value; }
    else if (this.last) { a = this.value; op = this.last.op; b = this.last.b; }   // "=" again repeats the last step
    else return false;
    this.error = '';
    var r = this.compute(a, op, b);
    if (r === null) return false;
    this.expr = this.fmt(a) + ' ' + SYMBOLS[op] + ' ' + this.fmt(b) + ' =';
    this.last = { op: op, b: b };
    this.value = r; this.acc = null; this.op = null; this.fresh = true; this.typed = false;
    return true;
  };
  Calc.prototype.unary = function (op) {
    var res = unary(op, this.value, this.bits);
    if (res.error) { this.error = res.error; return false; }
    this.error = '';
    this.setFlags(res);
    this.remember(UNARY[op] + ' ' + this.fmt(this.value) + ' = ' + this.fmt(res.value), res.value);
    if (!this.op) this.expr = UNARY[op] + ' ' + this.fmt(this.value) + ' =';
    this.value = res.value; this.fresh = true; this.typed = true;
    return true;
  };
  Calc.prototype.setValue = function (v) {
    this.value = U(BigInt(v), this.bits); this.fresh = true; this.typed = true; this.error = ''; this.flags = null;
    if (!this.op) this.expr = '';
  };
  Calc.prototype.toggleBit = function (i) {
    if (i < 0 || i >= this.bits) return false;
    this.setValue(this.value ^ (1n << BigInt(i)));
    return true;
  };
  Calc.prototype.paste = function (text) {
    var r = parseText(text, this.base, this.bits);
    if (r.error) { this.error = r.error; return false; }
    this.setValue(r.value);
    return true;
  };
  // Changing size keeps only the low bits, as a byte or word move would.
  Calc.prototype.setSize = function (bits) {
    if (!SIZES[bits]) return false;
    this.bits = bits; this.value = U(this.value, bits);
    if (this.acc !== null) this.acc = U(this.acc, bits);
    if (this.last) this.last.b = U(this.last.b, bits);
    this.fresh = true; this.flags = null; this.error = '';
    if (this.op) this.expr = this.fmt(this.acc) + ' ' + SYMBOLS[this.op];
    return true;
  };
  Calc.prototype.setBase = function (base) {
    if (base !== 16 && base !== 10) return false;
    this.base = base; this.fresh = true;
    if (this.op) this.expr = this.fmt(this.acc) + ' ' + SYMBOLS[this.op];
    return true;
  };

  var api = { Calc: Calc, binary: binary, unary: unary, parseText: parseText, hex: hex, bin: bin, dec: dec, sdec: sdec, SIZES: SIZES, SYMBOLS: SYMBOLS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.HexCalc = api;

  // ---------- window (calculator.html) ----------
  if (typeof document === 'undefined' || !document.getElementById('calc')) return;
  var c = new Calc(), $ = function (id) { return document.getElementById(id); };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var saved = {};
  try { saved = JSON.parse(store('emu-debugger-calc') || '{}') || {}; } catch (e) { saved = {}; }
  if (SIZES[saved.bits]) c.bits = saved.bits;
  if (saved.base === 10 || saved.base === 16) c.base = saved.base;
  c.signedDiv = !!saved.signedDiv;
  function persist() { store('emu-debugger-calc', JSON.stringify({ bits: c.bits, base: c.base, signedDiv: c.signedDiv })); }

  var bitCells = [];
  function buildBits() {
    var grid = $('bits'); grid.textContent = ''; bitCells = [];
    var rows = c.bits === 32 ? [[31, 16], [15, 0]] : [[c.bits - 1, 0]];   // at most 16 bits per row
    rows.forEach(function (r) {
      var hi = r[0], lo = r[1];
      var line = document.createElement('div'); line.className = 'bitrow';
      for (var i = hi; i >= lo; i--) {
        var cell = document.createElement('button');
        cell.type = 'button'; cell.className = 'bit' + (i % 4 === 0 && i !== lo ? ' nib' : '');
        cell.dataset.bit = String(i); cell.title = 'Bit ' + i + ' (click to flip)';
        var v = document.createElement('span'); v.className = 'v';
        var n = document.createElement('span'); n.className = 'n'; n.textContent = i % 4 === 0 || i === hi ? String(i) : '';
        cell.appendChild(v); cell.appendChild(n); line.appendChild(cell); bitCells[i] = v;
      }
      grid.appendChild(line);
    });
  }
  function render() {
    var v = c.value, b = c.bits;
    $('expr').textContent = c.expr || ' ';
    $('main').textContent = (c.base === 16 ? '$' : '') + c.display();
    $('main').classList.toggle('typing', !c.fresh);
    $('err').textContent = c.error;
    $('hexv').textContent = '$' + hex(v, b);
    $('decv').textContent = dec(v, b);
    $('sdecv').textContent = sdec(v, b);
    $('binv').textContent = bin(v, b);
    for (var i = 0; i < b; i++) { var on = bit(v, i); bitCells[i].textContent = on ? '1' : '0'; bitCells[i].parentNode.classList.toggle('on', !!on); }
    ['N', 'Z', 'V', 'C'].forEach(function (f) {
      var e = $('f' + f);
      e.classList.toggle('on', !!(c.flags && c.flags[f]));
      e.classList.toggle('stale', !c.flags);
    });
    document.querySelectorAll('[data-size]').forEach(function (e) { e.setAttribute('aria-pressed', String(+e.dataset.size === b)); });
    document.querySelectorAll('[data-base]').forEach(function (e) { e.setAttribute('aria-pressed', String(+e.dataset.base === c.base)); });
    document.querySelectorAll('[data-d]').forEach(function (e) { e.disabled = c.base === 10 && /[A-F]/.test(e.dataset.d); });
    document.querySelectorAll('[data-op]').forEach(function (e) { e.classList.toggle('pending', e.dataset.op === c.op); });
    $('signed').checked = c.signedDiv;
    var h = $('hist'); h.textContent = '';
    c.history.forEach(function (x) {
      var li = document.createElement('li'), btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = x.text + (x.bits !== b ? '  (' + SIZES[x.bits].toLowerCase() + ')' : '');
      btn.title = 'Use this result';
      btn.addEventListener('click', function () { c.setValue(x.value); render(); });
      li.appendChild(btn); h.appendChild(li);
    });
    $('histwrap').hidden = !c.history.length;
  }
  function flash(el) { if (!el) return; el.classList.add('bad'); setTimeout(function () { el.classList.remove('bad'); }, 180); }
  function press(key, el) {
    var ok = true;
    if (/^[0-9A-F]$/.test(key)) ok = c.digit(key);
    else if (SYMBOLS[key]) ok = c.setOp(key);
    else if (key === 'not' || key === 'neg') ok = c.unary(key);
    else if (key === 'eq') ok = c.equals();
    else if (key === 'back') ok = c.back();
    else if (key === 'ce') c.clearEntry();
    else if (key === 'clear') c.clearAll();
    if (!ok) flash(el || $('main'));
    render();
  }
  function copy(text, el) {
    var done = function () { $('err').textContent = 'Copied ' + text; setTimeout(function () { if ($('err').textContent === 'Copied ' + text) $('err').textContent = c.error; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { selectText(el); });
    else selectText(el);
  }
  function selectText(el) { if (!el) return; var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); $('err').textContent = 'Press Ctrl+C to copy.'; }

  document.querySelectorAll('[data-k]').forEach(function (b) { b.addEventListener('click', function () { press(b.dataset.k, b); }); });
  document.querySelectorAll('[data-d]').forEach(function (b) { b.addEventListener('click', function () { press(b.dataset.d, b); }); });
  document.querySelectorAll('[data-op]').forEach(function (b) { b.addEventListener('click', function () { press(b.dataset.op, b); }); });
  document.querySelectorAll('[data-size]').forEach(function (b) { b.addEventListener('click', function () { c.setSize(+b.dataset.size); persist(); buildBits(); render(); }); });
  document.querySelectorAll('[data-base]').forEach(function (b) { b.addEventListener('click', function () { c.setBase(+b.dataset.base); persist(); render(); }); });
  $('signed').addEventListener('change', function () { c.signedDiv = this.checked; persist(); render(); });
  $('bits').addEventListener('click', function (e) { var b = e.target.closest('[data-bit]'); if (b) { c.toggleBit(+b.dataset.bit); render(); } });
  document.querySelectorAll('.copyrow').forEach(function (row) {
    row.addEventListener('click', function () { var v = row.querySelector('.val'); copy(v.textContent.replace(/ /g, ''), v); });
  });
  $('main').addEventListener('click', function () { copy($('main').textContent, $('main')); });

  var KEYS = { '+': 'add', '-': 'sub', '*': 'mul', 'x': 'mul', 'X': 'mul', '/': 'div', '%': 'mod', '&': 'and', '|': 'or', '^': 'xor', '~': 'not', 'n': 'neg', 'N': 'neg',
    '<': 'lsl', '>': 'lsr', '=': 'eq', 'Enter': 'eq', 'Backspace': 'back', 'Delete': 'ce', 'Escape': 'clear' };
  document.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') return;
    if (e.ctrlKey || e.metaKey || e.altKey) {
      if ((e.key === 'c' || e.key === 'C') && !String(getSelection())) { e.preventDefault(); copy($('main').textContent, $('main')); }
      return;
    }
    var k = e.key.length === 1 && /[0-9a-f]/i.test(e.key) ? e.key.toUpperCase() : KEYS[e.key];
    if (!k) return;
    e.preventDefault();
    var el = document.querySelector('[data-d="' + k + '"],[data-op="' + k + '"],[data-k="' + k + '"]');
    if (el && el.disabled) { flash($('main')); return; }
    press(k, el);
  });
  document.addEventListener('paste', function (e) {
    var t = (e.clipboardData || window.clipboardData).getData('text');
    if (!t) return;
    e.preventDefault();
    if (!c.paste(t)) flash($('main'));
    render();
  });

  // Values sent from the debugger (right-click > Send to calculator). The value becomes the next
  // number, so with "+" pending it is the right-hand side; the size switches to the value's size.
  root.calcReceive = function (hexText, bits, label) {
    bits = +bits;
    if (!/^[0-9a-f]{1,8}$/i.test(String(hexText)) || !SIZES[bits]) return false;
    if (bits !== c.bits) { c.setSize(bits); buildBits(); persist(); }
    c.setValue(BigInt('0x' + hexText));
    if (!c.op) c.expr = label ? 'from ' + String(label).slice(0, 40) : '';
    render();
    return true;
  };

  buildBits();
  render();
})(typeof window !== 'undefined' ? window : globalThis);
