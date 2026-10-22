// EMULATOR CONTROL buttons: reset the emulator and open the RAM viewer window.
(function () {
  'use strict';
  var reset = document.getElementById('emu-reset'), ram = document.getElementById('ram-open');
  if (ram) ram.addEventListener('click', function () { if (globalThis.__ramViewer) globalThis.__ramViewer.open(); });
  if (!reset) return;
  var busy = false;
  function sync() {
    var a = globalThis.__arena, phase = a && a.phase;
    reset.disabled = busy || !(phase === 'playing' || phase === 'lineup');
  }
  function until(test, ms) {
    return new Promise(function (ok, no) {
      var t0 = Date.now(), id = setInterval(function () {
        var v = false; try { v = test(); } catch (e) {}
        if (v) { clearInterval(id); ok(); } else if (Date.now() - t0 > ms) { clearInterval(id); no(new Error('timeout')); }
      }, 80);
    });
  }
  // The core has no reset call, so a reset is a power cycle: end this game, return to setup
  // (your teams and options stay selected) and start it again from power-on.
  reset.addEventListener('click', function () {
    var a = globalThis.__arena, end = document.getElementById('return-select'), start = document.getElementById('start-match');
    if (busy || !a || !end || !start) return;
    busy = true; sync();
    Promise.resolve()
      .then(function () { end.click(); return until(function () { return a.phase === 'finished' || a.phase === 'lobby'; }, 8000); })
      .then(function () { if (a.phase === 'finished') { end.click(); return until(function () { return a.phase === 'lobby'; }, 8000); } })
      .then(function () { return until(function () { return !start.disabled; }, 8000); })
      .then(function () { start.click(); })
      .catch(function () {})
      .then(function () { busy = false; sync(); });
  });
  setInterval(sync, 200);
})();
