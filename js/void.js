(function () {
  "use strict";

  var MAX_PARTICLES = 14;
  var SPAWN_INTERVAL_MS = 1000;
  var DURATION_MS = 10500;
  var DURATION_JITTER_MS = 1600;
  var USER_DURATION_MS = 13200;
  var USER_DURATION_JITTER_MS = 2200;
  var SUBMIT_DEBOUNCE_MS = 650;

  var particlesEl = null;
  var pool = [];
  var active = [];
  var reducedMotion = false;
  var spawnTimer = null;
  var rafId = 0;
  var lastSubmit = 0;
  var motionQuery = null;

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function easeInCubic(t) {
    return t * t * t;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function removeParticle(p) {
    if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
    var i = active.indexOf(p);
    if (i !== -1) active.splice(i, 1);
  }

  function triggerBurst(x, y, isUser) {
    if (!particlesEl || reducedMotion) return;

    var burst = document.createElement("span");
    burst.className = "void-burst" + (isUser ? " void-burst--user" : "");
    burst.setAttribute("aria-hidden", "true");
    burst.style.left = x + "px";
    burst.style.top = y + "px";
    particlesEl.appendChild(burst);

    burst.addEventListener("animationend", function () {
      if (burst.parentNode) burst.parentNode.removeChild(burst);
    });
  }

  function tick(now) {
    if (reducedMotion) {
      rafId = 0;
      return;
    }

    var cx = window.innerWidth * 0.5;
    var cy = window.innerHeight * 0.48;

    for (var i = active.length - 1; i >= 0; i--) {
      var p = active[i];
      var t = (now - p.start) / p.duration;
      if (t >= 1) {
        triggerBurst(cx, cy, p.isUser);
        removeParticle(p);
        continue;
      }
      var e = easeInCubic(t);
      var r = p.r0 * (1 - e) + p.r1 * e;
      var ang = p.angle0 + p.spins * Math.PI * 2 * e;
      var x = cx + Math.cos(ang) * r;
      var y = cy + Math.sin(ang) * r;
      var fade = 1 - Math.pow(t, 0.85);
      var scaleY = 1 + (p.isUser ? 2.1 : 2.4) * e;
      var scaleX = 1 - (p.isUser ? 0.28 : 0.35) * e;
      var opacityMul = p.isUser ? 0.98 : 0.92;
      p.el.style.opacity = String(fade * opacityMul);
      p.el.style.transform =
        "translate(-50%, -50%) translate3d(" +
        x +
        "px, " +
        y +
        "px, 0) scale(" +
        scaleX +
        ", " +
        scaleY +
        ") rotate(" +
        (p.rot0 + (p.isUser ? 14 : 18) * e).toFixed(2) +
        "deg)";
      var blurK = p.isUser ? 0.48 : 0.8;
      p.el.style.filter = "blur(" + (blurK * e).toFixed(2) + "px)";
    }

    if (active.length) {
      rafId = window.requestAnimationFrame(tick);
    } else {
      rafId = 0;
    }
  }

  function spawn(text, opts) {
    if (!particlesEl || reducedMotion) return;
    opts = opts || {};
    var isUser = !!opts.user;

    if (active.length >= MAX_PARTICLES) {
      removeParticle(active[0]);
    }

    var el = document.createElement("span");
    el.className = "void-particle" + (isUser ? " void-particle--user" : "");
    el.setAttribute("aria-hidden", "true");
    el.textContent = text;
    particlesEl.appendChild(el);

    var cx = window.innerWidth * 0.5;
    var cy = window.innerHeight * 0.48;
    var maxR = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy)
    );
    var rMin = maxR * (isUser ? 0.26 : 0.3);
    var rMax = maxR * (isUser ? 0.52 : 0.58);
    var r0 = rMin + Math.random() * (rMax - rMin);
    var angle0 = Math.random() * Math.PI * 2;

    var baseDur = isUser ? USER_DURATION_MS : DURATION_MS;
    var jitter = isUser ? USER_DURATION_JITTER_MS : DURATION_JITTER_MS;
    var duration = baseDur + Math.random() * jitter;
    var spins = isUser
      ? 0.38 + Math.random() * 0.32
      : 0.48 + Math.random() * 0.52;

    var p = {
      el: el,
      start: performance.now(),
      duration: duration,
      r0: r0,
      r1: 6 + Math.random() * 14,
      angle0: angle0,
      spins: spins,
      rot0: (Math.random() - 0.5) * 36,
      isUser: isUser,
    };
    active.push(p);
    if (!rafId) rafId = window.requestAnimationFrame(tick);
  }

  function clearSpawnTimer() {
    if (spawnTimer) {
      window.clearInterval(spawnTimer);
      spawnTimer = null;
    }
  }

  function clearAllParticles() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    while (active.length) {
      removeParticle(active[active.length - 1]);
    }
  }

  function applyMotionPreference() {
    if (prefersReducedMotion()) {
      reducedMotion = true;
      clearSpawnTimer();
      clearAllParticles();
      return;
    }
    reducedMotion = false;
    if (pool.length && !spawnTimer && document.visibilityState === "visible") {
      scheduleSpawns();
    }
  }

  function scheduleSpawns() {
    if (reducedMotion || !pool.length) return;
    if (document.visibilityState !== "visible") return;
    clearSpawnTimer();
    spawnTimer = window.setInterval(function () {
      if (window.VoidFragments && pool.length) {
        var t = window.VoidFragments.randomText(pool);
        if (t) spawn(t);
      }
    }, SPAWN_INTERVAL_MS);
  }

  function wireFeedForm() {
    var form = document.getElementById("feed-form");
    var ta = document.getElementById("feed-text");
    var saveCb = document.getElementById("feed-save-local");
    var counter = document.getElementById("feed-counter");
    var submitBtn = document.getElementById("feed-submit");
    if (!form || !ta) return;

    var max = Number(ta.getAttribute("maxlength")) || 100;

    function updateCounter() {
      if (!counter) return;
      var left = max - ta.value.length;
      counter.textContent =
        "还可输入 " + clamp(left, 0, max) + " 字";
    }

    function syncSubmit() {
      var has = ta.value.trim().length > 0;
      if (submitBtn) submitBtn.disabled = !has;
    }

    ta.addEventListener("input", function () {
      updateCounter();
      syncSubmit();
    });
    updateCounter();
    syncSubmit();

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var now = Date.now();
      if (now - lastSubmit < SUBMIT_DEBOUNCE_MS) return;
      lastSubmit = now;

      var raw = ta.value;
      var text = String(raw || "").trim().slice(0, max);
      if (!text) return;

      if (saveCb && saveCb.checked && window.VoidFragments) {
        window.VoidFragments.rememberLocal(text);
        window.VoidFragments
          .loadRemote()
          .catch(function () {
            return [];
          })
          .then(function (remote) {
            pool = window.VoidFragments.merge(remote || []);
          });
      }

      spawn(text, { user: true });
      ta.value = "";
      updateCounter();
      syncSubmit();
    });
  }

  function init() {
    particlesEl = document.getElementById("void-particles");
    reducedMotion = prefersReducedMotion();

    if (!particlesEl || !window.VoidFragments) return;

    wireFeedForm();

    if (window.matchMedia) {
      motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      var onMotionChange = function () {
        applyMotionPreference();
        if (!reducedMotion && pool.length) {
          spawn(window.VoidFragments.randomText(pool));
        }
      };
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener("change", onMotionChange);
      } else if (motionQuery.addListener) {
        motionQuery.addListener(onMotionChange);
      }
    }

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        clearSpawnTimer();
      } else if (!reducedMotion && pool.length) {
        scheduleSpawns();
      }
    });

    window.VoidFragments
      .loadRemote()
      .catch(function () {
        return [];
      })
      .then(function (remote) {
        pool = window.VoidFragments.merge(remote || []);
        if (!reducedMotion && pool.length) {
          spawn(window.VoidFragments.randomText(pool));
          scheduleSpawns();
        }
      });

    window.addEventListener(
      "resize",
      function () {
        /* particles self-correct next frame via cx/cy */
      },
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
