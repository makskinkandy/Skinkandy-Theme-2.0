/* vanilla-slider.js */
(function () {
  "use strict";

  const DEFAULTS = {
    dots: true,
    arrows: false,
    autoplay: false,
    shuffle: false,
    loop: false,
    interval: 5000,
    slidesToShow: 1,
    slidesToShowMobile: null,
    variableWidth: false,
    mobile: false,
    breakpoint: 768
  };

  const ROOT_HINT = "[data-slider-root]";
  const CUSTOM_PREV = "[data-slider-prev]";
  const CUSTOM_NEXT = "[data-slider-next]";
  const INTERNAL_PREV = ".vs-arrow--prev";
  const INTERNAL_NEXT = ".vs-arrow--next";
  const HIDE_INTERNAL_CLASS = "vs-internal-hidden";

  // ========== Inject once ==========
  (function injectStyle(){
    const css1 = "vs-track-style";
    if (!document.getElementById(css1)) {
      const s = document.createElement("style");
      s.id = css1;
      s.textContent = `.vs-track{transition:transform .35s ease;will-change:transform}`;
      document.head.appendChild(s);
    }
    const css2 = "vs-internal-hide-style";
    if (!document.getElementById(css2)) {
      const s = document.createElement("style");
      s.id = css2;
      s.textContent = `.${HIDE_INTERNAL_CLASS}{display:none!important}`;
      document.head.appendChild(s);
    }
    const css3 = "vs-hide-custom-arrows-attr";
    if (!document.getElementById(css3)) {
      const s = document.createElement("style");
      s.id = css3;
      // We toggle this attribute from JS so it works regardless of DOM order
      s.textContent = `[data-vs-hidden="true"]{display:none!important}`;
      document.head.appendChild(s);
    }
  })();

  // ========== Utils ==========
  function readDataOptions(node) {
    let o = {};
    ["dots","arrows","autoplay","shuffle","loop","mobile"].forEach(k => {
      if (node.dataset[k] != null) o[k] = node.dataset[k] === "true";
    });

    if (node.dataset.interval)   o.interval   = parseInt(node.dataset.interval, 10)   || DEFAULTS.interval;
    if (node.dataset.breakpoint) o.breakpoint = parseInt(node.dataset.breakpoint, 10) || DEFAULTS.breakpoint;

    const showAttr = (node.dataset.show != null) ? node.dataset.show : node.dataset.slidesToShow;
    if (showAttr != null) {
      const n = parseInt(showAttr, 10);
      if (Number.isFinite(n) && n > 0) o.slidesToShow = Math.max(1, n);
    }

    const showMobileAttr = (node.dataset.showMobile != null) ? node.dataset.showMobile : node.dataset.slidesToShowMobile;
    if (showMobileAttr != null) {
      const n = parseInt(showMobileAttr, 10);
      if (Number.isFinite(n) && n > 0) o.slidesToShowMobile = Math.max(1, n);
    }

    if (node.dataset.variableWidth != null) {
      const v = String(node.dataset.variableWidth).trim().toLowerCase();
      if (v === "true" || v === "1" || v === "yes") o.variableWidth = true;
      else if (v === "mobile") o.variableWidth = "mobile";
      else o.variableWidth = false;
    }

    if (node.dataset.options) {
      try { o = Object.assign(o, JSON.parse(node.dataset.options)); } catch(e){}
    }

    if (o.show != null && o.slidesToShow == null) {
      const n = parseInt(o.show, 10);
      if (Number.isFinite(n) && n > 0) o.slidesToShow = Math.max(1, n);
      delete o.show;
    }
    if (o.showMobile != null && o.slidesToShowMobile == null) {
      const n = parseInt(o.showMobile, 10);
      if (Number.isFinite(n) && n > 0) o.slidesToShowMobile = Math.max(1, n);
      delete o.showMobile;
    }

    if (o.variableWidth !== undefined) {
      if (typeof o.variableWidth === "string") {
        const vv = o.variableWidth.toLowerCase();
        if (vv === "mobile") o.variableWidth = "mobile";
        else if (vv === "true") o.variableWidth = true;
        else if (vv === "false") o.variableWidth = false;
      } else {
        o.variableWidth = !!o.variableWidth;
      }
    }
    return o;
  }

  function getSliderRoot(el) {
    // Prefer explicit wrapper; else fall back to the slider's parent to keep arrows in the same scope
    return el.closest(ROOT_HINT) || el.parentElement || el;
  }

  // Prefer slider vertically associated with the arrow (works if buttons are before/after)
  function resolveSliderForArrow(arrow) {
    const targetSel = arrow.getAttribute?.("data-slider-target");
    if (targetSel) {
      const s = document.querySelector(targetSel);
      if (s && s.matches && s.matches("[data-slider]")) return s;
    }

    const inside = arrow.closest?.("[data-slider]");
    if (inside) return inside;

    const root = arrow.closest?.(ROOT_HINT);
    if (root) {
      const sliders = Array.from(root.querySelectorAll("[data-slider]"))
        .filter(s => {
          const r = s.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });

      if (sliders.length === 1) return sliders[0];
      if (sliders.length > 1) {
        const T = 8;
        const ar = arrow.getBoundingClientRect();
        const arrowTop = ar.top, arrowBottom = ar.bottom;
        const arrowMidX = (ar.left + ar.right) / 2, arrowMidY = (ar.top + ar.bottom) / 2;

        // 1) Vertical overlap first
        for (const s of sliders) {
          const r = s.getBoundingClientRect();
          const overlap = !(arrowBottom < r.top - T || arrowTop > r.bottom + T);
          if (overlap) return s;
        }
        // 2) Nearest below
        let best = null, bestDelta = Infinity;
        for (const s of sliders) {
          const r = s.getBoundingClientRect();
          const delta = r.top - arrowBottom;
          if (delta >= -T && delta < bestDelta) { bestDelta = delta; best = s; }
        }
        if (best) return best;
        // 3) Nearest above
        best = null; bestDelta = Infinity;
        for (const s of sliders) {
          const r = s.getBoundingClientRect();
          const delta = arrowTop - r.bottom;
          if (delta >= -T && delta < bestDelta) { bestDelta = delta; best = s; }
        }
        if (best) return best;
        // 4) Fallback to center distance
        let bestD = Infinity;
        for (const s of sliders) {
          const r = s.getBoundingClientRect();
          const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
          const d = (cx - arrowMidX) ** 2 + (cy - arrowMidY) ** 2;
          if (d < bestD) { bestD = d; best = s; }
        }
        if (best) return best;
      }
    }

    // walk up to any section containing a slider
    let n = arrow.parentElement;
    while (n && n !== document.documentElement) {
      const s = n.querySelector?.("[data-slider]");
      if (s) return s;
      n = n.parentElement;
    }
    return document.querySelector("[data-slider]");
  }

  function ensureSlider(el) {
    if (!(el instanceof Element)) return;

    const freshOpts = Object.assign({}, DEFAULTS, readDataOptions(el));
    const bp = Number.isFinite(freshOpts.breakpoint) ? freshOpts.breakpoint : DEFAULTS.breakpoint;
    const wantEnabled = !freshOpts.mobile || window.innerWidth <= bp;
    const isEnabled = !!(el.__vs);

    if (wantEnabled && !isEnabled) {
      createSlider(el, freshOpts);
    } else if (!wantEnabled && isEnabled) {
      el.__vs?.destroy();
    } else if (wantEnabled && isEnabled) {
      const curr = el.__vs.options || {};
      const keys = [
        "slidesToShow","slidesToShowMobile","variableWidth",
        "dots","arrows","autoplay","shuffle","loop","interval","breakpoint"
      ];
      const changed = keys.some(k => (curr[k] ?? DEFAULTS[k]) !== (freshOpts[k] ?? DEFAULTS[k]));
      if (changed) {
        el.__vs.destroy();
        createSlider(el, freshOpts);
      }
    }
  }

  function ensureAll(root = document) {
    root.querySelectorAll("[data-slider]").forEach(el => ensureSlider(el));
  }

  let resizeRaf = 0;
  function onWindowResize() {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      ensureAll(document);
      resizeRaf = 0;
    });
  }

  // Toggle wrapper + arrows state (also hides custom arrows via attribute)
  function reconcileCustomArrows(wrapper, options, pageableNow){
    if (!wrapper) return;
    const bp = Number.isFinite(options.breakpoint) ? options.breakpoint : 768;
    const isDesktop = window.innerWidth > bp;

    // wrapper classes (handy for theming)
    wrapper.classList.toggle("vs-multi", !!pageableNow);
    wrapper.classList.toggle("vs-single", !pageableNow);
    wrapper.classList.toggle("vs-desktop", isDesktop);
    wrapper.classList.toggle("vs-mobile", !isDesktop);

    // actively hide or show any custom arrows inside this wrapper
    const shouldHide = isDesktop && !pageableNow;
    wrapper.querySelectorAll(`${CUSTOM_PREV},${CUSTOM_NEXT}`).forEach(btn => {
      if (shouldHide) btn.setAttribute("data-vs-hidden","true");
      else btn.removeAttribute("data-vs-hidden");
    });
  }

  // ========== Core ==========
  function createSlider(el, opts = {}) {
    if (!el || el.__vs) return el?.__vs;

    const dataOpts = readDataOptions(el);
    const options  = Object.assign({}, DEFAULTS, dataOpts, opts);

    const isControl = (n) =>
      n.classList?.contains("vs-dots") ||
      n.classList?.contains("vs-arrow") ||
      n.classList?.contains("vs-track");

    const originalSlides = Array.from(el.children).filter(n => !isControl(n));
    if (originalSlides.length <= 1) return;

    originalSlides.forEach(s => s.classList.add("vs-slide"));
    originalSlides.forEach(s => s.querySelectorAll('img').forEach(img => { img.draggable = false; }));
    originalSlides.forEach(s => s.querySelectorAll('a').forEach(a => {
      a.addEventListener('dragstart', e => e.preventDefault());
    }));

    const track = document.createElement("div");
    track.className = "vs-track";
    track.style.touchAction = 'pan-y';
    originalSlides.forEach(s => track.appendChild(s));
    el.appendChild(track);

    const wrapper = getSliderRoot(el);
    const hasCustomArrowsNow = !!(wrapper && wrapper.querySelector(`${CUSTOM_PREV}, ${CUSTOM_NEXT}`));

    let headClones = [], tailClones = [];
    let slides = [];
    let show = 1;
    let varOn = false;
    let canLoop = false;

    const count = originalSlides.length;
    let idx = 0;
    let timer = null;
    let raf = null;

    let widths = [];
    let positions = [];
    let trackGap = 0;

    function computeShow() {
      const bp = Number.isFinite(options.breakpoint) ? options.breakpoint : DEFAULTS.breakpoint;
      const mobileShow = options.slidesToShowMobile;
      const val = (window.innerWidth <= bp && Number.isFinite(mobileShow) && mobileShow > 0)
        ? mobileShow
        : options.slidesToShow;
      const n = parseInt(val, 10);
      return Math.max(1, Number.isFinite(n) ? n : 1);
    }

    function variableActive() {
      const bp = Number.isFinite(options.breakpoint) ? options.breakpoint : DEFAULTS.breakpoint;
      if (options.variableWidth === true) return true;
      if (options.variableWidth === "mobile") return window.innerWidth <= bp;
      return false;
    }

    function computeMetrics() {
      const ts = getComputedStyle(track);
      const gapStr = ts.columnGap || ts.gap || "0px";
      const g = parseFloat(gapStr);
      trackGap = Number.isFinite(g) ? g : 0;

      widths = slides.map(s => {
        const cs = getComputedStyle(s);
        const ml = parseFloat(cs.marginLeft) || 0;
        const mr = parseFloat(cs.marginRight) || 0;
        const w = s.getBoundingClientRect().width;
        return w + ml + mr;
      });

      positions = new Array(slides.length);
      positions[0] = 0;
      for (let i = 1; i < slides.length; i++) {
        positions[i] = positions[i - 1] + widths[i - 1] + trackGap;
      }
    }

    const lastIndex = () => {
      if (count <= show) return 0;
      const rem = count % show;
      return rem === 0 ? (count - show) : (count - rem);
    };
    const pageStep = () => show;

    function trackIndexFor(idxOriginal){ return idxOriginal; }

    // GPU-friendly transform
    function setTransform(px) {
      // translate3d gives smoother perf across mobile GPUs
      track.style.transform = `translate3d(${px}px,0,0)`;
    }

    function render(extraPx = 0) {
      const baseTrackIdx = trackIndexFor(idx);
      if (varOn) {
        const base = -(positions[baseTrackIdx] || 0);
        setTransform(base + extraPx);
      } else {
        const slideWidthPx = el.clientWidth / show;
        const base = -baseTrackIdx * slideWidthPx;
        setTransform(base + extraPx);
      }
    }

    // ------- Dots -------
    let dotsSets = [];
    const dotsHandlers = new Map();
    let createdDotsSet = null;

    function collectDotsSets() { dotsSets = Array.from(el.querySelectorAll(".vs-dots")); }
    function getDotElements(fromSet) {
      if (!fromSet) return [];
      let dots = Array.from(fromSet.querySelectorAll(".vs-dot, [data-vs-dot]"));
      if (dots.length === 0) dots = Array.from(fromSet.children);
      return dots;
    }
    function buildAutoDots(container) {
      container.innerHTML = "";
      const pages = pageCount();
      for (let i = 0; i < pages; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "vs-dot";
        b.setAttribute("aria-label", `Go to slide ${i + 1}`);
        container.appendChild(b);
      }
    }
    function pageCount() { return Math.ceil(count / show); }
    function pageStarts() {
      const last = lastIndex();
      const pages = pageCount();
      const starts = Array.from({ length: pages }, (_, p) => Math.min(p * show, last));
      return starts.filter((v, i, a) => a.indexOf(v) === i);
    }
    function bindDots() {
      if (dotsSets.length === 0 && options.dots) {
        const ds = document.createElement("div");
        ds.className = "vs-dots";
        buildAutoDots(ds);
        el.appendChild(ds);
        createdDotsSet = ds;
        dotsSets = [ds];
      }
      dotsSets.forEach(set => {
        const handler = (e) => {
          const allDots = getDotElements(set);
          if (allDots.length === 0) return;
          let node = e.target;
          while (node && node !== set && !allDots.includes(node)) node = node.parentElement;
          if (!node || node === set) return;
          const i = allDots.indexOf(node);
          if (i < 0) return;

          const starts = pageStarts();
          const goIndex = (allDots.length === starts.length)
            ? starts[i]
            : Math.min(i, lastIndex());
          goTo(goIndex, true);
        };
        set.addEventListener("click", handler);
        dotsHandlers.set(set, handler);
      });
    }
    function unbindDots() {
      dotsSets.forEach(set => {
        const handler = dotsHandlers.get(set);
        if (handler) set.removeEventListener("click", handler);
      });
      dotsHandlers.clear();
      if (createdDotsSet) { createdDotsSet.remove(); createdDotsSet = null; }
      dotsSets = [];
    }

    collectDotsSets();
    bindDots();

    // ------- Arrows -------
    let prevBtn = null, nextBtn = null;
    const shouldCreateInternalArrows = options.arrows && !hasCustomArrowsNow;

    if (shouldCreateInternalArrows) {
      prevBtn = document.createElement("button");
      nextBtn = document.createElement("button");
      prevBtn.type = "button"; nextBtn.type = "button";
      prevBtn.className = "vs-arrow vs-arrow--prev";
      nextBtn.className = "vs-arrow vs-arrow--next";
      prevBtn.setAttribute("aria-label", "Previous slide");
      nextBtn.setAttribute("aria-label", "Next slide");
      prevBtn.innerHTML = "<img src='/cdn/shop/t/101/assets/arrow-white.svg' alt='Previous'>";
      nextBtn.innerHTML = "<img src='/cdn/shop/t/101/assets/arrow-white.svg' alt='Next'>";
      prevBtn.addEventListener("click", () => goTo(idx - pageStep(), true));
      nextBtn.addEventListener("click", () => goTo(idx + pageStep(), true));
      el.appendChild(prevBtn);
      el.appendChild(nextBtn);
    }

    // Keep internal arrows hidden when custom appear
    let arrowsMO = null;
    (function setupInternalArrowReconciler(){
      if (!options.arrows) return;
      if (!wrapper) return;
      const check = () => {
        const hasCustom = !!wrapper.querySelector(`${CUSTOM_PREV}, ${CUSTOM_NEXT}`);
        const internals = wrapper.querySelectorAll(`${INTERNAL_PREV}, ${INTERNAL_NEXT}`);
        internals.forEach(b => b.classList.toggle(HIDE_INTERNAL_CLASS, hasCustom));
      };
      check();
      arrowsMO = new MutationObserver(() => check());
      arrowsMO.observe(wrapper, { childList: true, subtree: true });
    })();

    // ------- Autoplay / Shuffle -------
    function randomIndex() {
      const pages = Math.ceil(count / show);
      if (pages <= 1) return 0;
      let r = Math.floor(Math.random() * pages);
      const curr = Math.floor(idx / show);
      if (r === curr) r = (r + 1) % pages;
      return Math.min(r * show, lastIndex());
    }
    function startAutoplay() {
      stopAutoplay();
      if (!(options.autoplay || options.shuffle)) return;
      timer = window.setInterval(() => {
        if (options.shuffle) goTo(randomIndex());
        else next();
      }, Math.max(2000, options.interval));
    }
    function stopAutoplay() { if (timer) { clearInterval(timer); timer = null; } }

    // ------- Smooth drag with spring -------
    let pointerDown = false;
    let dragging = false;
    let startX = 0;

    // spring state
    let desiredDeltaX = 0;   // where we want to be (from finger)
    let springX = 0;         // current rendered offset
    let springV = 0;         // velocity (px/s)
    let springRAF = 0;
    let lastT = 0;           // ms

    // velocity for momentum (px/ms)
    let trackV = 0;
    let lastMoveT = 0;
    let lastMoveX = 0;

    let draggedBeyondClick = false;

    const DRAG_START_PX = 6;

    // spring constants (critically damped-ish). Tune to taste.
    const K = 40;   // stiffness
    const C = 12;   // damping

    function resistedDelta(dx) {
      const atFirst = idx === 0 && dx > 0;
      const atLast  = idx === lastIndex() && dx < 0;
      return (atFirst || atLast) ? dx * 0.35 : dx;
    }

    function springFrame(ts){
      if (!dragging) { springRAF = 0; return; }
      if (!lastT) lastT = ts;
      let dt = (ts - lastT) / 1000; // seconds
      if (dt > 0.05) dt = 0.05;     // clamp to avoid jumps on tab-switch

      // a = k*(target - x) - c*v
      const a = K * (desiredDeltaX - springX) - C * springV;
      springV += a * dt;
      springX += springV * dt;

      render(springX);

      lastT = ts;
      springRAF = requestAnimationFrame(springFrame);
    }

    const onClickCapture = (e) => {
      if (draggedBeyondClick) {
        e.preventDefault();
        e.stopPropagation();
        draggedBeyondClick = false;
      }
    };
    el.addEventListener("click", onClickCapture, true);

    const hasPointer = 'PointerEvent' in window;

    function beginDrag(pointerId) {
      dragging = true;
      track.classList.add('is-dragging');
      // kill CSS transition during drag
      track.__prevTransition = track.style.transition;
      track.style.transition = 'none';
      stopAutoplay();
      try { track.setPointerCapture?.(pointerId); } catch {}
      lastT = 0; // reset spring timer
      if (!springRAF) springRAF = requestAnimationFrame(springFrame);
    }

    function endDrag(pointerId) {
      dragging = false;
      track.classList.remove('is-dragging');
      try { track.releasePointerCapture?.(pointerId); } catch {}

      // restore CSS transition for snap / settle
      track.style.transition = track.__prevTransition || '';
      track.__prevTransition = '';

      cancelAnimationFrame(springRAF);
      springRAF = 0;

      desiredDeltaX = 0;
      springX = 0;
      springV = 0;
      startAutoplay();
    }

    const onPointerDown = (e) => {
      if (e.button != null && e.button !== 0) return;
      pointerDown = true;
      dragging = false;
      startX = e.clientX;

      desiredDeltaX = 0;
      springX = 0;
      springV = 0;
      draggedBeyondClick = false;

      lastMoveT = performance.now();
      lastMoveX = startX;
      trackV = 0;
    };

    const onPointerMove = (e) => {
      if (!pointerDown) return;
      const rawDx = e.clientX - startX;
      const dx = resistedDelta(rawDx);

      // track velocity in px/ms (low-pass)
      const now = performance.now();
      const dt = Math.max(1, now - lastMoveT);
      const instV = (e.clientX - lastMoveX) / dt;
      trackV = trackV * 0.8 + instV * 0.2;
      lastMoveT = now;
      lastMoveX = e.clientX;

      if (!dragging && Math.abs(rawDx) > DRAG_START_PX) {
        beginDrag(e.pointerId);
      }
      if (dragging) {
        desiredDeltaX = dx;
        if (Math.abs(rawDx) > DRAG_START_PX) draggedBeyondClick = true;
      }
    };

    function computeThresholdPx() {
      if (varOn) return Math.max(36, el.clientWidth * 0.08);
      const slideWidthPx = el.clientWidth / show;
      return Math.max(36, slideWidthPx * 0.18);
    }

    const onPointerUp = (e) => {
      if (!pointerDown) return;
      pointerDown = false;

      if (!dragging) return;

      const threshold = computeThresholdPx();
      // Momentum projection: convert px/ms to px with a short horizon
      const momentumPx = Math.max(-180, Math.min(180, trackV * 180));
      const projected = desiredDeltaX + momentumPx;

      if (Math.abs(projected) > threshold) {
        if (projected < 0) next(); else prev();
      } else {
        applyTransform(); // snap back
      }
      endDrag(e.pointerId);
    };

    const onPointerCancel = (e) => {
      if (!pointerDown) return;
      pointerDown = false;
      if (dragging) {
        applyTransform();
        endDrag(e.pointerId);
      } else {
        startAutoplay();
      }
    };

    // Touch fallback
    let onTouchStart, onTouchMove, onTouchEnd, onTouchCancel;

    if (hasPointer) {
      track.addEventListener("pointerdown", onPointerDown, { passive: true });
      track.addEventListener("pointermove", onPointerMove, { passive: true });
      track.addEventListener("pointerup", onPointerUp, { passive: true });
      track.addEventListener("pointercancel", onPointerCancel, { passive: true });
      track.addEventListener("pointerleave", onPointerCancel, { passive: true });
    } else {
      let touching = false;
      let touchDragging = false;

      onTouchStart = (e) => {
        touching = true; touchDragging = false;
        startX = e.touches[0].clientX;

        desiredDeltaX = 0; springX = 0; springV = 0;
        draggedBeyondClick = false;

        lastMoveT = performance.now();
        lastMoveX = startX;
        trackV = 0;
      };
      onTouchMove = (e) => {
        if (!touching) return;
        const rawDx = e.touches[0].clientX - startX;
        const dx = resistedDelta(rawDx);

        const now = performance.now();
        const dt = Math.max(1, now - lastMoveT);
        const instV = (e.touches[0].clientX - lastMoveX) / dt;
        trackV = trackV * 0.8 + instV * 0.2;
        lastMoveT = now;
        lastMoveX = e.touches[0].clientX;

        if (!touchDragging && Math.abs(rawDx) > DRAG_START_PX) {
          touchDragging = true;
          track.classList.add('is-dragging');
          track.__prevTransition = track.style.transition;
          track.style.transition = 'none';
          stopAutoplay();
          lastT = 0;
          if (!springRAF) springRAF = requestAnimationFrame(springFrame);
        }
        if (touchDragging) {
          desiredDeltaX = dx;
          if (Math.abs(rawDx) > DRAG_START_PX) draggedBeyondClick = true;
        }
      };
      onTouchEnd = () => {
        if (!touching) return;
        touching = false;

        if (!touchDragging) return;

        touchDragging = false;
        track.classList.remove('is-dragging');
        track.style.transition = track.__prevTransition || '';
        track.__prevTransition = '';

        cancelAnimationFrame(springRAF);
        springRAF = 0;

        const threshold = computeThresholdPx();
        const momentumPx = Math.max(-180, Math.min(180, trackV * 180));
        const projected = desiredDeltaX + momentumPx;

        if (Math.abs(projected) > threshold) {
          if (projected < 0) next(); else prev();
        } else {
          applyTransform();
        }
        startAutoplay();
        desiredDeltaX = 0; springX = 0; springV = 0;
      };
      onTouchCancel = onTouchEnd;

      track.addEventListener("touchstart", onTouchStart, { passive: true });
      track.addEventListener("touchmove", onTouchMove, { passive: true });
      track.addEventListener("touchend", onTouchEnd, { passive: true });
      track.addEventListener("touchcancel", onTouchCancel, { passive: true });
    }

    // external driver
    track.addEventListener("vs:step", (e) => {
      const dir = (e && e.detail && typeof e.detail.dir === "number") ? e.detail.dir : 0;
      if (dir < 0) prev(); else next();
      e.preventDefault();
    });

    function applyTransform() {
      render(0);
      updateDots();
      updateArrows();
    }

    function measure() {
      const oldIdx = idx;
      const newShow = computeShow();
      const newVar  = variableActive();

      canLoop = false;

      if (newVar) {
        originalSlides.forEach(s => (s.style.width = ""));
        headClones.forEach(s => (s.style.width = ""));
        tailClones.forEach(s => (s.style.width = ""));
      } else {
        const w = (100 / newShow) + "%";
        originalSlides.forEach(s => (s.style.width = w));
        headClones.forEach(s => (s.style.width = w));
        tailClones.forEach(s => (s.style.width = w));
      }

      const showChanged = newShow !== show;
      const varChanged  = newVar !== varOn;
      show = newShow;
      varOn = newVar;

      headClones.forEach(n => n.remove());
      tailClones.forEach(n => n.remove());
      headClones = []; tailClones = [];
      slides = Array.from(track.children);

      computeMetrics();

      if (showChanged || varChanged) {
        idx = Math.min(Math.floor(oldIdx / show) * show, lastIndex());
      }

      // reconcile arrows visibility (custom + internal) against pageable state
      const pageable = Math.ceil(count / show) > 1;
      reconcileCustomArrows(wrapper, options, pageable);

      applyTransform();
    }

    function updateDots() {
      if (dotsSets.length === 0) return;
      const starts = pageStarts();

      dotsSets.forEach(set => {
        const dots = getDotElements(set);
        if (dots.length === 0) return;

        if (createdDotsSet && set === createdDotsSet && dots.length !== starts.length) {
          buildAutoDots(set);
        }

        let active = starts.indexOf(idx);
        if (active === -1) {
          active = 0;
          for (let j = 0; j < starts.length; j++) {
            if (idx >= starts[j]) active = j; else break;
          }
        }

        const isPageSet = (dots.length === starts.length);
        const activeIndex = isPageSet ? active : Math.min(idx, dots.length - 1);

        dots.forEach((b, i) => {
          if (i === activeIndex) {
            b.setAttribute("aria-current", "true");
            b.classList.add("is-active");
          } else {
            b.removeAttribute("aria-current");
            b.classList.remove("is-active");
          }
        });
      });
    }

    function updateArrows() {
      if (!options.arrows) return;
      const atStart = idx <= 0;
      const atEnd   = idx >= lastIndex();
      const multi   = lastIndex() > 0;
      const showPrev = options.loop ? multi : !atStart;
      const showNext = options.loop ? multi : !atEnd;

      if (prevBtn) {
        prevBtn.hidden = !showPrev;
        prevBtn.disabled = !showPrev;
        prevBtn.setAttribute("aria-disabled", String(!showPrev));
      }
      if (nextBtn) {
        nextBtn.hidden = !showNext;
        nextBtn.disabled = !showNext;
        nextBtn.setAttribute("aria-disabled", String(!showNext));
      }

      const pageable = Math.ceil(count / show) > 1;
      reconcileCustomArrows(wrapper, options, pageable);
    }

    function goTo(targetIdx, stopAuto) {
      const last = lastIndex();
      let newIdx = targetIdx;

      if (options.loop) {
        if (targetIdx > last) newIdx = 0;
        else if (targetIdx < 0) newIdx = last;
      }

      idx = Math.max(0, Math.min(newIdx, last));
      applyTransform();
      if (stopAuto) stopAutoplay();
    }

    function next(){ goTo(idx + pageStep()); }
    function prev(){ goTo(idx - pageStep()); }

    // hover pause
    el.addEventListener("mouseenter", stopAutoplay);
    el.addEventListener("mouseleave", startAutoplay);

    // element resize
    const ro = new ResizeObserver(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    ro.observe(el);

    // init
    slides = Array.from(track.children);
    measure();
    updateDots();
    updateArrows();
    startAutoplay();

    const api = { next, prev, goTo, startAutoplay, stopAutoplay, destroy, options };
    el.__vs = api;
    return api;

    function destroy() {
      stopAutoplay();
      ro.disconnect();

      el.removeEventListener("mouseenter", stopAutoplay);
      el.removeEventListener("mouseleave", startAutoplay);
      el.removeEventListener("click", onClickCapture, true);

      if (arrowsMO) { arrowsMO.disconnect(); arrowsMO = null; }

      if (hasPointer) {
        track.removeEventListener("pointerdown", onPointerDown, { passive: true });
        track.removeEventListener("pointermove", onPointerMove, { passive: true });
        track.removeEventListener("pointerup", onPointerUp, { passive: true });
        track.removeEventListener("pointercancel", onPointerCancel, { passive: true });
        track.removeEventListener("pointerleave", onPointerCancel, { passive: true });
      } else {
        track.removeEventListener("touchstart", onTouchStart, { passive: true });
        track.removeEventListener("touchmove", onTouchMove, { passive: true });
        track.removeEventListener("touchend", onTouchEnd, { passive: true });
        track.removeEventListener("touchcancel", onTouchCancel, { passive: true });
      }

      unbindDots();

      const pBtn = el.querySelector(INTERNAL_PREV);
      const nBtn = el.querySelector(INTERNAL_NEXT);
      if (pBtn) pBtn.remove();
      if (nBtn) nBtn.remove();

      headClones.forEach(n => n.remove());
      tailClones.forEach(n => n.remove());
      originalSlides.forEach(s => track.appendChild(s));

      const children = Array.from(track.children);
      children.forEach(c => el.appendChild(c));
      track.remove();
      delete el.__vs;
    }
  }

  // -------- Auto-init / observers --------
  function initAll(root = document) {
    root.querySelectorAll("[data-slider]").forEach(el => ensureSlider(el));
  }

  const mo = new MutationObserver((muts) => {
    muts.forEach(m => {
      if (m.type === "childList") {
        m.addedNodes.forEach(node => {
          if (!(node instanceof Element)) return;
          if (node.matches?.("[data-slider]")) ensureSlider(node);
          initAll(node);
        });
      } else if (m.type === "attributes") {
        const node = m.target;
        if (node instanceof Element && node.matches?.("[data-slider]")) {
          ensureSlider(node);
        }
      }
    });
  });

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(() => {
    initAll(document);
    window.addEventListener("resize", onWindowResize);
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-mobile",
        "data-breakpoint",
        "data-options",
        "data-show",
        "data-slides-to-show",
        "data-show-mobile",
        "data-slides-to-show-mobile",
        "data-variable-width",
        "data-dots",
        "data-arrows",
        "data-autoplay",
        "data-shuffle",
        "data-loop",
        "data-interval"
      ]
    });
  });

  // Public API
  window.VanillaSlider = {
    create: createSlider,
    initAll,
    ensureAll,
    ensure: ensureSlider
  };

  // Global custom arrows delegate
  if (!window.__vsArrowsDelegated) {
    window.__vsArrowsDelegated = true;
    document.addEventListener("click", (e) => {
      const prev = e.target.closest(CUSTOM_PREV);
      const next = !prev && e.target.closest(CUSTOM_NEXT);
      if (!prev && !next) return;

      const arrow = prev || next;
      const slider = resolveSliderForArrow(arrow);
      if (!slider) return;

      VanillaSlider.ensure(slider);
      const api = slider.__vs;
      if (!api) return;

      e.preventDefault();
      if (prev) api.prev(); else api.next();
    }, true);
  }

})();

/* featured-collections image height sync (unchanged except tiny tidy) */
(function () {
  "use strict";

  function syncSection(section) {
    const items = section.querySelectorAll('.featured-collections__products-item');
    items.forEach(item => {
      const img = item.querySelector('.featured-collections__collection img')
                || section.querySelector('.featured-collections__collection img');
      if (!img) return;

      const h = Math.ceil(item.getBoundingClientRect().height);
      if (h > 0) {
        img.style.height = h + 'px';
        img.style.width = '100%';
        img.style.objectFit = 'cover';
        img.style.display = 'block';
      }
    });
  }

  const debounce = (fn, wait = 100) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  };

  function bindSlider(sliderEl) {
    if (sliderEl.__fcBound) return;
    sliderEl.__fcBound = true;

    const section = sliderEl.closest('.featured-collections') || document;
    const run = () => syncSection(section);
    const runDebounced = debounce(run, 60);

    const track = sliderEl.querySelector('.vs-track');
    if (track) {
      run();
      track.addEventListener('transitionend', runDebounced);
    }

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(runDebounced);
      ro.observe(sliderEl);
      sliderEl.__fcRO = ro;
      section.querySelectorAll('.featured-collections__products-item').forEach(i => ro.observe(i));
    }

    section.querySelectorAll('.featured-collections__collection img').forEach(img => {
      if (!img.complete) img.addEventListener('load', runDebounced, { once: true });
    });

    window.addEventListener('resize', runDebounced);
  }

  const observeSliders = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches?.('[data-slider]')) bindSlider(node);
        node.querySelectorAll?.('[data-slider]').forEach(el => bindSlider(el));
      });
      if (m.target instanceof Element && m.target.matches?.('[data-slider]')) bindSlider(m.target);
    });
  });

  function initNow() {
    document.querySelectorAll('[data-slider]').forEach(bindSlider);
    observeSliders.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNow, { once: true });
  } else {
    initNow();
  }
})();
