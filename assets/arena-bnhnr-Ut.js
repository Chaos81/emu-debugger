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
  if (!P) return null;
  if (__crcFor !== P) {
    let n = Vi?.normalizeROM ? Vi.normalizeROM(P) : P;
    ((__crcVal = { crc: __crc32(n), size: n.length }), (__crcFor = P));
  }
  return __crcVal;
}
function __syncRom() {
  try {
    let m = __myRom();
    if (!m || !k) return;
    Xi || (k(`rom-status`).textContent = `ROM loaded · CRC32 ${m.crc}`);
  } catch {}
}
import "./shared.js";
var m = Object.freeze({
  genesis: { status: [16762676, 16763544], list: [16762728, 16763596], type: `>u2` },
  nhl95: { status: [16761584, 16762454], list: [16761636, 16762506], type: `>u2` },
  snes: { status: [8263762, 8263814], list: [8263866, 8263892], type: `<u2` },
});
function h(e, t) {
  let n = m[t];
  return !n || typeof e?.read != `function` || typeof e?.byte != `function`
    ? null
    : n.list.map((t, r) => {
        let i = [],
          a = new Set();
        for (let o = 0; o < 26; o++) {
          let s = e.byte(t + o);
          if (s & 128) return i;
          if (s > 50 || s % 2 || a.has(s)) return null;
          a.add(s);
          let c = e.read(n.status[r] + s, n.type);
          Number.isInteger(c) && c > 0 && c <= 600 && i.push(c);
        }
        return null;
      });
}
function g(e) {
  return `${Math.floor(e / 60)}:${String(e % 60).padStart(2, `0`)}`;
}
function _(e, t, n = e.info()) {
  let r = t === `genesis` ? n.time & 65535 : n.time;
  return Number.isInteger(n.time) &&
    Number.isInteger(n.period) &&
    n.period >= 0 &&
    n.period <= 7 &&
    Number.isInteger(r) &&
    r >= 0 &&
    r <= 1200 &&
    [n.p1_score, n.p2_score].every((e) => Number.isInteger(e) && e >= 0 && e <= 99)
    ? {
        homeScore: n.p1_score,
        awayScore: n.p2_score,
        seconds: r,
        period: n.period,
        periodLabel: [`1ST`, `2ND`, `3RD`, `OT`, `2OT`, `3OT`, `4OT`, `5OT`][n.period],
        paused: n.paused === !0,
        penalties: h(e, t),
      }
    : null;
}
function v(e, t, n) {
  return;
  let r = (t, n) => {
      e.getElementById(t).textContent = n;
    },
    i = t && [`playing`, `finished`].includes(n);
  (r(`home-score`, i ? String(t.homeScore) : `—`),
    r(`away-score`, i ? String(t.awayScore) : `—`),
    r(
      `scoreboard-clock`,
      i ? `${t.periodLabel} · ${g(t.seconds)}` : n === `lineup` ? `LINEUP` : `PREGAME`,
    ),
    r(
      `scoreboard-status`,
      n === `finished` ? `MATCH ENDED` : i && t.paused ? `PAUSED` : `LIVE GAME DATA`,
    ));
  for (let [e, n] of [`home`, `away`].entries()) {
    let a = t?.penalties?.[e];
    r(
      `${n}-penalties`,
      i
        ? a
          ? a.length
            ? `PEN ${a.slice(0, 2).map(g).join(` · `)}${a.length > 2 ? ` +${a.length - 2}` : ``}`
            : ``
          : `Penalty data unavailable`
        : ``,
    );
  }
}
function ee(e) {
  return `${e.awayTeam} ${e.awayScore} – ${e.homeScore} ${e.homeTeam} · ${e.reason === `mercy` ? `Six-goal mercy` : `Match ended`} · ${e.gameLabel}`;
}
function y(e, t, n = {}) {
  let r = 1200;
  ((e.canvas.width = r),
    (e.canvas.height = 800),
    (e.fillStyle = `#101b31`),
    e.fillRect(0, 0, r, 800),
    (e.fillStyle = `#193558`));
  for (let t = -800; t < r; t += 120)
    (e.beginPath(),
      e.moveTo(t, 0),
      e.lineTo(t + 36, 0),
      e.lineTo(t + 836, 800),
      e.lineTo(t + 800, 800),
      e.fill());
  let i = (t, n, r, i, a = `#fff`, o = `left`) => {
    ((e.fillStyle = a),
      (e.font = `900 ${i}px Arial, sans-serif`),
      (e.textAlign = o),
      e.fillText(t, n, r));
  };
  return (
    (e.fillStyle = `#f6c94c`),
    e.fillRect(48, 42, 9, 83),
    i(`ONLINE ARENA`, 82, 89, 52),
    i(`CLASSIC HOCKEY`, 84, 121, 19, `#d6e4f7`),
    i(t.reason === `mercy` ? `SIX-GOAL MERCY` : `MATCH ENDED`, 1150, 92, 25, `#f6c94c`, `right`),
    i(t.gameLabel.toUpperCase(), 1150, 122, 18, `#d6e4f7`, `right`),
    (e.fillStyle = `#efefef`),
    e.fillRect(48, 176, 1104, 384),
    (e.fillStyle = `#183656`),
    e.fillRect(535, 176, 130, 384),
    (e.imageSmoothingEnabled = !1),
    n.away && e.drawImage(n.away, 140, 205, 176, 176),
    n.home && e.drawImage(n.home, 880, 205, 176, 176),
    i(`AWAY`, 228, 411, 18, `#40566f`, `center`),
    i(`HOME`, 968, 411, 18, `#40566f`, `center`),
    i(t.awayTeam, 228, 487, 60, `#101b31`, `center`),
    i(t.homeTeam, 968, 487, 60, `#101b31`, `center`),
    i(String(t.awayScore), 430, 422, 112, `#101b31`, `center`),
    i(String(t.homeScore), 770, 422, 112, `#101b31`, `center`),
    i(`VS`, 600, 379, 28, `#f6c94c`, `center`),
    i(
      t.telemetry
        ? `${t.telemetry.periodLabel} · ${g(t.telemetry.seconds)} REMAINING`
        : `SCORE AT END OF SESSION`,
      600,
      614,
      25,
      `#d6e4f7`,
      `center`,
    ),
    i(
      `${t.matchType === `tournament` ? `TOURNAMENT RULES` : `REGULAR MATCH`}  /  MERCY ${t.mercyEnabled ? `ON` : `OFF`}`,
      600,
      655,
      18,
      `#f6c94c`,
      `center`,
    ),
    (e.fillStyle = `#f6c94c`),
    e.fillRect(48, 700, 1104, 2),
    i(`CLASSIC HOCKEY. SAME RIVALRY.`, 48, 745, 24),
    i(`PLAYER-SHARED SCORE · NOT AN OFFICIAL LEAGUE SUBMISSION`, 48, 778, 13, `#aabbd2`),
    e.canvas
  );
}
async function te(e, t, { nav: n = navigator, download: r } = {}) {
  if (n.share && n.canShare?.({ files: [e] }))
    try {
      return (await n.share({ files: [e], title: `Match result`, text: t }), `shared`);
    } catch (e) {
      if (e.name === `AbortError`) return `cancelled`;
    }
  return (r(e), `downloaded`);
}
function ne(e, t) {
  let n = 0,
    r = null,
    i = null,
    a = (t) => e.getElementById(t) || document.createElement(`div`),
    o = (e) => {
      a(`share-result-status`).textContent = e;
    },
    s = (t) => {
      let n = URL.createObjectURL(t),
        r = e.createElement(`a`);
      ((r.href = n),
        (r.download = t.name),
        r.click(),
        setTimeout(() => URL.revokeObjectURL(n), 3e4));
    };
  return (
    a(`download-result`).addEventListener(`click`, () => {
      r && (s(r), o(`PNG downloaded. Post it wherever you share your games.`));
    }),
    a(`share-result`).addEventListener(`click`, async () => {
      if (!r) return;
      let e = n,
        t = r,
        c = i;
      a(`share-result`).disabled = !0;
      try {
        let r = await te(t, ee(c), { download: s });
        e === n &&
          o(
            r === `cancelled`
              ? `Sharing cancelled. Your card is still available.`
              : r === `shared`
                ? `Result shared.`
                : `PNG downloaded. This browser does not support image sharing.`,
          );
      } catch {
        e === n && o(`Could not share. Choose Download image to save your card.`);
      } finally {
        e === n && (a(`share-result`).disabled = !r);
      }
    }),
    {
      clear() {
        (n++,
          (r = i = null),
          a(`share-result-preview`).removeAttribute(`src`),
          (a(`match-share`).hidden = !0),
          (a(`share-result-preview`).hidden = !0));
      },
      async prepare(s) {
        let c = ++n;
        ((r = null),
          (i = s),
          (a(`match-share`).hidden = !1),
          (a(`share-result`).disabled = a(`download-result`).disabled = !0),
          (a(`share-result-preview`).hidden = !0),
          (a(`share-result-copy`).textContent = ee(s)),
          o(`Preparing your result card…`));
        try {
          let i = (e) =>
              new Promise((n) => {
                let r = new Image();
                ((r.onload = () => n(r)),
                  (r.onerror = () => n(null)),
                  (r.src = `${t}game/team-sprites/${s[`${e}Team`]}.png`));
              }),
            [l, u] = await Promise.all([i(`home`), i(`away`)]);
          if (c !== n) return;
          let d = e.createElement(`canvas`);
          y(d.getContext(`2d`, { alpha: !1 }), s, { home: l, away: u });
          let f = await new Promise((e) => d.toBlob(e, `image/png`));
          if (c !== n) return;
          if (!f) throw Error(`Image unavailable`);
          ((r = new File(
            [f],
            `match-${s.awayTeam}-${s.awayScore}-${s.homeTeam}-${s.homeScore}.png`,
            { type: `image/png` },
          )),
            (a(`share-result-preview`).src = d.toDataURL(`image/png`)),
            (a(`share-result-preview`).hidden = !1),
            (a(`share-result`).disabled = a(`download-result`).disabled = !1),
            o(`Ready to share. Your card stays on this device.`));
        } catch {
          c === n &&
            o(
              `Could not create the image. Your score is shown above; try ending the next match again.`,
            );
        }
      },
    }
  );
}
var ie = {
    genesis: { game: `NHL94`, console: `Genesis`, base: 16711680, size: 65536, endian: `big` },
    snes: { game: `NHL94`, console: `SNES`, base: 8257536, size: 131072, endian: `little` },
    nhl95: { game: `NHL95`, console: `Genesis`, base: 16711680, size: 65536, endian: `big` },
  };
function ae(e, t, n) {
  let r = ie[n.platform];
  if (!r || !e) throw Error(`Start a supported match before saving stats.`);
  let i = t ? t.confirmed : e.frames;
  if (t && t.dirty < i)
    throw Error(`Waiting for confirmed game inputs. Try saving again in a moment.`);
  let a = t && t.frame !== i ? t.states.get(i) : null;
  if (t && t.frame !== i && !a)
    throw Error(`Confirmed game state is unavailable. Try again in a moment.`);
  let o = a ? e.save() : null;
  try {
    a && e.load(a);
    let t = e.save();
    if (!(t.bytes instanceof Uint8Array) || t.bytes.length < 1 || t.bytes.length > 4194304)
      throw Error(`Game state could not be captured.`);
    let o = new Uint8Array(r.size);
    for (let t = 0; t < o.length; t++) o[t] = e.byte(r.base + t);
    let s = e.info(),
      c = {};
    for (let e of [
      `period`,
      `time`,
      `p1_score`,
      `p2_score`,
      `p1_shots`,
      `p2_shots`,
      `p1_attackzone`,
      `p2_attackzone`,
      `p1_bodychecks`,
      `p2_bodychecks`,
      `p1_faceoffwon`,
      `p2_faceoffwon`,
      `p1_pass_attempts`,
      `p2_pass_attempts`,
      `p1_passing`,
      `p2_passing`,
    ])
      Number.isFinite(s[e]) && (c[e] = s[e]);
    return {
      native: t.bytes.slice(),
      ram: o,
      metadata: {
        ...structuredClone(n),
        schema: `king94-stat-export-v1`,
        capturedAt: new Date().toISOString(),
        game: r.game,
        console: r.console,
        matchFrame: i,
        emulatorFrame: t.frame,
        summary: c,
        verification: `client capture; not an official result`,
        completion: `screen and match completion must be checked by the collector`,
        ram: {
          baseAddress: `0x` + r.base.toString(16),
          bytes: r.size,
          byteOrder: `console address order`,
          wordEndian: r.endian,
        },
      },
    };
  } finally {
    o && e.load(o);
  }
}
function se(e) {
  let t = 4294967295;
  for (let n of e) {
    t ^= n;
    for (let e = 0; e < 8; e++) t = (t >>> 1) ^ (t & 1 ? 3988292384 : 0);
  }
  return (t ^ 4294967295) >>> 0;
}
var pe = (e) => new TextDecoder().decode(e);
function me(e) {
  if (!(e instanceof Uint8Array) || e.length < 32 || e.length > 5242880)
    throw Error(`Choose a .state file or stats ZIP (up to 5 MB).`);
  if (pe(e.subarray(0, 7)) !== `RASTATE` || e[7] !== 1)
    throw Error(`Use an uncompressed RetroArch .state exported by this site.`);
  let t = new DataView(e.buffer, e.byteOffset, e.byteLength),
    n = 8,
    r = null;
  for (; n + 8 <= e.length;) {
    let i = pe(e.subarray(n, n + 4)),
      a = t.getUint32(n + 4, !0),
      o = n + 8 + a;
    if (o > e.length) throw Error(`State file is incomplete.`);
    if (i === `END `) {
      if (a || o !== e.length || !r) throw Error(`Invalid state ending.`);
      return r;
    }
    if (i === `MEM `) {
      if (r || !a || a > 4194304) throw Error(`Invalid core state.`);
      r = e.slice(n + 8, o);
    }
    n += 8 + Math.ceil(a / 8) * 8;
  }
  throw Error(`State file is incomplete.`);
}
function he(e) {
  if (!(e instanceof Uint8Array) || e.length > 5242880)
    throw Error(`State files must be no larger than 5 MB.`);
  if (pe(e.subarray(0, 7)) === `RASTATE`) return { native: me(e), metadata: null };
  if (
    e.length < 30 ||
    new DataView(e.buffer, e.byteOffset, e.byteLength).getUint32(0, !0) !== 67324752
  )
    throw Error(`Choose a .state file or a stats ZIP exported by this site.`);
  let t = new DataView(e.buffer, e.byteOffset, e.byteLength),
    n = new Map(),
    r = 0,
    i = 0;
  for (; r + 30 <= e.length && t.getUint32(r, !0) === 67324752;) {
    if (++i > 8) throw Error(`Unexpected stats ZIP contents.`);
    let a = t.getUint16(r + 6, !0),
      o = t.getUint16(r + 8, !0),
      s = t.getUint32(r + 14, !0),
      c = t.getUint32(r + 18, !0),
      l = t.getUint32(r + 22, !0),
      u = t.getUint16(r + 26, !0),
      d = t.getUint16(r + 28, !0),
      f = r + 30 + u + d,
      p = f + c;
    if (a || o || c !== l || u > 256 || p > e.length)
      throw Error(`Use the original, uncompressed stats ZIP.`);
    let m = pe(e.subarray(r + 30, r + 30 + u)),
      h = e.subarray(f, p);
    if (n.has(m) || se(h) !== s) throw Error(`Stats ZIP is damaged.`);
    (n.set(m, h), (r = p));
  }
  if (!n.has(`match.state`) || !n.has(`match.json`) || n.get(`match.json`).length > 16384)
    throw Error(`Stats ZIP is missing its state or match details.`);
  let a;
  try {
    a = JSON.parse(pe(n.get(`match.json`)));
  } catch {
    throw Error(`Invalid match details in stats ZIP.`);
  }
  if (!a || a.schema !== `king94-stat-export-v1`) throw Error(`Unsupported stats ZIP version.`);
  return { native: me(n.get(`match.state`)), metadata: a };
}
function ge(e, t, n) {
  let r = e.save().bytes;
  if (t.length !== r.length || !r.subarray(0, 16).every((e, n) => t[n] === e))
    throw Error(
      `State format does not match this emulator core. Use a state exported by this site for the selected game.`,
    );
  return (e.load({ bytes: t, frame: 0 }), n(), e.info());
}
var xe = Object.freeze([`genesis`, `snes`, `nhl95`]),
  Se = (e) => xe.includes(e),
  vn = [
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
    { id: `y`, label: `SNES Y · check / recovery`, required: !0, bit: 512, hint: `Press SNES Y` },
    { id: `x`, label: `SNES X · goalie`, required: !0, bit: 1024, hint: `Press SNES X` },
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
function lr(e = globalThis.indexedDB) {
  return e
    ? new Promise((t) => {
        let n = !1,
          r = (e) => {
            if (n) {
              e?.close();
              return;
            }
            ((n = !0), clearTimeout(i), t(e));
          },
          i = setTimeout(() => r(null), 1500),
          a;
        try {
          a = e.open(`king94-disc-cache`, 1);
        } catch {
          r(null);
          return;
        }
        ((a.onupgradeneeded = () => a.result.createObjectStore(`chunks`)),
          (a.onerror = () => r(null)),
          (a.onblocked = () => r(null)),
          (a.onsuccess = () => {
            let e = a.result,
              t = (t, n) =>
                new Promise((r, i) => {
                  let a;
                  try {
                    let o = e.transaction(`chunks`, t),
                      s = n(o.objectStore(`chunks`));
                    ((s.onsuccess = () => {
                      a = s.result;
                    }),
                      (o.oncomplete = () => r(a)),
                      (o.onabort = o.onerror =
                        () => i(o.error || Error(`Disc cache unavailable.`))));
                  } catch (e) {
                    i(e);
                  }
                });
            (r({
              get: (e) => t(`readonly`, (t) => t.get(e)),
              put: (e, n) => t(`readwrite`, (t) => t.put(n, e)),
              remove: (e) => t(`readwrite`, (t) => t.delete(e)),
              clear: () => t(`readwrite`, (e) => e.clear()),
              close: () => e.close(),
            }),
              (e.onversionchange = () => e.close()));
          }));
      })
    : Promise.resolve(null);
}
var ur = 4194304,
  dr = async (e) =>
    Array.from(new Uint8Array(await crypto.subtle.digest(`SHA-256`, e)), (e) =>
      e.toString(16).padStart(2, `0`),
    ).join(``);
async function fr(
  e,
  t,
  {
    fetcher: n = fetch,
    onProgress: r = () => {},
    expectedHash: i = null,
    cacheFactory: a = lr,
    workers: o = i ? 4 : 2,
  } = {},
) {
  if (!Number.isSafeInteger(t) || t < 1 || t > 536870912) throw Error(`Invalid disc size.`);
  if (i !== null && !/^[a-f0-9]{64}$/.test(i)) throw Error(`Invalid disc identity.`);
  if (!Number.isSafeInteger(o) || o < 1 || o > 4) throw Error(`Invalid disc worker count.`);
  let s = new URL(e, globalThis.location?.href || `https://tester.invalid`),
    c = null,
    l = !1;
  if (i) {
    let e = new URL(s.href);
    e.searchParams.set(`info`, `1`);
    let r = await n(e.href, { credentials: `same-origin`, cache: `no-store` });
    if (
      r.status === 401 ||
      r.status === 403 ||
      r.status === 303 ||
      (r.redirected && new URL(r.url).pathname.startsWith(`${globalThis.__BASE}login`))
    )
      throw Error(`Your tester session expired. Sign in again to load Sega CD.`);
    if (r.status !== 200 || !r.headers.get(`content-type`)?.startsWith(`application/json`))
      throw Error(`Sega CD disc information is unavailable. Reload to retry.`);
    if ((await r.json()).bytes !== t)
      throw Error(`The Sega CD disc version has changed. Reload the page.`);
    try {
      ((c = await a()), (l = !!c));
    } catch {}
  }
  let u = new Uint8Array(t),
    d = new AbortController(),
    f = 0,
    p = 0,
    m = 0,
    h = 0,
    g = !1,
    _ = (e) =>
      r(p / t, { phase: e, cachedBytes: h, downloadedBytes: m, cacheAvailable: l, totalBytes: t }),
    v = (e) => `${i}:${t}:${e}`,
    ee = () => {
      l = !1;
    };
  async function y() {
    try {
      for (; !g && f < t;) {
        let e = f,
          r = Math.min(ur, t - e);
        f += r;
        let i;
        if (l)
          try {
            let t = await c.get(v(e));
            t?.bytes instanceof Uint8Array &&
            t.bytes.byteLength === r &&
            (await dr(t.bytes)) === t.hash
              ? ((i = t.bytes), (h += r))
              : t && (await c.remove(v(e)));
          } catch {
            ee();
          }
        if (g) return;
        if (!i) {
          let a = new URL(s.href);
          (a.searchParams.set(`offset`, String(e)), a.searchParams.set(`length`, String(r)));
          let o = await n(a.href, { credentials: `same-origin`, signal: d.signal });
          if (o.status !== 206 || o.headers.get(`content-range`) !== `bytes ${e}-${e + r - 1}/${t}`)
            throw Error(
              `The Sega CD disc could not be loaded. Sign in again or reload; saved chunks will resume.`,
            );
          if (((i = new Uint8Array(await o.arrayBuffer())), i.byteLength !== r))
            throw Error(`The Sega CD download was incomplete.`);
          if (g) return;
          if (((m += r), l))
            try {
              await c.put(v(e), { bytes: i, hash: await dr(i) });
            } catch {
              ee();
            }
        }
        if (g) return;
        (u.set(i, e), (p += r), _(`loading`));
      }
    } catch (e) {
      throw ((g = !0), d.abort(), e);
    }
  }
  try {
    i && _(`checking`);
    let e = (await Promise.allSettled(Array.from({ length: o }, y))).find(
      (e) => e.status === `rejected`,
    );
    if (e) throw e.reason;
    if (i && (_(`verifying`), (await dr(u)) !== i))
      throw (
        await c?.clear().catch(() => {}),
        Error(`Sega CD disc verification failed. Reload to download a clean copy.`)
      );
    return u;
  } finally {
    c?.close();
  }
}
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
  },
  mr = Object.freeze({
    id: `king94-genesis-2026-10-v1`,
    console: `genesis`,
    periodMinutes: 5,
    offsides: !1,
    penalties: !0,
    lineChanges: !1,
    goalie: `manual`,
    mercyGoalDifference: 6,
    allowTies: !1,
    turboAllowed: !1,
    overtime: `restart-sudden-death-after-tied-overtime`,
    lineEdits: `pregame-or-stoppage`,
  }),
  hr = Object.freeze(
    [
      [`ANA`, `Anaheim Mighty Ducks`],
      [`BOS`, `Boston Bruins`],
      [`BUF`, `Buffalo Sabres`],
      [`CGY`, `Calgary Flames`],
      [`CHI`, `Chicago Blackhawks`],
      [`DAL`, `Dallas Stars`],
      [`DET`, `Detroit Red Wings`],
      [`EDM`, `Edmonton Oilers`],
      [`FLA`, `Florida Panthers`],
      [`HFD`, `Hartford Whalers`],
      [`LA`, `Los Angeles Kings`],
      [`MTL`, `Montreal Canadiens`],
      [`NJ`, `New Jersey Devils`],
      [`NYI`, `New York Islanders`],
      [`NYR`, `New York Rangers`],
      [`OTT`, `Ottawa Senators`],
      [`PHI`, `Philadelphia Flyers`],
      [`PIT`, `Pittsburgh Penguins`],
      [`QUE`, `Quebec Nordiques`],
      [`SJ`, `San Jose Sharks`],
      [`STL`, `St. Louis Blues`],
      [`TB`, `Tampa Bay Lightning`],
      [`TOR`, `Toronto Maple Leafs`],
      [`VAN`, `Vancouver Canucks`],
      [`WSH`, `Washington Capitals`],
      [`WPG`, `Winnipeg Jets`],
    ].map(([e, t]) => Object.freeze({ id: e, name: t })),
  ),
  gr = Object.freeze(
    [
      [`CHI`, `DET`],
      [`BUF`, `VAN`],
      [`MTL`, `BOS`],
      [`WPG`, `CGY`],
      [`DAL`, `LA`],
      [`QUE`, `TOR`],
      [`NYR`, `EDM`],
      [`PHI`, `PIT`],
      [`STL`, `WSH`],
      [`HFD`, `NJ`],
      [`NYI`, `SJ`],
      [`TB`, `FLA`],
      [`OTT`, `ANA`],
    ].map((e, t) => Object.freeze({ id: `pair-${t + 1}`, pair: Object.freeze(e) })),
  );
function _r({ pair: e, usedTeams: t = [], allowedTeams: n = hr.map((e) => e.id) }) {
  return !Array.isArray(e) || e.length !== 2
    ? { valid: !1, reason: `Call exactly two teams.` }
    : e[0] === e[1]
      ? { valid: !1, reason: `Choose two different teams.` }
      : e.some((e) => !n.includes(e))
        ? { valid: !1, reason: `Team is not enabled in this event.` }
        : e.some((e) => t.includes(e))
          ? { valid: !1, reason: `A called team has already been used in this scope.` }
          : { valid: !0, reason: null };
}
function vr(e, t) {
  let n = _r({ pair: e });
  if (!n.valid) throw Error(n.reason);
  if (!e.includes(t)) throw Error(`Home must choose one of the two called teams.`);
  return { homeTeam: t, awayTeam: e.find((e) => e !== t) };
}
function yr({
  homeScore: e,
  awayScore: t,
  regulationAndOvertimeEnded: n = !1,
  mercyEnabled: r = !0,
}) {
  if (![e, t].every((e) => Number.isInteger(e) && e >= 0)) throw Error(`Invalid score.`);
  let i = e - t;
  return r && Math.abs(i) >= mr.mercyGoalDifference
    ? { status: `complete`, reason: `mercy`, winner: i > 0 ? `home` : `away` }
    : n
      ? i === 0
        ? { status: `restart-sudden-death`, carryPenalties: !1, carryInjuries: !1 }
        : { status: `complete`, reason: `time`, winner: i > 0 ? `home` : `away` }
      : { status: `playing` };
}
var Ur = [
    `mercy`,
    `ended`,
    `left`,
    `remote-left`,
    `connection-closed`,
    `hidden`,
    `hidden-timeout`,
    `error`,
    `page-closed`,
  ],
  Wr = (e, t, n) => Number.isSafeInteger(e) && e >= t && e <= n;
function Gr(e) {
  return e.map(([e, t, n]) => `${e.toString(16)}.${t.toString(16)}.${n.toString(36)}`).join(` `);
}
var Kr = class {
    constructor(e) {
      ((this.meta = e),
        (this.runs = []),
        (this.frames = 0),
        (this.reason = null),
        (this.score = null),
        (this.finished = !1),
        (this.inputChars = 0));
    }
    push(e, t, n) {
      if (this.finished) return;
      if (e !== this.frames) throw Error(`Recorder expected frame ${this.frames}, got ${e}.`);
      if (!Wr(t, 0, 4095) || !Wr(n, 0, 4095)) throw Error(`Recorder got an invalid input mask.`);
      let r = this.runs[this.runs.length - 1],
        i = r && r[0] === t && r[1] === n,
        a = i
          ? (r[2] + 1).toString(36).length - r[2].toString(36).length
          : t.toString(16).length + n.toString(16).length + 3 + +!!r;
      if (this.frames >= 4e5 || this.inputChars + a > 45e4)
        throw (
          (this.finished = !0),
          (this.runs = []),
          (this.score = null),
          Error(`Recording reached its size limit; gameplay can continue.`)
        );
      ((this.inputChars += a), i ? r[2]++ : this.runs.push([t, n, 1]), this.frames++);
    }
    setScore(e, t, n, r) {
      Wr(e, 0, 1e6) &&
        Wr(t, 0, 99) &&
        Wr(n, 0, 99) &&
        (this.score = {
          frame: e,
          homeScore: t,
          awayScore: n,
          status: String(r || `playing`).slice(0, 40),
        });
    }
    setReason(e) {
      !this.reason && Ur.includes(e) && (this.reason = e);
    }
    export(t = null, min = 60) {
      if (this.frames < min) return null;
      let r = this.meta;
      return {
        v: 1,
        matchId: r.matchId,
        side: r.side,
        mode: r.mode,
        started: r.started,
        frames: this.frames,
        config: r.config,
        coreHash: r.coreHash,
        startStateHash: r.startStateHash,
        startState: r.startState || null,
        romCrc: r.romCrc,
        romName: r.romName,
        reason: this.reason,
        inputs: Gr(this.runs),
        net: t,
      };
    }
    finish(e, t = null, n = new Date()) {
      if (
        this.finished ||
        ((this.finished = !0), this.setReason(e), this.setReason(`ended`), this.frames < 120)
      )
        return null;
      let r = this.meta;
      return {
        v: 1,
        id: `${r.matchId}-${r.side}`,
        matchId: r.matchId,
        side: r.side,
        mode: r.mode,
        started: r.started,
        ended: n.toISOString(),
        reason: this.reason,
        frames: this.frames,
        config: r.config,
        romSha256: r.romSha256,
        coreHash: r.coreHash,
        rollbackVersion: r.rollbackVersion,
        startStateHash: r.startStateHash,
        startState: r.startState || null,
        romCrc: r.romCrc,
        romName: r.romName,
        inputs: Gr(this.runs),
        result: this.score,
        net: t,
      };
    }
  };
var ei = Object.freeze(
    [
      [`PIT`, `BOS`],
      [`DET`, `CHI`],
      [`NYR`, `CGY`],
      [`LA`, `BUF`],
      [`VAN`, `MTL`],
      [`WPG`, `TOR`],
      [`QUE`, `WSH`],
      [`PHI`, `STL`],
      [`NJ`, `DAL`],
      [`EDM`, `HFD`],
      [`NYI`, `SJ`],
      [`OTT`, `TB`],
      [`FLA`, `ANA`],
    ].map((e, t) => Object.freeze({ id: `snes-pair-${t + 1}`, pair: Object.freeze(e) })),
  ),
  ti = Object.freeze({
    genesis: {
      name: `Sega Genesis`,
      tag: `GENESIS`,
      emu: `emu.js`,
      boot: `boot.js`,
      media: `nhl94.bin`,
      bytes: 1048576,
      files: [`core/gpgx.wasm`, `core/gpgx.mjs`, `emu.js`, `boot.js`],
      mask: 507,
      pairingNote: `Choose any two teams.`,
      note: `Genesis controls. Manual goalie control uses the original game controls.`,
    },
    snes: {
      name: `Super Nintendo`,
      tag: `SNES`,
      emu: `snes.js`,
      boot: `snes-boot.js`,
      media: `nhl94.sfc`,
      bytes: 1048576,
      files: [`core/snes.wasm`, `core/snes.mjs`, `snes.js`, `snes-boot.js`],
      mask: 3839,
      pairingNote: `Choose any two teams.`,
      note: `SNES has its own controls. X selects the manual goalie; Y checks/holds and can get a knocked-down skater back up. The Y recovery trick is allowed. Pass shots are allowed. Native SNES gameplay differences remain.`,
    },
    nhl95: {
      game: `nhl95`,
      gameName: `NHL ’95`,
      name: `Sega Genesis`,
      tag: `NHL ’95`,
      emu: `nhl95.js`,
      boot: `nhl95-boot.js`,
      media: `nhl95.bin`,
      bytes: 2097152,
      files: [
        `core/gpgx.wasm`,
        `core/gpgx.mjs`,
        `emu.js`,
        `ramvars.js`,
        `boot.js`,
        `nhl95.js`,
        `nhl95-boot.js`,
      ],
      mask: 507,
      pairingNote: `Each player chooses their own team. Regular teams only; choose different teams.`,
      note: `NHL ’95 on Genesis. Each player chooses their own team. The locked match conditions are an online adaptation for this game; its original gameplay differences remain.`,
    },
    segacd: {
      name: `Sega CD`,
      tag: `SEGA CD`,
      emu: `segacd.js`,
      boot: `segacd-boot.js`,
      media: `nhl94.chd`,
      bios: `bios_CD_U.bin`,
      bytes: 227439378,
      files: [
        `core/segacd.wasm`,
        `core/segacd.mjs`,
        `emu.js`,
        `ramvars.js`,
        `boot.js`,
        `segacd.js`,
        `segacd-boot.js`,
      ],
      mask: 507,
      mediaHash: `642215da118e2dfe4432dee82f299627f2945fb756dce134db00735d0520916d`,
      pairingNote: `Genesis pairings reused for Sega CD practice; these are an online adaptation.`,
      note: `Sega CD uses Sega controls. The first disc download is 227 MB; saved chunks make return visits faster and resume interrupted downloads. Sega CD is an online adaptation.`,
    },
  });
function D(e = `genesis`) {
  if (typeof e != `string` || !Object.hasOwn(ti, e)) throw Error(`Unsupported game platform.`);
  return ti[e];
}
function ni(e = `genesis`) {
  return (
    D(e),
    e === `genesis` ? mr : Object.freeze({ ...mr, id: `king94-${e}-2026-10-v1`, console: e })
  );
}
function ri(e = `genesis`) {
  return (D(e), e === `nhl95` ? [] : e === `snes` ? ei : gr);
}
var ai = Object.freeze({
    ANA: `Anaheim`,
    BOS: `Boston`,
    BUF: `Buffalo`,
    CGY: `Calgary`,
    CHI: `Chicago`,
    DAL: `Dallas`,
    DET: `Detroit`,
    EDM: `Edmonton`,
    FLA: `Florida`,
    HFD: `Hartford`,
    LA: `Los Angeles`,
    MTL: `Montreal`,
    NJ: `New Jersey`,
    NYI: `NY Islanders`,
    NYR: `NY Rangers`,
    OTT: `Ottawa`,
    PHI: `Philadelphia`,
    PIT: `Pittsburgh`,
    QUE: `Quebec`,
    SJ: `San Jose`,
    STL: `St. Louis`,
    TB: `Tampa Bay`,
    TOR: `Toronto`,
    VAN: `Vancouver`,
    WSH: `Washington`,
    WPG: `Winnipeg`,
  });
function ci(e, t, n = 3, r = 0, i = `genesis`, a = {}) {
  D(i);
  let o = _r({ pair: e });
  if (!o.valid) throw Error(o.reason);
  if (!Number.isSafeInteger(n) || n < 3 || n > 8) throw Error(`Invalid network delay.`);
  if (![0, 1].includes(r)) throw Error(`Invalid host player side.`);
  let s = a.matchType ?? `exhibition`,
    c = a.mercyEnabled ?? s === `tournament`;
  if (![`exhibition`, `tournament`].includes(s) || typeof c != `boolean`)
    throw Error(`Invalid match rules.`);
  let l = vr(e, t);
  return {
    version: 1,
    platform: i,
    matchType: s,
    mercyEnabled: c,
    rules: { ...ni(i) },
    pair: i === `nhl95` ? [l.homeTeam, l.awayTeam] : [...e],
    ...l,
    hostSlot: r,
    delay: n,
    window: 12,
  };
}
function O(e) {
  return Array.isArray(e)
    ? `[${e.map(O).join(`,`)}]`
    : e && typeof e == `object`
      ? `{${Object.keys(e)
          .sort()
          .map((t) => `${JSON.stringify(t)}:${O(e[t])}`)
          .join(`,`)}}`
      : JSON.stringify(e);
}
async function li(e) {
  let t = e instanceof Uint8Array ? e : new TextEncoder().encode(O(e)),
    n = await crypto.subtle.digest(`SHA-256`, t);
  return Array.from(new Uint8Array(n), (e) => e.toString(16).padStart(2, `0`)).join(``);
}
var hi = `modulepreload`,
  gi = function (e) {
    return `${globalThis.__BASE}` + e;
  },
  _i = {},
  vi = function (e) {
    return e.pathname.endsWith(`.css`);
  },
  yi = function (e, t, n) {
    let r = Promise.resolve();
    if (t && t.length > 0) {
      let e,
        i = document.querySelector(`meta[property=csp-nonce]`),
        a = i?.nonce || i?.getAttribute(`nonce`);
      function o(e) {
        return Promise.all(
          e.map((e) =>
            Promise.resolve(e).then(
              (e) => ({ status: `fulfilled`, value: e }),
              (e) => ({ status: `rejected`, reason: e }),
            ),
          ),
        );
      }
      function s(e) {
        return import.meta.resolve ? new URL(import.meta.resolve(e)) : new URL(e, import.meta.url);
      }
      r = o(
        t
          .map((t) => {
            t = gi(t, n);
            let r = s(t);
            if (r.href in _i) return;
            _i[r.href] = !0;
            let i = vi(r);
            if (e === void 0) {
              e = { all: new Set(), styles: new Set() };
              let t = document.getElementsByTagName(`link`);
              for (let n = t.length - 1; n >= 0; n--) {
                let r = t[n];
                (e.all.add(r.href), r.rel === `stylesheet` && e.styles.add(r.href));
              }
            }
            if ((i ? e.styles : e.all).has(r.href)) return;
            let o = document.createElement(`link`);
            if (
              ((o.rel = i ? `stylesheet` : hi),
              i || (o.as = `script`),
              (o.crossOrigin = ``),
              (o.href = r.href),
              a && o.setAttribute(`nonce`, a),
              document.head.appendChild(o),
              i)
            )
              return new Promise((e, t) => {
                (o.addEventListener(`load`, e),
                  o.addEventListener(`error`, () => t(Error(`Unable to preload CSS for ${r}`))));
              });
          })
          .filter((e) => e !== void 0),
      );
    }
    function i(e) {
      let t = new Event(`vite:preloadError`, { cancelable: !0 });
      if (((t.payload = e), window.dispatchEvent(t), !t.defaultPrevented)) throw e;
    }
    return r.then((t) => {
      for (let e of t || []) e.status === `rejected` && i(e.reason);
      return e().catch(i);
    });
  },
  k = (e) =>
    document.getElementById(e) ||
    (__stubs[e] ??= Object.assign(document.createElement(`div`), { hidden: !0 })),
  A = new pr(),
  bi = new cr(
    () => [`lineup`, `playing`].includes(j) && !W,
    () => z.platform,
  ),
  j = `lobby`,
  P = null,
  Si = null,
  Ci = null,
  wi = null,
  F = null,
  z = ci([`MTL`, `BOS`], `MTL`),
  Ai = !0,
  H = null,
  U = 0,
  Fi = 0,
  Ii = null,
  Li = 0,
  W = !1,
  Bi = 0,
  Vi = null,
  Hi = null,
  Ui = null,
  Wi = null,
  Yi = 0,
  Xi = null,
  G = !1,
  Zi = Promise.resolve(),
  K = !1,
  Qi = 0,
  $i = `two`,
  ea = 0,
  ta = null,
  na = null,
  ra = null,
  ia = !1,
  ga = null,
  _a = null,
  Sa = new Map(),
  q = null,
  Ea = null,
  J = !1,
  Oa = 0;
function ka() {
  return q &&
    q.platform === z.platform &&
    q.homeTeam === z.homeTeam &&
    q.awayTeam === z.awayTeam &&
    q.players === $a()
    ? q
    : null;
}
function Ma() {
  let e = j === `lobby` && !K && !G && !J;
  ((k(`load-state`).disabled = k(`load-state-file`).disabled = !e),
    (k(`recover-last-state`).disabled = !e || !Sa.has(z.platform)),
    (k(`clear-loaded-state`).disabled = !e || !q));
  let t = ka();
  k(`loaded-state-status`).textContent = J
    ? `Checking your saved game…`
    : t
      ? `Saved game ready · ${z.homeTeam} ${t.info.p1_score} – ${t.info.p2_score} ${z.awayTeam}. Start to resume this saved game.`
      : q
        ? `Choose the saved game’s original teams and player mode, or clear it to start fresh.`
        : `No saved game loaded. New matches start normally.`;
}
async function Na(e) {
  if (j !== `lobby` || K || G || J) throw Error(`Return to setup before loading the state.`);
  if (!P || !Hi?.verifyMatchSettings) throw Error(`Wait for the selected game to finish loading.`);
  let t = ++Oa,
    n = U,
    r = O(z),
    i = $a(),
    a = Ui,
    o = Si;
  ((J = !0), Z());
  let s;
  try {
    let { native: c, metadata: l } = e;
    if (
      l &&
      (l.platform !== z.platform ||
        l.coreIdentity !== a ||
        l.config?.homeTeam !== z.homeTeam ||
        l.config?.awayTeam !== z.awayTeam ||
        l.players !== i)
    )
      throw Error(
        `Select this save’s original game, home/away teams and player mode. It must use this site’s current core and ROM version.`,
      );
    if (
      ((s = await (Vi.Genesis || Vi.SNES).create(P, {
        locateFile: (e) => (e.endsWith(`.wasm`) ? `${globalThis.__BASE}game/core/` + e : e),
      })),
      t !== Oa || n !== U || j !== `lobby` || r !== O(z) || i !== $a())
    )
      throw Error(`Setup changed while loading. Choose the state again.`);
    let u = ge(s, c, () => Hi.verifyMatchSettings(s, ai[z.homeTeam], ai[z.awayTeam], i)),
      d = await li(c);
    if (t !== Oa || n !== U || j !== `lobby` || r !== O(z) || i !== $a())
      throw Error(`Setup changed while loading. Choose the state again.`);
    ((q = {
      bytes: c.slice(),
      hash: d,
      platform: z.platform,
      homeTeam: z.homeTeam,
      awayTeam: z.awayTeam,
      players: i,
      info: u,
    }),
      Y(`Saved game checked. Choose Start to resume.`));
  } finally {
    (s?.dispose(), t === Oa && ((J = !1), Z()));
  }
}
async function Pa() {
  let e = k(`load-state-file`).files?.[0];
  if (e)
    try {
      if (e.size > 5242880) throw Error(`State files must be no larger than 5 MB.`);
      let t = O(z),
        n = U,
        r = new Uint8Array(await e.arrayBuffer());
      if (n !== U || t !== O(z))
        throw Error(`Setup changed while reading. Choose the state again.`);
      await Na(he(r));
    } catch (e) {
      Y(`Could not load state: ` + e.message + ` Check the original teams and player mode.`);
    } finally {
      k(`load-state-file`).value = ``;
    }
}
function Fa(e) {
  return ae(F, null, {
    platform: z.platform,
    config: z,
    matchId: H,
    mode: `local`,
    players: $a(),
    phase: j,
    reason: e,
    romSha256: Si,
    coreVersion: Vi?.CORE_VERSION,
    coreIdentity: Ui,
    ...(Ea ? { resumedFromStateHash: Ea.hash } : {}),
  });
}
function Ia(e) {
  if (!F || ![`lineup`, `playing`, `finished`].includes(j)) return;
  let t = Sa.get(z.platform);
  if (t?.metadata.matchId !== H || t.metadata.reason === `player-request`)
    try {
      Sa.set(z.platform, Fa(e));
    } catch {}
}
function Y(e) {
  k(`setup-status`).textContent = e;
}
function Ha(e, t = !0) {
  k(`game-message`).textContent = e;
  ((k(`game-overlay`).hidden = !t), !G && j !== `preparing` && Ua());
}
function Ua() {
  ((k(`disc-loader`).hidden = !0), (k(`cartridge-loader`).hidden = !0));
}
function Wa(e, t = null, n = ``) {
  ((k(`cartridge-loader`).hidden = !0),
    (k(`disc-loader`).hidden = !0),
    (k(`game-overlay`).hidden = !1),
    (k(`game-message`).textContent = n || e));
}
function Ga(e, t = 0, n = ``, r = !1) {
  ((k(`cartridge-loader`).hidden = !0),
    (k(`disc-loader`).hidden = !1),
    (k(`game-overlay`).hidden = !0));
  let i = k(`disc-loader-startup`);
  (i.getAttribute(`src`) ||
    i.setAttribute(
      `src`,
      `${globalThis.__BASE}game/segacd-startup.` +
        (globalThis.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches ? `png` : `gif`),
    ),
    k(`disc-loader`).classList.toggle(`is-boot`, r),
    k(`disc-loader`).classList.toggle(`is-error`, e === `LOAD INTERRUPTED`),
    (k(`disc-loader-stage`).textContent = e),
    (k(`disc-loader-percent`).textContent = `${Math.round(Math.max(0, Math.min(1, t)) * 100)}%`),
    (k(`disc-loader-progress`).value = t),
    (k(`disc-loader-copy`).textContent = n));
}
function $a() {
  return $i === `two` ? `two` : ea === 0 ? `single_home` : `single_away`;
}
var eo = (e) => (e === 0 ? `Home` : `Away`),
  to = null,
  no = ne(document, `${globalThis.__BASE}`);
function ro(e = to) {
  ((to = e), v(document, e, j));
}
function Z() {
  __syncRom();
  let e = j !== `lobby` || K || G || J,
    t = !e;
  ((k(`match-type`).value = z.matchType),
    (k(`match-type`).disabled = !t),
    (k(`mercy-toggle`).checked = z.mercyEnabled),
    (k(`mercy-toggle`).disabled = !t),
    ro(j === `lobby` || j === `preparing` ? null : to));
  let i = D(z.platform),
    a = z.platform === `nhl95`,
    o = `Your game`;
  ((k(`game-select`).value = a ? `nhl95` : `nhl94`),
    (k(`game-select`).disabled = !t),
    k(`platform-select`).replaceChildren(
      ...xe.filter((e) => (e === `nhl95`) === a).map((e) => new Option(ti[e].name, e)),
    ),
    (k(`platform-select`).value = z.platform),
    (k(`platform-select`).disabled = !t),
    (k(`platform-note`).textContent = i.note),
    (k(`edition-platform`).textContent = i.tag),
    k(`arena`).setAttribute(`data-platform`, z.platform),
    k(`arena`).setAttribute(`data-game`, a ? `nhl95` : `nhl94`),
    k(`game-canvas`).setAttribute(
      `aria-label`,
      `${o} gameplay. Keyboard and gamepad controls listed below.`,
    ));
  ((k(`team-a`).value = z.pair[0]),
    (k(`team-b`).value = z.pair[1]),
    (k(`home-choice`).value = z.homeTeam === z.pair[0] ? `a` : `b`));
  for (let [e, t] of [...(k(`home-choice`).options || [])].entries())
    t.textContent = hr.find((t) => t.id === z.pair[e]).name;
  ((k(`team-a`).disabled = k(`team-b`).disabled = !t || !Ai),
    (k(`home-choice`).disabled = !t),
    (k(`start-match`).disabled = e || !P || !(!q || ka())),
    (k(`start-match`).textContent = J
      ? `CHECKING SAVE…`
      : G
        ? `LOADING GAME…`
        : K
          ? `STARTING…`
          : j === `preparing`
            ? `PREPARING GAME…`
            : j === `finished`
              ? `GAME ENDED`
              : e
                ? `GAME IN PROGRESS`
                : `START GAME`),
    k(`arena`).setAttribute(`data-phase`, j),
    (k(`return-select`).disabled = j === `lobby` || j === `preparing` || ia),
    (k(`return-select`).textContent = ia
      ? `ENDING…`
      : j === `finished`
        ? `BACK TO SETUP`
        : `END GAME`));
  (Ma(),
    (k(`pause-match`).disabled = j !== `playing`),
    (k(`pause-match`).textContent = W ? `Resume` : `Pause`),
    (k(`session-status`).textContent =
      j === `playing`
        ? W
          ? `GAME PAUSED`
          : `GAME RUNNING`
        : j === `lineup`
          ? `CHOOSE YOUR LINES`
          : j === `preparing`
            ? `PREPARING GAME`
            : j === `finished`
              ? `GAME ENDED`
              : `NO GAME IN PROGRESS`),
    k(`screen-wrap`).classList.toggle(`gameplay-view`, j === `playing`),
    (k(`game-build-title`).textContent = P
      ? `${o} is ready`
      : Xi
        ? `Game build unavailable`
        : G
          ? `${o} is loading`
          : `ROM needed`),
    (k(`game-build-state`).textContent = P ? `READY` : Xi ? `ERROR` : G ? `CHECKING` : `NEEDED`));
  let l = P ? `READY TO START` : `CHOOSE ROM`,
    u = P
      ? `Ready. Start to boot the game; use its own menus to set up. Two keyboard layouts or controllers work on this computer.`
      : `Choose your game ROM file from this computer in the Game ROM box above.`;
  (Xi && ((l = `NEEDS ATTENTION`), (u = `That ROM could not be used. Choose a different ROM file.`)),
    !Xi &&
      j === `lobby` &&
      (J
        ? ((l = `CHECKING SAVE`), (u = `Checking your saved game. Wait here before choosing Start.`))
        : G
          ? ((l = `LOADING GAME`),
            (u = `Wait for the selected game to finish loading. Your start button will unlock when it is ready.`))
          : q &&
            !ka() &&
            ((l = `CHECK SAVE SETUP`),
            (u = `Choose the save’s original home/away teams and player mode, or use Clear loaded state below the arena to start fresh.`))),
    j === `preparing`
      ? ((l = `PREPARING GAME`), (u = `Setting up the game. Keep this tab open.`))
      : j === `lineup`
        ? ((l = `CHOOSE YOUR LINES`),
          (u = `Choose your lines in the original game menu, then press Start on your controller or keyboard.`))
        : j === `playing`
          ? ((l = W ? `GAME PAUSED` : `GAME RUNNING`),
            (u = W
              ? `Choose Resume below the game to continue.`
              : `Game controls, save states and the RAM viewer are below the game.`))
          : j === `finished` &&
            ((l = `GAME ENDED`), (u = `Choose Back to setup below the game to play again.`)),
    (k(`ready-check-title`).textContent =
      j === `lobby` ? `Get ready` : j === `preparing` ? `Getting ready` : `Game status`),
    (k(`ready-state`).textContent = l),
    (k(`ready-copy`).textContent = u));
  let f = $i === `single`;
  for (let [t, n] of [
    [`local-single`, f],
    [`local-two`, !f],
  ]) {
    let r = k(t);
    ((r.disabled = e),
      r.setAttribute(`aria-pressed`, String(n)),
      r.classList.toggle(`selected`, n));
  }
  ((k(`single-side`).hidden = !f),
    __rp ||
      (k(`connection-status`).textContent =
        j === `lobby` ? `No game running` : `Local game · both controller ports on this computer`));
  for (let t of [0, 1]) {
    let n = k(`human-side-${t}`),
      r = ea === t;
    ((n.disabled = e),
      n.setAttribute(`aria-pressed`, String(r)),
      n.classList.toggle(`selected`, r));
  }
  k(`screen-tag`).textContent = i.tag;
}
function io(e, t, n = z.hostSlot, r = z.platform, i = z) {
  if (j !== `lobby`) throw Error(`Team settings are locked during a match.`);
  ((z = ci(e, t, z.delay, n, r, i)),
    q &&
      (q.platform !== r || q.homeTeam !== z.homeTeam || q.awayTeam !== z.awayTeam) &&
      (q = null),
    Z());
}
function so(e, t, n) {
  if (ta)
    try {
      ta.push(e, t, n);
    } catch (e) {
      (console.error(`Recording stopped`, e), (ta = null));
    }
}
function co() {
  let t = ta;
  if (((ta = null), !t)) return;
  try {
    (t.finish(ra || `ended`, null),
      (__lastSegs = [...__segs, t.export(null, 1)].filter(Boolean)),
      (__segs = []));
  } catch (e) {
    console.error(`Match recording failed`, e);
  }
}
function lo() {
  (Ia(ra || `left`),
    co(),
    (__rp = null),
    (ra = null),
    (Ea = null),
    Oa++,
    (J = !1),
    U++,
    cancelAnimationFrame(Fi),
    (Fi = 0),
    A.suspend(),
    F?.dispose(),
    (F = null),
    G || Ua(),
    (j = `lobby`),
    (W = !1),
    (Bi = 0),
    (H = null),
    bi.held.clear(),
    Qi++,
    (K = !1),
    (ia = !1));
}
function uo() {
  return { frame: F?.frames || 0, homeScore: 0, awayScore: 0 };
}
function fo(e, t = `ended`) {
  [`lineup`, `playing`, `finished`].includes(j) &&
    H &&
    j !== `finished` &&
    (Ia(t),
    (ia = !1),
    (ra ||= t),
    (j = `finished`),
    (W = !1),
    U++,
    cancelAnimationFrame(Fi),
    (Fi = 0),
    A.suspend(),
    bi.held.clear(),
    ta?.setScore(e.frame, e.homeScore, e.awayScore, t === `mercy` ? `complete` : `ended`),
    co(),
    to && ro({ ...to, homeScore: e.homeScore, awayScore: e.awayScore }),
    mo(!1),
    Z());
}
function mo() {
  j === `finished` &&
    (lo(),
    Ha(`Game ended. Start another when ready.`),
    Y(`Game ended. Start another when ready.`),
    Z());
}
function ho(e) {
  (lo(), Y(e), Ha(e), Z());
}
function Q(e) {
  (console.error(e), ho(e?.message || `The game stopped because of an error.`));
}
function $(e) {
  return (...t) =>
    Promise.resolve()
      .then(() => e(...t))
      .catch(Q);
}
async function go() {
  return (
    (Wi ||= (async () => {
      let e = D(z.platform);
      [Vi, Hi] = await Promise.all([
        yi(() => import(`${globalThis.__BASE}game/` + e.emu), []),
        yi(() => import(`${globalThis.__BASE}game/` + e.boot), []),
      ]);
      let t = await Promise.all(
        e.files
          .map((e) => `game/` + e)
          .map(async (e) => {
            let t = await fetch(`${globalThis.__BASE}` + e);
            if (!t.ok) throw Error(`Missing emulator file: ${e}`);
            return new Uint8Array(await t.arrayBuffer());
          }),
      );
      Ui = await li({ version: Vi.CORE_VERSION, files: await Promise.all(t.map(li)) });
    })()),
    Wi
  );
}
async function _o(e) {
  let t = ++Yi;
  if (
    ((P = null),
    (Si = null),
    (Xi = null),
    Z(),
    (k(`rom-status`).textContent = `Checking your ROM file…`),
    e.byteLength < 16384 || e.byteLength > 8388608)
  )
    throw Error(`That file does not look like a game ROM.`);
  await go();
  let n = await Vi.sha256Hex(Vi.normalizeROM ? Vi.normalizeROM(e) : e);
  if (t === Yi) {
    ((P = e),
      (Si = n),
      (k(`rom-status`).textContent =
        `ROM loaded (${(e.byteLength / 1048576).toFixed(2)} MB). It stays on this computer.`),
      Y(`Game ready. Choose Start to boot it.`),
      Z());
  }
}
async function vo() {
  let e = z.platform,
    t = D(e),
    n = `${globalThis.__BASE}game/` + t.media;
  try {
    let r;
    if (z.platform === `segacd`) {
      Ga(`CHECKING DISC`, 0, `Checking your saved disc and tester access.`);
      let e = go();
      (e.catch(() => {}),
        (r = await fr(n, t.bytes, {
          expectedHash: t.mediaHash,
          onProgress: (e, t) => {
            let n = Math.round((t?.cachedBytes || 0) / 1048576),
              r = Math.round((t?.downloadedBytes || 0) / 1048576),
              i =
                t?.phase === `verifying`
                  ? `VERIFYING DISC`
                  : t?.downloadedBytes
                    ? `DOWNLOADING DISC`
                    : t?.cachedBytes
                      ? `READING SAVED DISC`
                      : `CHECKING DISC`,
              a =
                t?.phase === `verifying`
                  ? `Checking the complete disc before play.`
                  : t?.downloadedBytes
                    ? `${r} MB downloaded · ${n} MB from this device. ${t.cacheAvailable ? `Saved chunks resume next time.` : `Device storage unavailable; this visit can still play.`}`
                    : t?.cachedBytes
                      ? `Your saved disc is loading. No disc download needed for these chunks.`
                      : `First visit: saving the 227 MB disc for faster return visits.`;
            ((k(`rom-status`).textContent = `${i} · ${Math.round(e * 100)}%`), Ga(i, e, a));
          },
        })),
        await e,
        Ga(`PREPARING GAME`, 1, `Disc loaded. Checking the game and BIOS.`));
    } else {
      if (((r = __roms.get(e)), !r)) {
        ((k(`rom-status`).textContent =
          `Pick the ROM file for this game from your computer. It never leaves your device, and any ROM is accepted.`),
          Ua(),
          Ha(`Choose your ROM file to begin.`));
        return;
      }
      Wa(`CHECKING GAME`, null, `Checking your game…`);
    }
    if (t.bios) {
      let e = await fetch(`${globalThis.__BASE}game/` + t.bios, { credentials: `same-origin` });
      if (!e.ok) throw Error(`The Sega CD BIOS could not be loaded.`);
      ((Ci = new Uint8Array(await e.arrayBuffer())), (wi = await li(Ci)));
    }
    if ((await _o(r), z.platform !== e || !P)) return;
    (z.platform === `segacd` ? (Ua(), Ha(`Game ready. Choose your matchup and start.`)) : Ua(),
      Ha(`Your ROM is ready. Choose Start to play.`));
  } catch (e) {
    throw (
      z.platform === `segacd`
        ? Ga(`LOAD INTERRUPTED`, 0, `${e.message} Reload to resume saved chunks.`)
        : Wa(`LOAD INTERRUPTED`, null, e.message + ` Reload to try again.`),
      e
    );
  }
}
async function yo(e) {
  let t = ka();
  Ea = null;
  let n = ++U;
  ((j = `preparing`), (H = e), Z());
  try {
    if (
      (Ha(`Starting your game…`),
      z.platform === `segacd`
        ? Ga(`STARTING SEGA CD`, 0, `Starting NHL ’94 and applying your matchup.`)
        : Wa(`SETTING UP YOUR MATCH`, 0, `Starting your game…`),
      await go(),
      n !== U)
    )
      return !1;
    let r = await (Vi.Genesis || Vi.SNES || Vi.SegaCD).create(P, {
      biosBytes: Ci,
      locateFile: (e) => (e.endsWith(`.wasm`) ? `${globalThis.__BASE}game/core/` + e : e),
    });
    if (n !== U) return (r.dispose(), !1);
    F = r;
    let i;
    if (
      (t
        ? (ge(F, t.bytes, () => Hi.verifyMatchSettings(F, ai[z.homeTeam], ai[z.awayTeam], $a())),
          (Ea = t),
          (i = { settingsVerified: !0 }))
        : (i = {}),
      n !== U || ((na = await li(F.save().bytes)), n !== U))
    )
      return !1;
    ((ta = new Kr({
        matchId: e,
        side: `local`,
        mode: `local`,
        started: null,
        config: {
          ...structuredClone(z),
          players: $a(),
          ...(t ? { resume: { stateHash: t.hash, source: `browser-load` } } : {}),
        },
        romSha256: Si,
        coreHash: Ui,
        startStateHash: na,
        romCrc: __myRom()?.crc,
        romName: __romNames.get(z.platform) || ``,
      })),
      (__segs = []),
      await __rpApply(),
      Y(`Starting your game from power-on.`));
    return !0;
  } catch (e) {
    if (n !== U) return !1;
    throw e;
  }
}
async function So() {
  if (j !== `lobby` || K || J) return;
  let e = ++Qi,
    t = O(z);
  ((K = !0), Z());
  try {
    if ((await A.unlock(), e !== Qi || j !== `lobby`)) return;
    if (t !== O(z)) {
      Y(`The matchup changed. Please review and lock in again.`);
      return;
    }
    if (q && !ka()) {
      Y(
        `Choose this save’s original teams and player mode, or clear the loaded state to start fresh.`,
      );
      return;
    }
    if (!P || G) throw Error(`The game ROM is not loaded yet.`);
    (await yo(crypto.randomUUID())) && Co();
  } finally {
    e === Qi && ((K = !1), Z());
  }
}
function Co() {
  (wo(`playing`),
    Y(`Your game is running. Use the game’s own menus to choose teams, players and rules.`));
}
function wo(e) {
  if (j === `preparing` && F) {
    if (
      (Ea && (q = null),
      no.clear(),
      (to = null),
      (j = e),
      (W = !1),
      (Bi = 0),
      (Ii = null),
      (Li = 0),
      k(`controller-dialog`).open && Bo(),
      k(`help-dialog`).open && Ho(),
      Ua(),
      ta && (ta.meta.started = new Date().toISOString()),
      Ha(``, !1),
      !k(`controller-dialog`).open && !k(`help-dialog`).open && k(`game-canvas`).focus(),
      j === `lineup`)
    ) {
      let e = D(z.platform).gameName || `NHL ’94`,
        t = $i === `single`;
      Y(
        z.platform === `nhl95`
          ? `NHL ’95 menu: press C on Edit Lines to change your lineup, then START when ready.${t ? ` The CPU picks its own.` : ` Both players can edit their lines.`}`
          : t
            ? `Choose your lines in the ${e} menu, then press START when you are ready. The CPU picks its own.`
            : `Choose your lines in the ${e} menu. Both players press START when ready.`,
      );
    }
    (Ea &&
      Y(
        `Saved game resumed. Scores, clock and in-game pause are restored; press Start in the game if it was paused.`,
      ),
      Z(),
      (Fi = requestAnimationFrame(Oo)));
  }
}
function To() {
  let e = F.video();
  if (!e) return;
  let t = k(`game-canvas`);
  (k(`screen-wrap`).classList.toggle(`wide-game-screen`, e.width === 320),
    (t.width !== e.width || t.height !== e.height) && ((t.width = e.width), (t.height = e.height)),
    t.getContext(`2d`, { alpha: !1 }).putImageData(new ImageData(e.data, e.width, e.height), 0, 0));
}
function Oo(e) {
  if ([`lineup`, `playing`].includes(j)) {
    try {
      if (!Number.isFinite(e)) {
        ((Ii = null), (Fi = requestAnimationFrame(Oo)));
        return;
      }
      let t = Ii === null ? 0 : Math.max(0, e - Ii);
      if (((Ii = e), !W)) {
        let e = 1e3 / (F.fps ?? 59.922743);
        Li = Math.min(Li + t, e * 5);
        let n = 0;
        for (; Li >= e && n++ < 5;) {
          let t = D(z.platform).mask,
            n = (bi.mask(0) | (Bi > 0 ? 8 : 0)) & t,
            r;
          if (__rp) {
            if (__rp.i >= __rp.n) (__rpDone(), (r = !1));
            else {
              (__rp.loads[__rp.i] && F.load(__rp.loads[__rp.i]),
                F.step(__rp.p1[__rp.i], __rp.p2[__rp.i]),
                __rp.i++,
                __rp.i % 120 === 0 && (__rp.hashes[__rp.i] = F.checksum() >>> 0),
                __rp.i % 30 === 0 &&
                  (k(`connection-status`).textContent = `Replay · frame ${__rp.i} of ${__rp.n}`),
                (r = !0));
            }
          } else {
            let e = $i === `single` ? 0 : bi.mask(1) & t;
            (F.step(n, e), so(ta?.frames, n, e), (r = !0));
          }
          if (!r) {
            Li = 0;
            break;
          }
          (Bi > 0 && Bi--, A.push(F.audio(), F.audioRate), (Li -= e));
        }
        To();
      }
      Fi = requestAnimationFrame(Oo);
    } catch (e) {
      Q(e);
    }
  }
}
function Fo() {}
Fo();
for (let e of [`team-a`, `team-b`])
  (k(e).replaceChildren(...hr.map((e) => new Option(e.name, e.id))),
    k(e).addEventListener(
      `change`,
      $(() => {
        if (z.platform === `nhl95` || !Ai) return;
        let e = [k(`team-a`).value, k(`team-b`).value];
        try {
          ci(e, e[0]);
        } catch (e) {
          (Y(e.message), Z());
          return;
        }
        io(e, e.includes(z.homeTeam) ? z.homeTeam : e[0]);
      }),
    ));
for (let e of [`match-type`, `mercy-toggle`])
  k(e).addEventListener(`change`, () => {
    if (j !== `lobby` || K || G || J) {
      Z();
      return;
    }
    let t = e === `match-type` ? k(`match-type`).value : z.matchType,
      n = e === `match-type` ? t === `tournament` : k(`mercy-toggle`).checked;
    try {
      io(z.pair, z.homeTeam, z.hostSlot, z.platform, { matchType: t, mercyEnabled: n });
    } catch (e) {
      (Y(e.message), Z());
    }
  });
var Io = !1;
for (let e of [`scanlines-toggle`, `scanlines-in-game`])
  k(e).addEventListener(`click`, () => {
    ((Io = !Io), (k(`scanline-overlay`).hidden = !Io));
    for (let e of [`scanlines-toggle`, `scanlines-in-game`])
      (k(e).setAttribute(`aria-pressed`, String(Io)),
        (k(e).textContent = `Scanlines: ${Io ? `on` : `off`}`));
  });
k(`home-choice`).addEventListener(
  `change`,
  $(() => {
    z.platform !== `nhl95` && io(z.pair, z.pair[k(`home-choice`).value === `a` ? 0 : 1]);
  }),
);
async function Ro(e) {
  if ((await Zi.catch(() => {}), j !== `lobby` || K || G)) return;
  if ((D(e), !Se(e))) throw Error(`Choose Genesis or SNES.`);
  ((G = !0),
    (q = null),
    Oa++,
    (J = !1),
    Ua(),
    Yi++,
    (P = null),
    (Si = null),
    (Ci = null),
    (wi = null),
    (Xi = null),
    (Vi = Hi = Ui = Wi = null));
  let r = e === `nhl95` ? [z.homeTeam, z.awayTeam] : z.pair;
  ((z = ci([...r], r.includes(z.homeTeam) ? z.homeTeam : r[0], z.delay, z.hostSlot, e, z)),
    bi.held.clear(),
    Fo(),
    Z());
  try {
    ((Zi = vo()), await Zi);
  } catch (e) {
    ((Xi = e.message), (k(`rom-status`).textContent = Xi));
  } finally {
    ((G = !1), Z());
  }
  return !0;
}
(k(`platform-select`).addEventListener(
  `change`,
  $(() => Ro(k(`platform-select`).value)),
),
  k(`game-select`).addEventListener(
    `change`,
    $(() => Ro(k(`game-select`).value === `nhl95` ? `nhl95` : `genesis`)),
  ),
  k(`load-state`).addEventListener(`click`, () => {
    ((k(`state-recovery`).open = !0), k(`load-state-file`).click());
  }),
  k(`load-state-file`).addEventListener(`change`, Pa),
  k(`recover-last-state`).addEventListener(`click`, async () => {
    let e = Sa.get(z.platform);
    if (e)
      try {
        await Na({ native: e.native, metadata: e.metadata });
      } catch (e) {
        Y(`Could not recover state: ` + e.message);
      }
  }),
  k(`clear-loaded-state`).addEventListener(`click`, () => {
    j !== `lobby` ||
      K ||
      J ||
      ((q = null), Z(), Y(`Loaded state cleared. New games start from power-on.`));
  }));
for (let [e, t] of [
  [`local-single`, `single`],
  [`local-two`, `two`],
])
  k(e).addEventListener(`click`, () => {
    j !== `lobby` ||
      K ||
      (($i = t),
      Y(
        t === `single`
          ? `Single player: you against the game’s CPU.`
          : `Two players on this computer: player one uses the arrow keys, player two uses I J K L.`,
      ),
      Z());
  });
for (let e of [0, 1])
  k(`human-side-${e}`).addEventListener(`click`, () => {
    j !== `lobby` || K || ((ea = e), Y(`You play ${eo(e)}.`), Z());
  });
(k(`start-match`).addEventListener(`click`, $(So)),
  k(`return-select`).addEventListener(
    `click`,
    $(() => {
      if (j === `finished`) {
        mo();
        return;
      }
      [`lineup`, `playing`].includes(j) && fo(uo());
    }),
  ));
(  k(`pause-match`).addEventListener(
    `click`,
    $(async () => {
      j === `playing` &&
        ((W = !W),
        bi.held.clear(),
        W
          ? (A.suspend(), Ha(`Game paused.`))
          : (await A.unlock(), Ha(``, !1), (Ii = null), (Li = 0)),
        Z());
    }),
  ));
function Bo() {
  (bi.held.clear(),
    (Bi = 0),
    [`lineup`, `playing`].includes(j) &&
      !ga &&
      ((ga = { generation: U, matchId: H, wasPaused: W }), (W = !0), A.suspend()),
    (k(`controller-session-note`).textContent = ga
      ? `Your game is paused while you map. Close this panel to return.`
      : `Change buttons here at any time. No restart needed.`));
}
function Vo() {
  (bi.held.clear(),
    (Ii = null),
    (Li = 0),
    ga && ga.generation === U && ga.matchId === H && ((W = ga.wasPaused), W || A.unlock()),
    (ga = null),
    [`lineup`, `playing`].includes(j) && k(`game-canvas`).focus(),
    Z());
}
(document.addEventListener(`king94-controller-open`, Bo),
  document.addEventListener(`king94-controller-close`, Vo));
function Ho() {
  (bi.held.clear(),
    (Bi = 0),
    [`lineup`, `playing`].includes(j) &&
      !_a &&
      ((_a = { generation: U, matchId: H, wasPaused: W }), (W = !0), A.suspend()),
    (k(`help-session-note`).textContent = _a
      ? `Your game is paused while Help is open. Choose Done to return.`
      : `Choose a topic below. You can return to Help at any time.`));
}
function Uo() {
  (bi.held.clear(),
    (Ii = null),
    (Li = 0),
    _a && _a.generation === U && _a.matchId === H && ((W = _a.wasPaused), W || A.unlock()),
    (_a = null),
    Z());
}
(document.addEventListener(`king94-help-open`, Ho),
  document.addEventListener(`king94-help-close`, Uo),
  k(`enable-sound`).addEventListener(`click`, async () => {
    let e = k(`enable-sound`);
    e.disabled = !0;
    let t = await A.unlock();
    ((e.textContent = t ? `Sound enabled` : `Retry sound`),
      (e.disabled = !1),
      Y(
        t
          ? `Game sound is enabled.`
          : `Sound is unavailable right now. The game can still run; try enabling sound again.`,
      ),
      W && A.suspend());
  }),
  document.addEventListener(`visibilitychange`, () => {
    document.hidden && [`lineup`, `playing`].includes(j) && !W && k(`pause-match`).click();
  }),
  document.addEventListener(`click`, (e) => {
    [`lineup`, `playing`].includes(j) &&
      !k(`controller-dialog`).open &&
      !e.target.closest?.(`.arena-tools,button,a,input,select,textarea,summary`) &&
      k(`game-canvas`).focus();
  }));
(Z(),
  document.documentElement?.setAttribute(`data-arena-ready`, `true`),
  addEventListener(`pagehide`, () => {
    ta && ((ra ||= `page-closed`), co());
  }),
  (G = !0),
  (Zi = vo()
    .catch((e) => {
      ((Xi = e?.message || `The ROM could not be loaded.`),
        (k(`rom-status`).textContent = Xi),
        Y(Xi));
    })
    .finally(() => {
      ((G = !1), Z());
    })));
async function __loadRom(bytes) {
  if (G || j !== `lobby`) return;
  let plat = z.platform,
    t = D(plat);
  ((G = !0), (Xi = null), Z());
  try {
    (__roms.set(plat, bytes),
      Wa(`CHECKING GAME`, null, `Checking your game before the puck drops.`),
      await _o(bytes));
    if (z.platform !== plat || !P) return;
    (Ua(), Ha(`Your ROM is ready. Choose Start to play.`));
  } catch (e) {
    (__roms.delete(plat),
      (P = null),
      (Si = null),
      (Xi = e?.message || `The ROM could not be loaded.`),
      (k(`rom-status`).textContent = Xi),
      Wa(`LOAD INTERRUPTED`, null, Xi + ` Choose a different ROM file.`),
      Y(Xi));
  } finally {
    ((G = !1), Z());
  }
}
k(`rom-file`).addEventListener(`change`, async (e) => {
  let f = e.target.files[0];
  if (!f) return;
  try {
    if (f.size > 8388608) throw Error(`That file does not look like a game ROM.`);
    (__romNames.set(z.platform, f.name), await __loadRom(new Uint8Array(await f.arrayBuffer())));
  } catch (err) {
    ((Xi = err.message), (k(`rom-status`).textContent = Xi), Y(Xi), Z());
  }
  e.target.value = ``;
});
for (let ev of [`pointerdown`, `keydown`]) {
  let h = async () => {
    try {
      (await A.unlock()) &&
        (removeEventListener(`pointerdown`, h, !0), removeEventListener(`keydown`, h, !0));
    } catch {}
  };
  addEventListener(ev, h, !0);
}
globalThis.__arena = Object.freeze({
  get emu() {
    return F;
  },
  get phase() {
    return j;
  },
  get platform() {
    return z.platform;
  },
  get home() {
    return z.homeTeam;
  },
  get away() {
    return z.awayTeam;
  },
  get players() {
    return $a();
  },
  get coreVersion() {
    return Vi?.CORE_VERSION;
  },
  get coreHash() {
    return Ui;
  },
  status(e) {
    Y(e);
  },
  loadRom: __loadRom,
  get romName() {
    return __romNames.get(z.platform) || ``;
  },
  snapshot() {
    return F.save();
  },
  verify(e) {
    if (!Hi?.verifyMatchSettings) throw Error(`The game is still loading.`);
    let t = F.save();
    try {
      (F.load(e), Hi.verifyMatchSettings(F, ai[z.homeTeam], ai[z.awayTeam], $a()));
    } finally {
      F.load(t);
    }
  },
  afterLoad() {
    ((Bi = 0), (Ii = null), (Li = 0), __restartRecording(), bi.held.clear());
    try {
      To();
    } catch {}
  },
});
globalThis.__setEmuVolume = (v, m) => A.setVolume(v, m);
globalThis.__getEmuVolume = () => ({ volume: A.volume, muted: A.muted });
var __rp = null,
  __segs = [],
  __lastSegs = null;
function __restartRecording() {
  let old = ta;
  if (__rp || !old) {
    ta = null;
    return;
  }
  let seg = old.export(null, 1);
  seg && __segs.push(seg);
  ta = null;
  try {
    let st = F.save();
    ta = new Kr({
      ...old.meta,
      startState: { bytes: new Uint8Array(st.bytes), frame: st.frame },
      startStateHash: null,
    });
  } catch (e) {
    console.error(`Could not restart recording`, e);
  }
}
async function __rpApply() {
  if (!__rp) return;
  ta = null;
  if (__rp.startHash && na !== __rp.startHash) {
    __rp = null;
    throw Error(`This replay does not match your ROM or emulator build, so it cannot be played back.`);
  }
}
function __rpDone() {
  if (__rp.done) return;
  __rp.done = !0;
  Y(`Replay finished. Choose End game to return to setup.`);
  k(`connection-status`).textContent = `Replay finished · ${__rp.n} frames`;
}
function __b64(u8) {
  let out = ``;
  for (let i = 0; i < u8.length; i += 32768)
    out += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return btoa(out);
}
function __unb64(s) {
  let bin = atob(s),
    u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
async function __pipe(u8, stream) {
  return new Uint8Array(
    await new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer(),
  );
}
async function __saveReplay() {
  let segs = ta ? [...__segs, ta.export(null, 1)].filter(Boolean) : __lastSegs || [],
    total = segs.reduce((a, g) => a + g.frames, 0);
  if (total < 60) {
    Y(`Nothing to save yet. Play at least a second of a game first.`);
    return;
  }
  try {
    let head = segs[0],
      out = [];
    for (let g of segs) {
      let state = null;
      if (g.startState)
        state = {
          frame: g.startState.frame,
          data: __b64(await __pipe(g.startState.bytes, new CompressionStream(`gzip`))),
        };
      out.push({ frames: g.frames, inputs: g.inputs, startState: state });
    }
    let obj = {
      format: `NHL94-REPLAY`,
      v: 2,
      created: new Date().toISOString(),
      platform: head.config?.platform || z.platform,
      rom: { crc: head.romCrc || null, name: head.romName || `` },
      coreHash: head.coreHash || null,
      startHash: head.startStateHash || null,
      mode: head.mode,
      side: head.side,
      frames: total,
      segments: out,
    };
    let base = (head.romName || `nhl94`).replace(/\.[^.]*$/, ``).replace(/[^\w.-]+/g, `_`) || `nhl94`,
      d = new Date(),
      p2 = (n) => String(n).padStart(2, `0`),
      stamp = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}`,
      a = document.createElement(`a`);
    a.href = URL.createObjectURL(new Blob([JSON.stringify(obj)], { type: `application/json` }));
    a.download = `${base}-${stamp}.replay`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 6e4);
    Y(`Replay saved (${(total / 60).toFixed(0)} seconds, ${total} frames).`);
  } catch (e) {
    Y(`Could not save the replay: ${e.message}`);
  }
}
async function __watchReplay(file) {
  try {
    if (j !== `lobby`) throw Error(`Return to setup before watching a replay.`);
    if (file.size > 3e7) throw Error(`That file is too large to be a replay.`);
    let obj = JSON.parse(await file.text());
    if (obj?.format !== `NHL94-REPLAY` || obj.v !== 2 || !Array.isArray(obj.segments) || obj.segments.length > 200)
      throw Error(`This is not a replay file from this site.`);
    if (!Number.isSafeInteger(obj.frames) || obj.frames < 1 || obj.frames > 4e5)
      throw Error(`The replay file is damaged.`);
    if (obj.platform !== z.platform)
      throw Error(`This replay is for ${{ genesis: `Sega Genesis`, snes: `Super Nintendo` }[obj.platform] || obj.platform}. Switch the system and load that ROM first.`);
    if (!P) throw Error(`Load your ROM first, then choose the replay.`);
    let me = __myRom();
    if (obj.rom?.crc && me.crc !== obj.rom.crc)
      throw Error(`This replay was recorded with a different ROM (CRC32 ${obj.rom.crc}; yours is ${me.crc}).`);
    if (obj.coreHash && Ui && obj.coreHash !== Ui)
      throw Error(`This replay was recorded with a different emulator build.`);
    let p1 = new Uint16Array(obj.frames),
      p2 = new Uint16Array(obj.frames),
      loads = {},
      n = 0;
    for (let g of obj.segments) {
      if (typeof g?.inputs != `string` || !Number.isSafeInteger(g.frames) || g.frames < 1)
        throw Error(`The replay file is damaged.`);
      if (g.startState)
        loads[n] = {
          frame: g.startState.frame,
          bytes: await __pipe(__unb64(g.startState.data), new DecompressionStream(`gzip`)),
        };
      let m = 0;
      for (let run of g.inputs.split(` `)) {
        let [a, b, c] = run.split(`.`),
          x = parseInt(a, 16),
          y = parseInt(b, 16),
          len = parseInt(c, 36);
        if (!(x >= 0 && x <= 4095 && y >= 0 && y <= 4095 && len >= 1) || m + len > g.frames || n + len > obj.frames)
          throw Error(`The replay file is damaged.`);
        p1.fill(x, n, n + len);
        p2.fill(y, n, n + len);
        n += len;
        m += len;
      }
      if (m !== g.frames) throw Error(`The replay file is damaged.`);
    }
    if (n !== obj.frames) throw Error(`The replay file is damaged.`);
    __rp = { n, p1, p2, loads, i: 0, startHash: obj.segments[0]?.startState ? null : obj.startHash || null, done: !1, hashes: {} };
    Y(`Starting replay…`);
    await So();
    if (j === `lobby`) __rp = null;
  } catch (e) {
    __rp = null;
    Y(e.message || String(e));
  }
}
function __replayUi() {
  let sv = k(`replay-save`),
    wt = k(`replay-watch`);
  sv.disabled = !((ta && __segs.reduce((a, g) => a + g.frames, ta.frames) >= 60) || __lastSegs);
  wt.disabled = !(j === `lobby` && P && !G && !K);
}
k(`replay-save`).addEventListener(`click`, __saveReplay);
k(`replay-watch`).addEventListener(`click`, () => k(`replay-file`).click());
k(`replay-file`).addEventListener(`change`, (e) => {
  let f = e.target.files[0];
  ((e.target.value = ``), f && __watchReplay(f));
});
setInterval(__replayUi, 700);
globalThis.__arenaReplay = {
  get frames() {
    return ta?.frames ?? 0;
  },
  get playback() {
    return __rp ? { i: __rp.i, n: __rp.n, done: __rp.done, hashes: __rp.hashes } : null;
  },
};
{
  let wrap = k(`screen-wrap`),
    idle = 0,
    show = () => {
      (wrap.classList.remove(`cursor-idle`), clearTimeout(idle));
      idle = setTimeout(() => wrap.classList.add(`cursor-idle`), 2500);
    };
  for (let ev of [`pointermove`, `pointerdown`, `wheel`]) wrap.addEventListener(ev, show, { passive: !0 });
  for (let ev of [`fullscreenchange`, `webkitfullscreenchange`]) document.addEventListener(ev, show);
}

