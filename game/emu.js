// Genesis adapter: Genesis Plus GX (WebAssembly, the same core and settings as
// stable-retro 1.0.1, see core/frontend.c) running the player's own ROM.
import createGPGX from './core/gpgx.mjs';

export const CORE_VERSION = 'gpgx-stable-retro-1.0.1-king94-v1';
export const BUTTONS = ['B', 'A', 'MODE', 'START', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'C', 'Y', 'X', 'Z'];
const RAM_BASE = 0xFF0000;
const WARM_FRAMES = 2;
// Address of m68k.dar[0] (struct m68ki_cpu_core in Genesis Plus GX core/m68k/m68k.h) inside this
// build's WebAssembly memory. It was located and checked with test ROMs for core/gpgx.wasm only;
// the main page offers registers only when the core fingerprint matches that build.
const M68K_DAR = 12885272;   // stable-retro steps the core twice while it sets up (test/core_equiv.mjs)

export async function sha256Hex(bytes) {
  const d = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, '0')).join('');
}

export class Genesis {
  static async create(romBytes, opts = {}) {
    const M = await createGPGX(opts);
    M.FS.writeFile('/rom.md', new Uint8Array(romBytes));
    const r = M.ccall('fe_start', 'number', ['string'], ['/rom.md']);
    if (r !== 0) throw new Error('The emulator could not load this ROM (' + r + ').');
    M.FS.unlink('/rom.md');
    for (let i = 0; i < WARM_FRAMES; i++) M._fe_frame(0, 0);
    const emulator = new Genesis(M);
    emulator.romSha256 = await sha256Hex(new Uint8Array(romBytes));
    return emulator;
  }

  constructor(M) {
    this.M = M;
    this.ram = M._fe_ram();
    this.ramSize = M._fe_ram_size();
    if (this.ramSize !== 65536) throw new Error('Expected 64 KiB Genesis work RAM.');
    this.frames = 0;
    this.audioRate = M._fe_audio_rate();
    this.rgba = null;
    this.videoDirty = true;
    this.lut = new Uint32Array(65536);       // RGB565 -> canvas RGBA (little endian)
    for (let c = 0; c < 65536; c++) {
      const r = (c >> 11) & 31, g = (c >> 5) & 63, b = c & 31;
      this.lut[c] = 0xFF000000 | (((b << 3) | (b >> 2)) << 16) | (((g << 2) | (g >> 4)) << 8) | ((r << 3) | (r >> 2));
    }
  }

  step(p1 = 0, p2 = 0) {
    if (this.closed) throw new Error('Emulator is closed.');
    this.M._fe_frame(p1, p2); this.frames++; this.videoDirty = true;
  }

  dispose() {
    if (this.closed) return;
    if (this.statePtr) this.M._free(this.statePtr);
    this.M._fe_stop(); this.closed = true;
  }

  save() {
    const M = this.M, size = M._fe_state_size();
    if (this.closed) throw new Error('Emulator is closed.');
    if (!size) throw new Error('This core does not support save states.');
    if (!this.statePtr) { this.statePtr = M._malloc(size); this.stateSize = size; }
    if (!M._fe_save(this.statePtr, size)) throw new Error('Could not save emulator state.');
    return { bytes: M.HEAPU8.slice(this.statePtr, this.statePtr + size), frame: this.frames };
  }

  load(state) {
    if (this.closed) throw new Error('Emulator is closed.');
    if (!state || !(state.bytes instanceof Uint8Array) || !Number.isSafeInteger(state.frame) || state.frame < 0) throw new Error('Invalid emulator snapshot.');
    if (!this.statePtr) this.save();
    if (state.bytes.length !== this.stateSize) throw new Error('Invalid emulator state size.');
    // GPGX unserialize clears its live framebuffer. Preserve the last rendered
    // picture until the next step().
    this.video();
    this.M.HEAPU8.set(state.bytes, this.statePtr);
    if (!this.M._fe_load(this.statePtr, this.stateSize)) throw new Error('Could not restore emulator state.');
    this.frames = state.frame;
  }

  checksum() {
    let h = 2166136261;
    const ram = this.M.HEAPU8.subarray(this.ram, this.ram + this.ramSize);
    for (const b of ram) h = Math.imul(h ^ b, 16777619) >>> 0;
    return h;
  }

  /** 68000 registers as of the end of the last frame (between two instructions). */
  registers() {
    const dv = new DataView(this.M.HEAPU8.buffer), u = k => dv.getUint32(M68K_DAR + k, true);
    const D = [], A = [];
    for (let i = 0; i < 8; i++) { D.push(u(i * 4)); A.push(u(32 + i * 4)); }
    // Field offsets from dar[0]: pc +64, sp[5] +68, ir +88, t1 +92, s +96, x +100, n +104,
    // not_z +108, v +112, c +116, int_mask +120, stopped +128. SR is built as m68ki_get_sr() does.
    const x = u(100), n = u(104), z = u(108) === 0, v = u(112), c = u(116), s = u(96) !== 0;
    const ccr = ((x & 0x100) >> 4) | ((n & 0x80) >> 4) | (z ? 4 : 0) | ((v & 0x80) >> 6) | ((c & 0x100) >> 8);
    const sr = (u(92) & 0x8000) | (s ? 0x2000 : 0) | (u(120) & 0x700) | ccr;
    return {
      cpu: '68000', D, A, PC: u(64), SR: sr, IR: u(88) & 0xFFFF, stopped: u(128) !== 0,
      USP: s ? u(68) : A[7], SSP: s ? A[7] : u(84)
    };
  }

  byte(addr) { return this.M.HEAPU8[this.ram + ((addr - RAM_BASE) ^ 1)]; }
  writeByte(addr, v) { this.M.HEAPU8[this.ram + ((addr - RAM_BASE) ^ 1)] = v & 0xFF; }

  read(addr, type) {
    const b = a => this.byte(a);
    switch (type) {
      case '|u1': return b(addr);
      case '|i1': { const v = b(addr); return v > 127 ? v - 256 : v; }
      case '>u2': return (b(addr) << 8) | b(addr + 1);
      case '>i2': { const v = (b(addr) << 8) | b(addr + 1); return v > 32767 ? v - 65536 : v; }
      case '>u4': return ((b(addr) << 24) | (b(addr + 1) << 16) | (b(addr + 2) << 8) | b(addr + 3)) >>> 0;
      default: throw new Error('RAM type ' + type);
    }
  }


  /** Copy the last frame into ImageData-ready RGBA; returns {data, width, height}. */
  video() {
    if (!this.videoDirty && this.img) return {data:this.img,width:this.videoWidth,height:this.videoHeight};
    const M = this.M, w = M._fe_width(), h = M._fe_height(), pitch = M._fe_pitch() >> 1, src = M._fe_video() >> 1;
    if (!w || !h) return null;
    if (!this.rgba || this.rgba.length !== w * h) { this.rgba = new Uint32Array(w * h); this.img = new Uint8ClampedArray(this.rgba.buffer); }
    const px = M.HEAPU16, lut = this.lut, out = this.rgba;
    for (let y = 0; y < h; y++) {
      const row = src + y * pitch, o = y * w;
      for (let x = 0; x < w; x++) out[o + x] = lut[px[row + x]];
    }
    this.videoWidth=w; this.videoHeight=h; this.videoDirty=false;
    return { data: this.img, width: w, height: h };
  }

  /** This frame's sound: interleaved stereo int16 (a view; copy before the next step). */
  audio() {
    const n = this.M._fe_audio_frames();
    return this.M.HEAP16.subarray(this.M._fe_audio() >> 1, (this.M._fe_audio() >> 1) + n * 2);
  }
}
