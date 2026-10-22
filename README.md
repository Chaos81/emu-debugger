# emu-debugger

A browser-based Sega Genesis and Super Nintendo emulator, being turned into a debugger. Pick a system,
load **your own ROM** from your computer and start the game. The emulator boots the ROM from power-on,
like a console. Any ROM, hack or homebrew works.
Two players can play on one computer (two keyboard layouts or two controllers).

For non-commercial use. **No ROMs are included or hosted; supply your own.**

## Run it

From this folder:

```
python3 -m http.server 8000
```

Open <http://localhost:8000/>. Any static web host works (it also runs from a sub-folder, for example GitHub Pages).

## Features

- Genesis (Genesis Plus GX) and SNES (Snes9x2010) cores compiled to WebAssembly
- ROM CRC32 shown once the ROM loads
- Save and load states (`.state`, named after the ROM). Saves and replays from earlier builds still load.
- Emulator volume slider and mute
- Setup panel collapses when a game starts (Show setup button brings it back)
- EMULATOR CONTROL (under Play & Controls): **Reset emulator** restarts the game from power-on; **Step frame**
  pauses and runs exactly one frame; **Debugger** opens a separate debugger window:
  - Run control: Pause / Resume, Step frame, Step N frames, current frame number
    (keys in the debugger window: F8 pause / resume, F10 step, Shift+F10 step N)
  - Registers: the CPU registers as of the end of the last frame (Genesis 68000: D0-D7, A0-A7, PC,
    SR, USP, SSP, flags; SNES 65816: A, X, Y, S, D, DB, PB, PC, P, flags, register widths and
    emulation mode). Changed registers are highlighted; clicking an address register that points
    into work RAM shows it in the memory view
  - Watch list: work-RAM addresses as 8/16/32-bit signed or unsigned values; click a value to edit it
    (decimal or `$hex`); **Freeze** keeps it fixed every frame. Load / save the list as CSV
    (`Label,address[,type]` per line; an optional header row is skipped)
  - Memory view: 256 bytes per page with ASCII; click a byte to edit it, right-click to freeze it;
    changed bytes are yellow, frozen bytes blue
  - Changing or freezing RAM stops replay recording for that game (Save replay keeps what came before)
- Replays: **Save replay** records every button press by frame (both players) into a
  small `.replay` file; **Watch replay** plays it back exactly by booting the same ROM from power-on.
  Loading a save state mid-game is stored in the replay too. A replay only plays with the same ROM
  (CRC32) and emulator build it was recorded with.

See the notes in `docs/CHANGES.txt` for the full change history.

## Third-party code and licenses

- Genesis Plus GX: <https://github.com/ekeeke/Genesis-Plus-GX> (its own license; non-commercial use)
- Snes9x2010: <https://github.com/libretro/snes9x2010> (non-commercial license)

The bundled `game/core/*.wasm` files are prebuilt binaries of those emulators; refer to the
upstream projects for their licenses and source code. This project started as a private copy of
94online-arena (itself derived from a browser NHL '94 arena originally published at kingof94.web.app);
online play has been removed.
