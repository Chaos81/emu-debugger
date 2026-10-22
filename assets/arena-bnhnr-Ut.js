var __stubs = {},
  __roms = new Map(),
  __romNames = new Map(),
  __crcFor = null,
  __crcVal = null;
function __crc32(b) {
  let t = __crc32.t;
  if (!t) {
    t = __crc32.t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
  }
  let c = 4294967295;
  for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 255] ^ (c >>> 8);
  return ((c ^ 4294967295) >>> 0).toString(16).padStart(8, `0`);
}
function __myRom() {
  if (!rom) return null;
  if (__crcFor !== rom) {
    let n = emuModule?.normalizeROM ? emuModule.normalizeROM(rom) : rom;
    ((__crcVal = { crc: __crc32(n), size: n.length }), (__crcFor = rom));
  }
  return __crcVal;
}
function __syncRom() {
  try {
    let m = __myRom();
    if (!m || !k) return;
    romError || (k(`rom-status`).textContent = `ROM loaded · CRC32 ${m.crc}`);
  } catch {}
}
import "./shared.js";
var vn = [
    { id: `up`, label: `D-pad Up`, bit: 16, hint: `Press UP on the D-pad` },
    { id: `down`, label: `D-pad Down`, bit: 32, hint: `Press DOWN on the D-pad` },
    { id: `left`, label: `D-pad Left`, bit: 64, hint: `Press LEFT on the D-pad` },
    { id: `right`, label: `D-pad Right`, bit: 128, hint: `Press RIGHT on the D-pad` },
    { id: `a`, label: `Genesis A`, bit: 2, hint: `Press the button you want for A` },
    { id: `b`, label: `Genesis B`, bit: 1, hint: `Press the button you want for B` },
    { id: `c`, label: `Genesis C`, bit: 256, hint: `Press the button you want for C` },
    { id: `start`, label: `Start`, bit: 8, hint: `Press the button you want for START` },
  ],
  yn = [
    ...vn.slice(0, 4),
    { id: `a`, label: `SNES A`, bit: 2, hint: `Press SNES A` },
    { id: `b`, label: `SNES B`, bit: 1, hint: `Press SNES B` },
    { id: `y`, label: `SNES Y`, required: !0, bit: 512, hint: `Press SNES Y` },
    { id: `x`, label: `SNES X`, required: !0, bit: 1024, hint: `Press SNES X` },
    { id: `l`, label: `SNES L`, bit: 2048, hint: `Press SNES L` },
    { id: `r`, label: `SNES R`, bit: 4, hint: `Press SNES R` },
    vn.at(-1),
  ],
  bn = (e = `genesis`) => (e === `snes` ? yn : vn),
  xn = [...vn, ...yn.filter((e) => !vn.some((t) => t.id === e.id))],
  Sn = (e, t = `genesis`) => An(e) + (t === `snes` ? `|snes` : ``),
  Cn = `king94-controller-profiles-v1`,
  wn = { capturing: !1 },
  Tn = 0.45,
  En = 0.1,
  Dn = 0.5,
  On = 250,
  kn = new Map();
function An(e) {
  let t = String(e?.id || ``),
    n = `${t}|${e?.mapping}|${e?.buttons?.length}|${e?.axes?.length}`;
  if (kn.has(n)) return kn.get(n);
  let r =
      /vendor:\s*([0-9a-f]{4}).*?product:\s*([0-9a-f]{4})/i.exec(t) ||
      /^([0-9a-f]{4})-([0-9a-f]{4})-/i.exec(t),
    i = `${
      r
        ? `${r[1].toLowerCase()}:${r[2].toLowerCase()}`
        : `id:${t
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, `-`)
            .slice(0, 60)}`
    }|${e?.mapping === `standard` ? `std` : `raw`}|${e?.buttons?.length ?? 0}b${e?.axes?.length ?? 0}a`;
  return (kn.size > 50 && kn.clear(), kn.set(n, i), i);
}
function jn(e) {
  return (
    String(e?.id || `Controller`)
      .replace(/^[0-9a-f]{4}-[0-9a-f]{4}-/i, ``)
      .replace(/\s*\(.*\)\s*$/, ``)
      .trim() || `Controller`
  );
}
function Mn(e = `genesis`) {
  return e === `snes`
    ? {
        ...Mn(),
        a: [{ t: `b`, i: 1 }],
        b: [{ t: `b`, i: 0 }],
        y: [{ t: `b`, i: 2 }],
        x: [{ t: `b`, i: 3 }],
        l: [{ t: `b`, i: 4 }],
        r: [{ t: `b`, i: 5 }],
      }
    : {
        up: [
          { t: `b`, i: 12 },
          { t: `a`, i: 1, s: -1 },
        ],
        down: [
          { t: `b`, i: 13 },
          { t: `a`, i: 1, s: 1 },
        ],
        left: [
          { t: `b`, i: 14 },
          { t: `a`, i: 0, s: -1 },
        ],
        right: [
          { t: `b`, i: 15 },
          { t: `a`, i: 0, s: 1 },
        ],
        a: [{ t: `b`, i: 2 }],
        b: [{ t: `b`, i: 0 }],
        c: [
          { t: `b`, i: 1 },
          { t: `b`, i: 3 },
        ],
        start: [{ t: `b`, i: 9 }],
      };
}
function Nn(e, t) {
  if (t.t === `b`) {
    let n = e.buttons?.[t.i];
    return !!(n && (n.pressed || n.value > 0.6));
  }
  let n = e.axes?.[t.i];
  return typeof n == `number` ? (t.t === `a` ? n * t.s > Tn : Math.abs(n - t.v) < En) : !1;
}
function Pn(e, t, n = `genesis`) {
  let r = 0;
  for (let i of bn(n)) (t[i.id] || []).some((t) => Nn(e, t)) && (r |= i.bit);
  return r;
}
function Fn(e) {
  return e.t === `b`
    ? `Button ${e.i}`
    : e.t === `a`
      ? `Axis ${e.i} ${e.s < 0 ? `−` : `+`}`
      : `D-pad hat ${e.i} · ${e.v.toFixed(2)}`;
}
var In = (e, t) =>
    e.t === t.t &&
    e.i === t.i &&
    (e.t === `a` ? e.s === t.s : e.t !== `h` || Math.abs(e.v - t.v) < 0.01),
  Ln = (e) =>
    e &&
    typeof e == `object` &&
    Number.isInteger(e.i) &&
    e.i >= 0 &&
    e.i < 64 &&
    (e.t === `b` ||
      (e.t === `a` && (e.s === 1 || e.s === -1)) ||
      (e.t === `h` && Number.isFinite(e.v) && e.v > -2 && e.v < 5)),
  Rn = (e) =>
    e.t === `b`
      ? { t: `b`, i: e.i }
      : e.t === `a`
        ? { t: `a`, i: e.i, s: e.s }
        : { t: `h`, i: e.i, v: Math.round(e.v * 1e3) / 1e3 };
function zn(e) {
  let t = {};
  if (!e || typeof e != `object` || Array.isArray(e)) return t;
  for (let [n, r] of Object.entries(e).slice(0, 20)) {
    if (
      typeof n != `string` ||
      n.length > 120 ||
      !r ||
      typeof r != `object` ||
      !r.bindings ||
      typeof r.bindings != `object`
    )
      continue;
    let e = {};
    for (let t of xn)
      e[t.id] = (Array.isArray(r.bindings[t.id]) ? r.bindings[t.id] : [])
        .filter(Ln)
        .slice(0, 4)
        .map(Rn);
    t[n] = {
      name: String(r.name || `Controller`).slice(0, 80),
      saved: String(r.saved || ``).slice(0, 30),
      bindings: e,
    };
  }
  return t;
}
var Bn = null;
function Vn(e) {
  if (e !== void 0) return e;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
function Hn(e) {
  try {
    let t = Vn(e);
    if (!t) throw Error(`Storage unavailable`);
    return zn(JSON.parse(t.getItem(`king94-controller-profiles-v1`) || `{}`));
  } catch {
    return (e === void 0 && Bn) || {};
  }
}
function Un() {
  return (Bn ||= Hn());
}
function Wn() {
  return ((Bn = null), Un());
}
function Gn(e, t) {
  Bn = e;
  try {
    return (t.setItem(Cn, JSON.stringify(e)), !0);
  } catch {
    return !1;
  }
}
function Kn(e, t, n, r, i = new Date()) {
  let a = r === void 0 ? { ...Un() } : Hn(r);
  return ((a[e] = { name: t, saved: i.toISOString(), bindings: n }), Gn(zn(a), Vn(r)));
}
function qn(e, t) {
  let n = t === void 0 ? { ...Un() } : Hn(t);
  return (delete n[e], Gn(n, Vn(t)));
}
function Jn(e, t = Un(), n = `genesis`) {
  let r = t[Sn(e, n)];
  return r && (n !== `snes` || (r.bindings.x?.length && r.bindings.y?.length))
    ? { bindings: r.bindings, source: `saved` }
    : { bindings: Mn(n), source: e.mapping === `standard` ? `standard` : `unconfigured` };
}
var Yn = (e, t = Un(), n = `genesis`) => Jn(e, t, n).source !== `saved`;
function Xn(e) {
  return {
    b: Array.from(e.buttons || [], (e) => !!(e.pressed || e.value > 0.6)),
    a: Array.from(e.axes || []),
  };
}
function Zn(e, t) {
  for (let n = 0; n < t.buttons.length; n++)
    if ((t.buttons[n].pressed || t.buttons[n].value > 0.6) && !e.b[n]) return { t: `b`, i: n };
  for (let n = 0; n < t.axes.length; n++) {
    let r = e.a[n] ?? 0,
      i = t.axes[n],
      a = i - r;
    if (!(!Number.isFinite(i) || Math.abs(a) < Dn))
      return Math.abs(r) > 1.05
        ? Math.abs(i) > 1.05
          ? null
          : { t: `h`, i: n, v: Math.round(i * 1e3) / 1e3 }
        : { t: `a`, i: n, s: Math.sign(a) };
  }
  return null;
}
var Qn = class {
    constructor(e = vn) {
      ((this.actions = e),
        (this.index = 0),
        (this.bindings = {}),
        (this.message = ``),
        (this.state = `settling`),
        (this.calmSince = null),
        (this.last = null),
        (this.base = null));
    }
    get done() {
      return this.index >= this.actions.length;
    }
    get current() {
      return this.actions[this.index] || null;
    }
    update(e, t) {
      if (this.done) return !1;
      let n = Xn(e);
      if (this.state === `settling`) {
        let e =
          !n.b.some(Boolean) &&
          (!this.last || n.a.every((e, t) => Math.abs(e - (this.last.a[t] ?? e)) < 0.05));
        return (
          (this.last = n),
          e
            ? ((this.calmSince ??= t),
              t - this.calmSince >= On && ((this.base = n), (this.state = `listening`)),
              !1)
            : ((this.calmSince = null), !1)
        );
      }
      let r = Zn(this.base, e);
      if (!r) return !1;
      let i = this.actions.find((e) => (this.bindings[e.id] || []).some((e) => In(e, r)));
      return i
        ? ((this.message = `That input is already used for ${i.label}. Press a different one.`),
          this.#e(),
          !1)
        : ((this.message = ``),
          (this.bindings[this.current.id] = [r]),
          this.index++,
          this.#e(),
          !0);
    }
    skip() {
      if (this.done) return !1;
      if (this.current.required)
        return (
          (this.message = `${this.current.label} is required. Press a controller button to map it.`),
          !1
        );
      ((this.bindings[this.current.id] = []), (this.message = ``), this.index++, this.#e());
    }
    back() {
      this.index !== 0 &&
        (this.index--, delete this.bindings[this.current.id], (this.message = ``), this.#e());
    }
    restart() {
      ((this.index = 0), (this.bindings = {}), (this.message = ``), this.#e());
    }
    #e() {
      ((this.state = `settling`), (this.calmSince = null), (this.last = null));
    }
    result() {
      let e = {};
      for (let t of this.actions) e[t.id] = this.bindings[t.id] || [];
      return e;
    }
  },
  E = (e) => document.getElementById(e),
  $n = E(`controller-dialog`);
$n && er();
function er() {
  let e = null,
    t = `view`,
    n = 0,
    r = null,
    i = !0,
    a = `genesis`,
    o = null,
    s = ``,
    c = () => Array.from(navigator.getGamepads?.() || []).filter(Boolean),
    l = () => c().find((e) => e.index === r) || c()[0] || null,
    u = () => E(`arena`)?.getAttribute(`data-platform`) || `genesis`,
    d = () => bn(u()),
    f = (e) => (e ? `${e.index}|${An(e)}` : null),
    p = (e) => `king94-controller-banner:${Sn(e, u())}`,
    m = (e) => {
      try {
        return sessionStorage.getItem(e) === `1`;
      } catch {
        return !1;
      }
    },
    h = (e) => {
      try {
        sessionStorage.setItem(e, `1`);
      } catch {}
    };
  function g(e) {
    let t = e.mapping !== `standard`;
    ((E(`controller-banner-text`).textContent = t
      ? `${jn(e)} connected. Browsers number this controller’s buttons differently. Set it up for ${u() === `snes` ? `SNES A, B, X, Y, L, R` : `Sega A, B, C`} and the D-pad.`
      : `${jn(e)} connected. If any button feels wrong, you can set it up in about 20 seconds.`),
      (E(`controller-banner`).hidden = !1),
      (E(`controller-banner`).dataset.pad = String(e.index)));
  }
  function _(e) {
    e && Yn(e, Un(), u()) && !m(p(e)) && g(e);
  }
  (addEventListener(`gamepadconnected`, (e) => {
    ((r ??= e.gamepad.index), _(e.gamepad));
  }),
    addEventListener(`gamepaddisconnected`, (n) => {
      (n.gamepad?.index === r && ((e = null), (t = `view`), (o = null), (r = null)),
        c().length || (E(`controller-banner`).hidden = !0));
    }),
    addEventListener(`storage`, () => Wn()),
    E(`controller-banner-setup`).addEventListener(`click`, () => {
      let e = c().find((e) => String(e.index) === E(`controller-banner`).dataset.pad);
      (e && (r = e.index), re());
    }),
    E(`controller-banner-dismiss`).addEventListener(`click`, () => {
      let e = c().find((e) => String(e.index) === E(`controller-banner`).dataset.pad) || c()[0];
      (e && h(p(e)), (E(`controller-banner`).hidden = !0));
    }));
  function v(n) {
    return e && t === `learn` ? e.bindings : Jn(n, Un(), u()).bindings;
  }
  function ee(n) {
    let r = c(),
      a = r.map(f).join(`,`);
    (a !== s &&
      ((s = a),
      E(`controller-select`).replaceChildren(
        ...r.map((e, t) => new Option(`Controller ${t + 1} · ${jn(e)}`, String(e.index))),
      )),
      (E(`controller-picker`).hidden = r.length < 2),
      (E(`controller-select`).value = n ? String(n.index) : ``),
      (E(`controller-name`).textContent = n ? jn(n) : `No controller detected`));
    let o = E(`controller-steps`);
    o.children.length !== d().length &&
      o.replaceChildren(
        ...d().map((e) => {
          let t = document.createElement(`li`);
          return (
            (t.dataset.action = e.id),
            (t.innerHTML = `<span class="step-dot" aria-hidden="true"></span><strong></strong><span class="step-binding"></span>`),
            (t.querySelector(`strong`).textContent = e.label),
            t
          );
        }),
      );
    let l = n ? v(n) : {};
    d().forEach((r, i) => {
      let a = o.children[i],
        s = l[r.id],
        c = t === `learn` && e && !e.done && e.current.id === r.id;
      (a.classList.toggle(`current`, !!c),
        a.classList.toggle(`active`, !!(n && s?.some((e) => Nn(n, e)))),
        (a.querySelector(`.step-binding`).textContent = c
          ? `press now…`
          : s === void 0
            ? ``
            : s.length
              ? s.map(Fn).join(` or `)
              : `not set`));
    });
    let p;
    ((p = n
      ? t === `learn` && e && !e.done
        ? e.message || `${e.current.hint}. (${e.index + 1} of ${d().length})`
        : t === `saved`
          ? i
            ? `All set. Saved in this browser, so you only do this once. Press buttons to test them, then close.`
            : `Layout applied for this visit, but this browser would not store it (private window or blocked storage).`
          : `Press buttons to test them. Layout: ${Jn(n, Un(), u()).source === `saved` ? `your saved setup` : `standard`}.`
      : `Press any button on your controller so the browser can see it.`),
      (E(`controller-prompt`).textContent = p));
    let m = t === `learn` && e && !e.done;
    ((E(`controller-skip`).hidden = !m || !!e?.current?.required),
      (E(`controller-back`).hidden = !m || e.index === 0),
      (E(`controller-remap`).hidden = m || !n),
      (E(`controller-remap`).textContent =
        t === `view` && n && Yn(n, Un(), u()) ? `Set up buttons` : `Start over`),
      (E(`controller-reset`).hidden = m || !n || Yn(n, Un(), u())));
  }
  function y(i) {
    if (((n = 0), !$n.open)) return;
    a !== u() && ((e = null), (t = `view`), (a = u()), E(`controller-steps`).replaceChildren());
    let s = l();
    if (
      (e && o !== f(s) && ((e = null), (t = `view`), (o = null)),
      s && (r = s.index),
      s && !e && t === `view` && Yn(s, Un(), u()) && te(s),
      s && t === `learn` && e)
    ) {
      let t = e.update(s, i);
      e.done ? ne(s) : t && (E(`controller-prompt`).dataset.flash = String(i));
    }
    (ee(s), (n = requestAnimationFrame(y)));
  }
  function te(n = l()) {
    n && ((a = u()), (o = f(n)), (e = new Qn(d())), (t = `learn`));
  }
  function ne(n) {
    if (a !== u() || o !== f(n)) {
      ((e = null), (t = `view`));
      return;
    }
    ((i = Kn(Sn(n, u()), jn(n), e.result())),
      (t = `saved`),
      (e = null),
      (E(`controller-banner`).hidden = !0));
  }
  function re() {
    $n.open ||
      ((wn.capturing = !0),
      (e = null),
      (t = `view`),
      (i = !0),
      (a = u()),
      typeof $n.showModal == `function` ? $n.showModal() : $n.setAttribute(`open`, ``),
      E(`controller-close`).focus?.(),
      document.dispatchEvent(new Event(`king94-controller-open`)),
      cancelAnimationFrame(n),
      (n = requestAnimationFrame(y)));
  }
  function ie() {
    wn.capturing &&
      ((wn.capturing = !1),
      (e = null),
      (t = `view`),
      cancelAnimationFrame(n),
      (n = 0),
      document.dispatchEvent(new Event(`king94-controller-close`)));
  }
  function ae() {
    $n.open && (typeof $n.close == `function` ? $n.close() : ($n.removeAttribute(`open`), ie()));
  }
  ($n.addEventListener(`close`, ie),
    E(`controller-setup`).addEventListener(`click`, re),
    E(`controller-before-play`)?.addEventListener(`click`, re),
    E(`controller-in-game`)?.addEventListener(`click`, re),
    E(`controller-close`).addEventListener(`click`, ae),
    E(`controller-skip`).addEventListener(`click`, () => {
      e?.skip();
    }),
    E(`controller-back`).addEventListener(`click`, () => {
      e?.back();
    }),
    E(`controller-remap`).addEventListener(`click`, () => te()),
    E(`controller-select`).addEventListener(`change`, () => {
      let n = c().find((e) => String(e.index) === E(`controller-select`).value);
      n && ((r = n.index), (e = null), (o = null), (t = `view`));
    }),
    E(`controller-reset`).addEventListener(`click`, () => {
      let n = l();
      n &&
        (qn(Sn(n, u())),
        (t = `view`),
        (e = null),
        (E(`controller-prompt`).textContent =
          `Saved setup removed. The standard layout is active.`));
    }));
}
var tr = 1200;
function nr({
  doc: e,
  wrap: t,
  canvas: n = null,
  button: r = null,
  hint: i = null,
  setTimer: a = setTimeout,
  clearTimer: o = clearTimeout,
}) {
  let s = 0,
    c = !1,
    l = 0,
    u = () => e.fullscreenElement === t || e.webkitFullscreenElement === t,
    d = () => t.classList.contains(`pseudo-fullscreen`),
    f = () => u() || d();
  function p() {
    u() && t.classList.remove(`pseudo-fullscreen`);
    let c = f();
    (r &&
      ((r.textContent = c ? `Exit full screen` : `Full screen`),
      r.setAttribute(`aria-pressed`, String(c))),
      t.classList.toggle(`is-fullscreen`, c),
      e.documentElement?.classList.toggle(`fullscreen-lock`, c),
      i &&
        (o(s),
        (i.hidden = !c),
        c &&
          (s = a(() => {
            i.hidden = !0;
          }, 3e3))),
      c && n?.focus?.());
  }
  async function m() {
    c = !0;
    let e = ++l,
      n = t.requestFullscreen || t.webkitRequestFullscreen;
    if (n) {
      let r = Promise.resolve()
          .then(() => n.call(t, { navigationUI: `hide` }))
          .then(
            () => `ok`,
            () => `denied`,
          ),
        i,
        s = await Promise.race([
          r,
          new Promise((e) => {
            i = a(() => e(`timeout`), tr);
          }),
        ]);
      if ((o(i), e !== l || !c)) return;
      if (s === `ok` || u()) {
        p();
        return;
      }
    }
    (t.classList.add(`pseudo-fullscreen`), p());
  }
  async function h() {
    if (((c = !1), l++, t.classList.remove(`pseudo-fullscreen`), u()))
      try {
        await (e.exitFullscreen || e.webkitExitFullscreen).call(e);
      } catch {}
    p();
  }
  let g = () => (f() || c ? h() : m()),
    _ = (e) => /^(INPUT|SELECT|TEXTAREA)$/.test(e?.tagName || ``) || e?.isContentEditable;
  function v() {
    if (u() && !c) {
      h();
      return;
    }
    (!u() && !d() && ((c = !1), l++), p());
  }
  return (
    e.addEventListener(`fullscreenchange`, v),
    e.addEventListener(`webkitfullscreenchange`, v),
    e.addEventListener(`keydown`, (t) => {
      if (t.key === `Escape` && d()) {
        h();
        return;
      }
      (t.key === `f` || t.key === `F`) &&
        !t.ctrlKey &&
        !t.metaKey &&
        !t.altKey &&
        !t.repeat &&
        !_(t.target) &&
        !e.querySelector?.(`dialog[open]`) &&
        (t.preventDefault(), g());
    }),
    r?.addEventListener(`click`, () => {
      g();
    }),
    n?.addEventListener(`dblclick`, () => {
      g();
    }),
    p(),
    { toggle: g, enter: m, exit: h, isActive: f }
  );
}
typeof document < `u` &&
  document.getElementById(`screen-wrap`) &&
  nr({
    doc: document,
    wrap: document.getElementById(`screen-wrap`),
    canvas: document.getElementById(`game-canvas`),
    button: document.getElementById(`fullscreen-toggle`),
    hint: document.getElementById(`fullscreen-hint`),
  });
var rr = document.getElementById(`help-dialog`);
if (rr) {
  let e = null;
  function t(t) {
    rr.open ||
      ((e = t.currentTarget),
      typeof rr.showModal == `function` ? rr.showModal() : rr.setAttribute(`open`, ``),
      document.getElementById(`help-close`).focus(),
      document.dispatchEvent(new Event(`king94-help-open`)));
  }
  function n() {
    (document.dispatchEvent(new Event(`king94-help-close`)), e?.focus());
  }
  for (let e of [`help-open`, `help-toolbar`, `help-in-game`])
    document.getElementById(e)?.addEventListener(`click`, t);
  (document.getElementById(`help-close`).addEventListener(`click`, () => {
    typeof rr.close == `function` ? rr.close() : (rr.removeAttribute(`open`), n());
  }),
    rr.addEventListener(`close`, n),
    rr.addEventListener(`click`, (e) => {
      let t = e.target.closest(`[data-help-topic]`);
      if (!t) return;
      let n = document.getElementById(t.dataset.helpTopic);
      n &&
        rr.contains(n) &&
        ((n.open = !0), n.scrollIntoView({ block: `nearest` }), n.querySelector(`summary`).focus());
    }));
}
var ir = {
    ArrowUp: 16,
    ArrowDown: 32,
    ArrowLeft: 64,
    ArrowRight: 128,
    KeyA: 2,
    KeyS: 1,
    KeyD: 256,
    Enter: 8,
  },
  ar = { KeyI: 16, KeyK: 32, KeyJ: 64, KeyL: 128, KeyZ: 2, KeyX: 1, KeyC: 256, ShiftRight: 8 },
  or = { ...ir, KeyD: 0, KeyQ: 512, KeyW: 1024, KeyE: 2048, KeyR: 4 },
  sr = { ...ar, KeyC: 0, KeyU: 512, KeyO: 1024, KeyN: 2048, KeyM: 4 },
  cr = class {
    constructor(e, t = () => `genesis`) {
      ((this.platform = t),
        (this.held = new Set()),
        (this.active = e),
        (this.awaitRelease = new Set()),
        (this.dialogOpen = () => !!document.querySelector?.(`dialog[open]`)),
        addEventListener(`keydown`, (e) => {
          !wn.capturing &&
            !this.dialogOpen() &&
            this.active() &&
            !/^(INPUT|SELECT|TEXTAREA|BUTTON|A|SUMMARY)$/.test(e.target.tagName) &&
            !e.target.isContentEditable &&
            (ir[e.code] || ar[e.code] || or[e.code] || sr[e.code]) &&
            (e.preventDefault(), this.held.add(e.code));
        }),
        addEventListener(`keyup`, (e) => this.held.delete(e.code)),
        addEventListener(`blur`, () => this.held.clear()),
        document.addEventListener(`focusin`, (e) => {
          (/^(INPUT|SELECT|TEXTAREA|BUTTON|A|SUMMARY)$/.test(e.target?.tagName || ``) ||
            e.target?.isContentEditable) &&
            this.held.clear();
        }));
      let n = () => {
        this.held.clear();
        for (let e of Array.from(navigator.getGamepads?.() || []).filter(Boolean))
          this.awaitRelease.add(e.index);
      };
      (document.addEventListener(`king94-controller-close`, n),
        document.addEventListener(`king94-help-close`, n));
    }
    mask(e = 0) {
      let t = Array.from(navigator.getGamepads?.() || []).filter(Boolean),
        n = t[e];
      if (wn.capturing || this.dialogOpen()) {
        this.held.clear();
        for (let e of t) this.awaitRelease.add(e.index);
        return 0;
      }
      let r = 0;
      for (let t of this.held)
        r |= (this.platform() === `snes` ? (e ? sr : or) : e ? ar : ir)[t] || 0;
      let i = n ? Pn(n, Jn(n, Un(), this.platform()).bindings, this.platform()) : 0;
      if (n && this.awaitRelease.has(n.index)) {
        if (i) return r;
        this.awaitRelease.delete(n.index);
      }
      return ((r |= i), r);
    }
  };
var pr = class {
    constructor() {
      ((this.context = null), (this.next = 0), (this.attempt = 0), (this.gain = null));
      let v = NaN;
      try {
        v = parseFloat((localStorage.getItem(`emu-debugger-volume`) ?? localStorage.getItem(`nhl94online-volume`)));
      } catch {}
      ((this.volume = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1),
        (this.muted = !1));
    }
    setVolume(v, m) {
      ((this.volume = Math.min(1, Math.max(0, +v || 0))),
        m !== void 0 && (this.muted = !!m));
      try {
        localStorage.setItem(`emu-debugger-volume`, String(this.volume));
      } catch {}
      this.applyVolume();
    }
    applyVolume() {
      if (!this.gain) return;
      let v = this.muted ? 0 : this.volume * this.volume;
      try {
        this.gain.gain.setTargetAtTime(v, this.context.currentTime, 0.01);
      } catch {
        this.gain.gain.value = v;
      }
    }
    async unlock() {
      let e = ++this.attempt,
        t;
      try {
        let n = window.AudioContext || window.webkitAudioContext;
        if (!n) return !1;
        this.context ||= new n();
        let r = await Promise.race([
          Promise.resolve(this.context.resume()).then(
            () => !0,
            () => !1,
          ),
          new Promise((e) => {
            t = setTimeout(() => e(!1), 750);
          }),
        ]);
        return (
          e === this.attempt &&
          ((this.next = this.context.currentTime), r && this.context.state === `running`)
        );
      } catch {
        return !1;
      } finally {
        clearTimeout(t);
      }
    }
    push(e, t) {
      let n = this.context;
      if (n && n.state === `running` && e.length && !(this.next > n.currentTime + 0.15))
        try {
          let r = e.length / 2,
            i = n.createBuffer(2, r, t);
          for (let t = 0; t < 2; t++) {
            let n = i.getChannelData(t);
            for (let i = 0; i < r; i++) n[i] = e[i * 2 + t] / 32768;
          }
          let a = n.createBufferSource();
          ((a.buffer = i),
            this.gain ||
              ((this.gain = n.createGain()), this.gain.connect(n.destination), this.applyVolume()),
            a.connect(this.gain),
            (this.next = Math.max(this.next, n.currentTime + 0.015)),
            a.start(this.next),
            (this.next += i.duration));
        } catch {
          this.next = 0;
        }
    }
    suspend() {
      this.attempt++;
      try {
        Promise.resolve(this.context?.suspend()).catch(() => {});
      } catch {}
      this.next = 0;
    }
  };
// ---------- emulator app: system + ROM setup, game loop, replays ----------
// Phases: lobby (setup) -> preparing (booting the core) -> playing.
var PLATFORMS = Object.freeze({
    genesis: {
      name: `Sega Genesis`,
      tag: `GENESIS`,
      emu: `emu.js`,
      core: [`core/gpgx.wasm`, `core/gpgx.mjs`],
      mask: 507,
      ram: { base: 0xff0000, size: 0x10000, big: !0 },
      note: `Work RAM is $FF0000–$FFFFFF (64 KiB).`,
      // Builds before 2026-10 also hashed emu.js and boot.js; their saves and replays still load.
      legacyCoreHashes: [`6e7886e6d2968d4a4e5082b280b7fc60771261be5e06da19ae4f318f97d6aae1`],
    },
    snes: {
      name: `Super Nintendo`,
      tag: `SNES`,
      emu: `snes.js`,
      core: [`core/snes.wasm`, `core/snes.mjs`],
      mask: 3839,
      ram: { base: 0x7e0000, size: 0x20000, big: !1 },
      note: `Work RAM is $7E0000–$7FFFFF (128 KiB).`,
      legacyCoreHashes: [`b7af4a486902487b541862c0d98be67ade00610ddb4a7c2321e4871e1067236b`],
    },
  }),
  REPLAY_FORMATS = [`EMU-REPLAY`, `NHL94-REPLAY`];
function platformInfo(p) {
  if (typeof p != `string` || !Object.hasOwn(PLATFORMS, p)) throw Error(`Unsupported system.`);
  return PLATFORMS[p];
}
function canonical(e) {
  return Array.isArray(e)
    ? `[${e.map(canonical).join(`,`)}]`
    : e && typeof e == `object`
      ? `{${Object.keys(e)
          .sort()
          .map((t) => `${JSON.stringify(t)}:${canonical(e[t])}`)
          .join(`,`)}}`
      : JSON.stringify(e);
}
async function sha256Hex(e) {
  let t = e instanceof Uint8Array ? e : new TextEncoder().encode(canonical(e)),
    n = await crypto.subtle.digest(`SHA-256`, t);
  return Array.from(new Uint8Array(n), (e) => e.toString(16).padStart(2, `0`)).join(``);
}

// Run-length input recorder for replays: runs of [p1 mask, p2 mask, frame count].
var inRange = (e, t, n) => Number.isSafeInteger(e) && e >= t && e <= n;
class Recorder {
  constructor(meta) {
    ((this.meta = meta), (this.runs = []), (this.frames = 0), (this.finished = !1), (this.inputChars = 0));
  }
  push(frame, p1, p2) {
    if (this.finished) return;
    if (frame !== this.frames) throw Error(`Recorder expected frame ${this.frames}, got ${frame}.`);
    if (!inRange(p1, 0, 4095) || !inRange(p2, 0, 4095)) throw Error(`Recorder got an invalid input mask.`);
    let last = this.runs[this.runs.length - 1],
      same = last && last[0] === p1 && last[1] === p2,
      cost = same
        ? (last[2] + 1).toString(36).length - last[2].toString(36).length
        : p1.toString(16).length + p2.toString(16).length + 3 + +!!last;
    if (this.frames >= 4e5 || this.inputChars + cost > 45e4)
      throw ((this.finished = !0), (this.runs = []), Error(`Recording reached its size limit; the game can continue.`));
    ((this.inputChars += cost), same ? last[2]++ : this.runs.push([p1, p2, 1]), this.frames++);
  }
  export(min = 60) {
    if (this.frames < min) return null;
    let m = this.meta;
    return {
      frames: this.frames,
      config: m.config,
      coreHash: m.coreHash,
      startStateHash: m.startStateHash,
      startState: m.startState || null,
      romCrc: m.romCrc,
      romName: m.romName,
      inputs: this.runs.map(([a, b, n]) => `${a.toString(16)}.${b.toString(16)}.${n.toString(36)}`).join(` `),
    };
  }
}

var BASE = `${globalThis.__BASE}`,
  k = (e) =>
    document.getElementById(e) ||
    (__stubs[e] ??= Object.assign(document.createElement(`div`), { hidden: !0 })),
  audio = new pr(),
  keys = new cr(
    () => phase === `playing` && !paused,
    () => config.platform,
  ),
  phase = `lobby`,
  config = { version: 2, platform: `genesis` },
  rom = null, // ROM bytes for the selected system
  romSha = null,
  romError = null,
  romSeq = 0,
  loading = !1, // reading a ROM or switching system
  platformChange = Promise.resolve(),
  emuModule = null, // game/emu.js or game/snes.js
  coreHash = null,
  coreLoad = null,
  emu = null, // the running emulator instance
  runId = null,
  generation = 0,
  starting = !1,
  startSeq = 0,
  raf = 0,
  lastTs = null,
  acc = 0,
  paused = !1,
  recorder = null,
  startStateHash = null,
  controllerPause = null,
  helpPause = null,
  freezes = new Map(), // frozen work-RAM bytes: address -> value, rewritten after every frame
  ramEdited = !1; // RAM was changed this game, so replay recording has stopped

function setStatus(e) {
  k(`setup-status`).textContent = e;
}
function overlay(e, show = !0) {
  ((k(`game-message`).textContent = e), (k(`game-overlay`).hidden = !show), loading || phase === `preparing` || hideLoader());
}
function hideLoader() {
  k(`cartridge-loader`).hidden = !0;
}
function showMessage(e) {
  ((k(`cartridge-loader`).hidden = !0), (k(`game-overlay`).hidden = !1), (k(`game-message`).textContent = e));
}

// Refresh every piece of setup and status UI from the current state.
function Z() {
  __syncRom();
  let info = platformInfo(config.platform),
    busy = phase !== `lobby` || starting || loading,
    playing = phase === `playing`,
    sel = k(`platform-select`);
  (sel.options.length !== Object.keys(PLATFORMS).length &&
    sel.replaceChildren(...Object.entries(PLATFORMS).map(([id, p]) => new Option(p.name, id))),
    (sel.value = config.platform),
    (sel.disabled = busy),
    (k(`platform-note`).textContent = info.note),
    k(`arena`).setAttribute(`data-platform`, config.platform),
    k(`arena`).setAttribute(`data-phase`, phase),
    (k(`start-match`).disabled = busy || !rom),
    (k(`start-match`).textContent = loading
      ? `LOADING GAME…`
      : starting || phase === `preparing`
        ? `STARTING…`
        : playing
          ? `GAME IN PROGRESS`
          : `START GAME`),
    (k(`return-select`).disabled = !playing),
    (k(`pause-match`).disabled = !playing),
    (k(`pause-match`).textContent = paused ? `Resume` : `Pause`),
    (k(`session-status`).textContent = playing
      ? paused
        ? `GAME PAUSED`
        : `GAME RUNNING`
      : phase === `preparing`
        ? `STARTING GAME`
        : `NO GAME IN PROGRESS`),
    k(`screen-wrap`).classList.toggle(`gameplay-view`, playing),
    (k(`pause-badge`).hidden = !(playing && paused)),
    (k(`step-frame`).disabled = !playing),
    (k(`game-build-title`).textContent = rom
      ? `Your game is ready`
      : romError
        ? `ROM could not be used`
        : loading
          ? `Your game is loading`
          : `ROM needed`),
    (k(`game-build-state`).textContent = rom ? `READY` : romError ? `ERROR` : loading ? `CHECKING` : `NEEDED`));
  let state = rom ? `READY TO START` : `CHOOSE ROM`,
    copy = rom
      ? `Ready. Start boots the game from power-on. Two keyboard layouts or controllers work on this computer.`
      : `Choose your game ROM file from this computer in the Game ROM box above.`;
  (romError
    ? ((state = `NEEDS ATTENTION`), (copy = `That ROM could not be used. Choose a different ROM file.`))
    : loading &&
      phase === `lobby` &&
      ((state = `LOADING GAME`), (copy = `Wait for the game to finish loading. Start unlocks when it is ready.`)),
    phase === `preparing`
      ? ((state = `STARTING GAME`), (copy = `Starting the emulator. Keep this tab open.`))
      : playing &&
        ((state = paused ? `GAME PAUSED` : `GAME RUNNING`),
        (copy = paused
          ? `Choose Resume below the game to continue.`
          : `Game controls, save states and the RAM viewer are below the game.`)),
    (k(`ready-check-title`).textContent = phase === `lobby` ? `Get ready` : `Game status`),
    (k(`ready-state`).textContent = state),
    (k(`ready-copy`).textContent = copy),
    __rp ||
      (k(`connection-status`).textContent = playing
        ? `Game running · both controller ports on this computer`
        : `No game running`),
    (k(`screen-tag`).textContent = info.tag));
}

function pushInput(frame, p1, p2) {
  if (recorder)
    try {
      recorder.push(frame, p1, p2);
    } catch (e) {
      (console.error(`Recording stopped`, e), (recorder = null));
    }
}
function finishRecording() {
  let r = recorder;
  if (((recorder = null), r))
    try {
      ((__lastSegs = [...__segs, r.export(1)].filter(Boolean)), (__segs = []));
    } catch (e) {
      console.error(`Recording failed`, e);
    }
}
function resetToLobby() {
  (finishRecording(),
    (__rp = null),
    generation++,
    cancelAnimationFrame(raf),
    (raf = 0),
    audio.suspend(),
    emu?.dispose(),
    (emu = null),
    loading || hideLoader(),
    (phase = `lobby`),
    (paused = !1),
    (runId = null),
    freezes.clear(),
    (ramEdited = !1),
    keys.held.clear(),
    startSeq++,
    (starting = !1));
}
function endGame() {
  phase === `playing` &&
    (resetToLobby(),
    overlay(`Game ended. Start another when ready.`),
    setStatus(`Game ended. Start another when ready.`),
    Z());
}
function fail(e) {
  console.error(e);
  let msg = e?.message || `The game stopped because of an error.`;
  (resetToLobby(), setStatus(msg), overlay(msg), Z());
}
function guard(fn) {
  return (...a) =>
    Promise.resolve()
      .then(() => fn(...a))
      .catch(fail);
}

// Load the emulator module for the selected system and fingerprint its core build.
async function loadCore() {
  return (coreLoad ||= (async () => {
    let info = platformInfo(config.platform);
    emuModule = await import(`${BASE}game/` + info.emu);
    let files = await Promise.all(
      info.core.map(async (f) => {
        let r = await fetch(`${BASE}game/` + f);
        if (!r.ok) throw Error(`Missing emulator file: game/${f}`);
        return sha256Hex(new Uint8Array(await r.arrayBuffer()));
      }),
    );
    coreHash = await sha256Hex({ version: emuModule.CORE_VERSION, files });
  })());
}
function coreHashes() {
  return [coreHash, ...platformInfo(config.platform).legacyCoreHashes].filter(Boolean);
}
async function checkRom(bytes) {
  let seq = ++romSeq;
  if (
    ((rom = null),
    (romSha = null),
    (romError = null),
    Z(),
    (k(`rom-status`).textContent = `Checking your ROM file…`),
    bytes.byteLength < 16384 || bytes.byteLength > 8388608)
  )
    throw Error(`That file does not look like a game ROM.`);
  await loadCore();
  let sha = await emuModule.sha256Hex(emuModule.normalizeROM ? emuModule.normalizeROM(bytes) : bytes);
  seq === romSeq &&
    ((rom = bytes),
    (romSha = sha),
    (k(`rom-status`).textContent = `ROM loaded (${(bytes.byteLength / 1048576).toFixed(2)} MB). It stays on this computer.`),
    setStatus(`Game ready. Choose Start to boot it.`),
    Z());
}
// Show the ROM already chosen for this system (each system keeps its own until reload).
async function showRomForPlatform() {
  let p = config.platform,
    bytes = __roms.get(p);
  if (!bytes) {
    ((k(`rom-status`).textContent = `Pick the ROM file for this game from your computer. It never leaves your device, and any ROM is accepted.`),
      hideLoader(),
      overlay(`Choose your ROM file to begin.`));
    return;
  }
  try {
    (showMessage(`Checking your game…`), await checkRom(bytes));
    if (config.platform !== p || !rom) return;
    (hideLoader(), overlay(`Your ROM is ready. Choose Start to play.`));
  } catch (e) {
    throw (showMessage(e.message + ` Reload to try again.`), e);
  }
}

async function startGame() {
  if (phase !== `lobby` || starting) return;
  let seq = ++startSeq;
  ((starting = !0), Z());
  try {
    if ((await audio.unlock(), seq !== startSeq || phase !== `lobby`)) return;
    if (!rom || loading) throw Error(`The game ROM is not loaded yet.`);
    let gen = ++generation;
    ((phase = `preparing`), (runId = crypto.randomUUID()), Z(), showMessage(`Starting your game…`));
    if ((await loadCore(), gen !== generation)) return;
    let e = await (emuModule.Genesis || emuModule.SNES).create(rom, {
      locateFile: (f) => (f.endsWith(`.wasm`) ? `${BASE}game/core/` + f : f),
    });
    if (gen !== generation) return e.dispose();
    emu = e;
    if (((startStateHash = await sha256Hex(emu.save().bytes)), gen !== generation)) return;
    ((recorder = new Recorder({
      config: structuredClone(config),
      romSha256: romSha,
      coreHash,
      startStateHash,
      romCrc: __myRom()?.crc,
      romName: __romNames.get(config.platform) || ``,
    })),
      (__segs = []),
      await __rpApply(),
      (phase = `playing`),
      (paused = !1),
      (lastTs = null),
      (acc = 0),
      k(`controller-dialog`).open && onControllerOpen(),
      k(`help-dialog`).open && onHelpOpen(),
      hideLoader(),
      overlay(``, !1),
      !k(`controller-dialog`).open && !k(`help-dialog`).open && k(`game-canvas`).focus(),
      setStatus(`Your game is running.`),
      Z(),
      (raf = requestAnimationFrame(frameLoop)));
  } finally {
    seq === startSeq && ((starting = !1), Z());
  }
}
// Run one emulator frame: replay input when a replay is playing, otherwise the
// keyboard / controllers. Frozen RAM bytes are written back after the frame.
function runFrame(mask = platformInfo(config.platform).mask) {
  if (__rp) {
    if (__rp.i >= __rp.n) return (__rpDone(), !1);
    (__rp.loads[__rp.i] && emu.load(__rp.loads[__rp.i]),
      emu.step(__rp.p1[__rp.i], __rp.p2[__rp.i]),
      applyFreezes(),
      __rp.i++,
      __rp.i % 120 === 0 && (__rp.hashes[__rp.i] = emu.checksum() >>> 0),
      __rp.i % 30 === 0 && (k(`connection-status`).textContent = `Replay · frame ${__rp.i} of ${__rp.n}`));
    return !0;
  }
  let p1 = keys.mask(0) & mask,
    p2 = keys.mask(1) & mask;
  return (emu.step(p1, p2), applyFreezes(), pushInput(recorder?.frames, p1, p2), !0);
}
function applyFreezes() {
  for (let [a, v] of freezes) emu.writeByte(a, v);
}
function setPaused(on) {
  phase !== `playing` ||
    paused === !!on ||
    ((paused = !!on),
    keys.held.clear(),
    paused ? audio.suspend() : (audio.unlock(), (lastTs = null), (acc = 0)),
    Z());
}
// Pause (if needed) and run n frames, then show the last one.
function stepFrames(n = 1) {
  if (phase !== `playing` || !emu) return 0;
  (setPaused(!0), (n = Math.max(1, Math.min(600, n | 0))));
  let done = 0;
  try {
    for (; done < n && runFrame(); ) done++;
    drawFrame();
  } catch (e) {
    fail(e);
  }
  return (Z(), done);
}
// Work-RAM writes from the debugger. Throws when the range is outside work RAM.
function ramRange(addr, n) {
  let r = platformInfo(config.platform).ram;
  if (!emu) throw Error(`Start a game first.`);
  if (!Number.isSafeInteger(addr) || n < 1 || addr < r.base || addr + n > r.base + r.size)
    throw Error(`Outside work RAM ($${r.base.toString(16).toUpperCase()}-$${(r.base + r.size - 1).toString(16).toUpperCase()}).`);
}
function noteRamWrite() {
  ramEdited ||
    ((ramEdited = !0),
    recorder &&
      !__rp &&
      (finishRecording(),
      setStatus(`RAM was changed, so replay recording stopped. Save replay keeps everything before the change.`)));
}
function writeRam(addr, bytes) {
  ramRange(addr, bytes.length);
  noteRamWrite();
  bytes.forEach((b, i) => {
    let a = addr + i;
    (emu.writeByte(a, b), freezes.has(a) && freezes.set(a, b & 255));
  });
}
function freezeRam(addr, bytes) {
  (ramRange(addr, bytes.length), noteRamWrite(), bytes.forEach((b, i) => freezes.set(addr + i, b & 255)), applyFreezes());
}
function unfreezeRam(addr, n = 1) {
  for (let i = 0; i < n; i++) freezes.delete(addr + i);
}
function drawFrame() {
  let v = emu.video();
  if (!v) return;
  let c = k(`game-canvas`);
  (k(`screen-wrap`).classList.toggle(`wide-game-screen`, v.width === 320),
    (c.width !== v.width || c.height !== v.height) && ((c.width = v.width), (c.height = v.height)),
    c.getContext(`2d`, { alpha: !1 }).putImageData(new ImageData(v.data, v.width, v.height), 0, 0));
}
// Fixed-step loop: run whole emulator frames for the time that has passed (at most 5 per tick).
function frameLoop(ts) {
  if (phase === `playing`)
    try {
      if (!Number.isFinite(ts)) {
        ((lastTs = null), (raf = requestAnimationFrame(frameLoop)));
        return;
      }
      let dt = lastTs === null ? 0 : Math.max(0, ts - lastTs);
      if (((lastTs = ts), !paused)) {
        let step = 1e3 / (emu.fps ?? 59.922743),
          mask = platformInfo(config.platform).mask;
        acc = Math.min(acc + dt, step * 5);
        for (let n = 0; acc >= step && n++ < 5; ) {
          let ran = runFrame(mask);
          if (!ran) {
            acc = 0;
            break;
          }
          (audio.push(emu.audio(), emu.audioRate), (acc -= step));
        }
        drawFrame();
      }
      raf = requestAnimationFrame(frameLoop);
    } catch (e) {
      fail(e);
    }
}

async function switchPlatform(p) {
  if ((await platformChange.catch(() => {}), phase !== `lobby` || starting || loading)) return;
  (platformInfo(p),
    (loading = !0),
    hideLoader(),
    romSeq++,
    (rom = null),
    (romSha = null),
    (romError = null),
    (emuModule = coreHash = coreLoad = null),
    (config = { ...config, platform: p }),
    keys.held.clear(),
    Z());
  try {
    ((platformChange = showRomForPlatform()), await platformChange);
  } catch (e) {
    ((romError = e.message), (k(`rom-status`).textContent = romError));
  } finally {
    ((loading = !1), Z());
  }
}

var scanlines = !1;
for (let id of [`scanlines-toggle`, `scanlines-in-game`])
  k(id).addEventListener(`click`, () => {
    ((scanlines = !scanlines), (k(`scanline-overlay`).hidden = !scanlines));
    for (let b of [`scanlines-toggle`, `scanlines-in-game`])
      (k(b).setAttribute(`aria-pressed`, String(scanlines)), (k(b).textContent = `Scanlines: ${scanlines ? `on` : `off`}`));
  });
k(`platform-select`).addEventListener(
  `change`,
  guard(() => switchPlatform(k(`platform-select`).value)),
);
k(`start-match`).addEventListener(`click`, guard(startGame));
k(`return-select`).addEventListener(`click`, guard(endGame));
k(`step-frame`).addEventListener(`click`, () => stepFrames(1));
k(`pause-match`).addEventListener(
  `click`,
  guard(() => setPaused(!paused)),
);
// The controller and help dialogs pause the game while they are open.
function onControllerOpen() {
  (keys.held.clear(),
    phase === `playing` &&
      !controllerPause &&
      ((controllerPause = { generation, runId, wasPaused: paused }), (paused = !0), audio.suspend()),
    (k(`controller-session-note`).textContent = controllerPause
      ? `Your game is paused while you map. Close this panel to return.`
      : `Change buttons here at any time. No restart needed.`));
}
function onControllerClose() {
  (keys.held.clear(),
    (lastTs = null),
    (acc = 0),
    controllerPause &&
      controllerPause.generation === generation &&
      controllerPause.runId === runId &&
      ((paused = controllerPause.wasPaused), paused || audio.unlock()),
    (controllerPause = null),
    phase === `playing` && k(`game-canvas`).focus(),
    Z());
}
function onHelpOpen() {
  (keys.held.clear(),
    phase === `playing` &&
      !helpPause &&
      ((helpPause = { generation, runId, wasPaused: paused }), (paused = !0), audio.suspend()),
    (k(`help-session-note`).textContent = helpPause
      ? `Your game is paused while Help is open. Choose Done to return.`
      : `Choose a topic below. You can return to Help at any time.`));
}
function onHelpClose() {
  (keys.held.clear(),
    (lastTs = null),
    (acc = 0),
    helpPause &&
      helpPause.generation === generation &&
      helpPause.runId === runId &&
      ((paused = helpPause.wasPaused), paused || audio.unlock()),
    (helpPause = null),
    Z());
}
(document.addEventListener(`king94-controller-open`, onControllerOpen),
  document.addEventListener(`king94-controller-close`, onControllerClose),
  document.addEventListener(`king94-help-open`, onHelpOpen),
  document.addEventListener(`king94-help-close`, onHelpClose),
  document.addEventListener(`visibilitychange`, () => {
    document.hidden && phase === `playing` && !paused && k(`pause-match`).click();
  }),
  document.addEventListener(`click`, (e) => {
    phase === `playing` &&
      !k(`controller-dialog`).open &&
      !e.target.closest?.(`.arena-tools,button,a,input,select,textarea,summary`) &&
      k(`game-canvas`).focus();
  }),
  addEventListener(`pagehide`, finishRecording));

async function __loadRom(bytes) {
  if (loading || phase !== `lobby`) return;
  let p = config.platform;
  ((loading = !0), (romError = null), Z());
  try {
    if ((__roms.set(p, bytes), showMessage(`Checking your game…`), await checkRom(bytes), config.platform !== p || !rom)) return;
    (hideLoader(), overlay(`Your ROM is ready. Choose Start to play.`));
  } catch (e) {
    (__roms.delete(p),
      (rom = null),
      (romSha = null),
      (romError = e?.message || `The ROM could not be loaded.`),
      (k(`rom-status`).textContent = romError),
      showMessage(romError + ` Choose a different ROM file.`),
      setStatus(romError));
  } finally {
    ((loading = !1), Z());
  }
}
k(`rom-file`).addEventListener(`change`, async (e) => {
  let f = e.target.files[0];
  if (f) {
    try {
      if (f.size > 8388608) throw Error(`That file does not look like a game ROM.`);
      (__romNames.set(config.platform, f.name), await __loadRom(new Uint8Array(await f.arrayBuffer())));
    } catch (err) {
      ((romError = err.message), (k(`rom-status`).textContent = romError), setStatus(romError), Z());
    }
    e.target.value = ``;
  }
});
// Browsers only start audio after a click or key press.
for (let ev of [`pointerdown`, `keydown`]) {
  let h = async () => {
    try {
      (await audio.unlock()) && (removeEventListener(`pointerdown`, h, !0), removeEventListener(`keydown`, h, !0));
    } catch {}
  };
  addEventListener(ev, h, !0);
}

// Hooks for the other scripts (save states, RAM viewer, emulator control).
globalThis.__arena = Object.freeze({
  get emu() {
    return emu;
  },
  get phase() {
    return phase;
  },
  get platform() {
    return config.platform;
  },
  get coreVersion() {
    return emuModule?.CORE_VERSION;
  },
  get coreHash() {
    return coreHash;
  },
  get coreHashes() {
    return coreHashes();
  },
  status(e) {
    setStatus(e);
  },
  loadRom: __loadRom,
  get romName() {
    return __romNames.get(config.platform) || ``;
  },
  snapshot() {
    return emu.save();
  },
  // debugger
  get paused() {
    return paused;
  },
  get frame() {
    return emu ? emu.frames : 0;
  },
  get ram() {
    return { ...platformInfo(config.platform).ram };
  },
  get recording() {
    return !!recorder;
  },
  setPaused,
  step: stepFrames,
  writeRam,
  freezeRam,
  unfreezeRam,
  isFrozen(a) {
    return freezes.has(a);
  },
  afterLoad() {
    ((lastTs = null), (acc = 0), __restartRecording(), keys.held.clear());
    try {
      drawFrame();
    } catch {}
  },
});
globalThis.__setEmuVolume = (v, m) => audio.setVolume(v, m);
globalThis.__getEmuVolume = () => ({ volume: audio.volume, muted: audio.muted });

// ---------- replays ----------
var __rp = null,
  __segs = [],
  __lastSegs = null;
// A save state loaded mid-game starts a new replay segment that begins from that state.
function __restartRecording() {
  let old = recorder;
  if (__rp || !old || ramEdited) {
    recorder = null;
    return;
  }
  let seg = old.export(1);
  (seg && __segs.push(seg), (recorder = null));
  try {
    let st = emu.save();
    recorder = new Recorder({
      ...old.meta,
      startState: { bytes: new Uint8Array(st.bytes), frame: st.frame },
      startStateHash: null,
    });
  } catch (e) {
    console.error(`Could not restart recording`, e);
  }
}
async function __rpApply() {
  if (__rp && ((recorder = null), __rp.startHash && startStateHash !== __rp.startHash))
    throw ((__rp = null), Error(`This replay does not match your ROM or emulator build, so it cannot be played back.`));
}
function __rpDone() {
  __rp.done ||
    ((__rp.done = !0),
    setStatus(`Replay finished. Choose End game to return to setup.`),
    (k(`connection-status`).textContent = `Replay finished · ${__rp.n} frames`));
}
function __b64(u8) {
  let out = ``;
  for (let i = 0; i < u8.length; i += 32768) out += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return btoa(out);
}
function __unb64(s) {
  let bin = atob(s),
    u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
async function __pipe(u8, stream) {
  return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer());
}
async function __saveReplay() {
  let segs = recorder ? [...__segs, recorder.export(1)].filter(Boolean) : __lastSegs || [],
    total = segs.reduce((a, g) => a + g.frames, 0);
  if (total < 60) {
    setStatus(`Nothing to save yet. Play at least a second of a game first.`);
    return;
  }
  try {
    let head = segs[0],
      out = [];
    for (let g of segs)
      out.push({
        frames: g.frames,
        inputs: g.inputs,
        startState: g.startState
          ? { frame: g.startState.frame, data: __b64(await __pipe(g.startState.bytes, new CompressionStream(`gzip`))) }
          : null,
      });
    let obj = {
        format: REPLAY_FORMATS[0],
        v: 2,
        created: new Date().toISOString(),
        platform: head.config?.platform || config.platform,
        rom: { crc: head.romCrc || null, name: head.romName || `` },
        coreHash: head.coreHash || null,
        startHash: head.startStateHash || null,
        frames: total,
        segments: out,
      },
      base = (head.romName || `game`).replace(/\.[^.]*$/, ``).replace(/[^\w.-]+/g, `_`) || `game`,
      d = new Date(),
      p2 = (n) => String(n).padStart(2, `0`),
      stamp = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}`,
      a = document.createElement(`a`);
    ((a.href = URL.createObjectURL(new Blob([JSON.stringify(obj)], { type: `application/json` }))),
      (a.download = `${base}-${stamp}.replay`),
      document.body.append(a),
      a.click(),
      a.remove(),
      setTimeout(() => URL.revokeObjectURL(a.href), 6e4),
      setStatus(`Replay saved (${(total / 60).toFixed(0)} seconds, ${total} frames).`));
  } catch (e) {
    setStatus(`Could not save the replay: ${e.message}`);
  }
}
async function __watchReplay(file) {
  try {
    if (phase !== `lobby`) throw Error(`Return to setup before watching a replay.`);
    if (file.size > 3e7) throw Error(`That file is too large to be a replay.`);
    let obj = JSON.parse(await file.text());
    if (!REPLAY_FORMATS.includes(obj?.format) || obj.v !== 2 || !Array.isArray(obj.segments) || obj.segments.length > 200)
      throw Error(`This is not a replay file from this site.`);
    if (!Number.isSafeInteger(obj.frames) || obj.frames < 1 || obj.frames > 4e5) throw Error(`The replay file is damaged.`);
    if (obj.platform !== config.platform)
      throw Error(`This replay is for ${PLATFORMS[obj.platform]?.name || obj.platform}. Switch the system and load that ROM first.`);
    if (!rom) throw Error(`Load your ROM first, then choose the replay.`);
    let mine = __myRom();
    if (obj.rom?.crc && mine.crc !== obj.rom.crc)
      throw Error(`This replay was recorded with a different ROM (CRC32 ${obj.rom.crc}; yours is ${mine.crc}).`);
    if ((await loadCore(), obj.coreHash && !coreHashes().includes(obj.coreHash)))
      throw Error(`This replay was recorded with a different emulator build.`);
    let p1 = new Uint16Array(obj.frames),
      p2 = new Uint16Array(obj.frames),
      loads = {},
      n = 0;
    for (let g of obj.segments) {
      if (typeof g?.inputs != `string` || !Number.isSafeInteger(g.frames) || g.frames < 1) throw Error(`The replay file is damaged.`);
      g.startState &&
        (loads[n] = {
          frame: g.startState.frame,
          bytes: await __pipe(__unb64(g.startState.data), new DecompressionStream(`gzip`)),
        });
      let m = 0;
      for (let run of g.inputs.split(` `)) {
        let [a, b, c] = run.split(`.`),
          x = parseInt(a, 16),
          y = parseInt(b, 16),
          len = parseInt(c, 36);
        if (!(x >= 0 && x <= 4095 && y >= 0 && y <= 4095 && len >= 1) || m + len > g.frames || n + len > obj.frames)
          throw Error(`The replay file is damaged.`);
        (p1.fill(x, n, n + len), p2.fill(y, n, n + len), (n += len), (m += len));
      }
      if (m !== g.frames) throw Error(`The replay file is damaged.`);
    }
    if (n !== obj.frames) throw Error(`The replay file is damaged.`);
    ((__rp = { n, p1, p2, loads, i: 0, startHash: obj.segments[0]?.startState ? null : obj.startHash || null, done: !1, hashes: {} }),
      setStatus(`Starting replay…`),
      await startGame(),
      phase === `lobby` && (__rp = null));
  } catch (e) {
    ((__rp = null), setStatus(e.message || String(e)));
  }
}
function __replayUi() {
  ((k(`replay-save`).disabled = !((recorder && __segs.reduce((a, g) => a + g.frames, recorder.frames) >= 60) || __lastSegs)),
    (k(`replay-watch`).disabled = !(phase === `lobby` && rom && !loading && !starting)));
}
(k(`replay-save`).addEventListener(`click`, __saveReplay),
  k(`replay-watch`).addEventListener(`click`, () => k(`replay-file`).click()),
  k(`replay-file`).addEventListener(`change`, (e) => {
    let f = e.target.files[0];
    ((e.target.value = ``), f && __watchReplay(f));
  }),
  setInterval(__replayUi, 700));
globalThis.__arenaReplay = {
  get frames() {
    return recorder?.frames ?? 0;
  },
  get playback() {
    return __rp ? { i: __rp.i, n: __rp.n, done: __rp.done, hashes: __rp.hashes } : null;
  },
};
// Hide the mouse pointer over the game after 2.5 s without movement.
{
  let wrap = k(`screen-wrap`),
    idle = 0,
    show = () => {
      (wrap.classList.remove(`cursor-idle`), clearTimeout(idle), (idle = setTimeout(() => wrap.classList.add(`cursor-idle`), 2500)));
    };
  for (let ev of [`pointermove`, `pointerdown`, `wheel`]) wrap.addEventListener(ev, show, { passive: !0 });
  for (let ev of [`fullscreenchange`, `webkitfullscreenchange`]) document.addEventListener(ev, show);
}

// ---------- start ----------
(Z(),
  document.documentElement?.setAttribute(`data-arena-ready`, `true`),
  (loading = !0),
  (platformChange = showRomForPlatform()
    .catch((e) => {
      ((romError = e?.message || `The ROM could not be loaded.`), (k(`rom-status`).textContent = romError), setStatus(romError));
    })
    .finally(() => {
      ((loading = !1), Z());
    })));
