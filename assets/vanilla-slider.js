/* vanilla-slider.js */
(function () {
  "use strict";

  const DEFAULTS = {
    dots: true,
    arrows: false,
    autoplay: false,
    shuffle: false,
    // Loop semantics changed: no clones; wrap between first/last pages.
    loop: false,
    interval: 5000,            // ms
    slidesToShow: 1,           // base/desktop
    slidesToShowMobile: null,  // optional mobile override
    variableWidth: false,      // false | true | 'mobile'
    mobile: false,             // only enable on mobile breakpoint?
    breakpoint: 768            // width (px) threshold
  };

  // Ensure we have a transition for smooth movement
  (function injectStyle(){
    const id = "vs-track-style";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = `.vs-track{transition:transform .35s ease;will-change:transform}`;
      document.head.appendChild(s);
    }
  })();

  // ========= Utilities =========
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

  // ========= Slider core =========
  function createSlider(el, opts = {}) {
    if (!el || el.__vs) return el?.__vs;

    const dataOpts = readDataOptions(el);
    const options = Object.assign({}, DEFAULTS, dataOpts, opts);

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

    // We keep clone scaffolding (unused now) for minimal diff surface
    let headClones = [];
    let tailClones = [];
    let slides = [];
    let show = 1;
    let varOn = false;
    let canLoop = false; // clone-based infinite mode (disabled in this version)

    function removeClones(){
      headClones.forEach(n => n.remove());
      tailClones.forEach(n => n.remove());
      headClones = [];
      tailClones = [];
    }
    function rebuildClones(){ /* not used anymore */ }

    const count = originalSlides.length;
    let idx = 0;      // index into ORIGINAL pages (0..lastIndex())
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

    // ---- NEW lastIndex() (replaces maxIndex()) ----
    const lastIndex = () => {
      if (count <= show) return 0;
      const rem = count % show;
      return rem === 0 ? (count - show) : (count - rem);
    };
    const pageStep = () => show;

    function trackIndexFor(idxOriginal){
      return (canLoop ? headClones.length : 0) + idxOriginal;
    }

    function render(extraPx = 0) {
      const baseTrackIdx = trackIndexFor(idx);
      if (varOn) {
        const base = -(positions[baseTrackIdx] || 0);
        track.style.transform = `translateX(${base + extraPx}px)`;
      } else {
        const slideWidthPx = el.clientWidth / show;
        const base = -baseTrackIdx * slideWidthPx;
        track.style.transform = `translateX(${base + extraPx}px)`;
      }
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
      const atEnd = idx >= lastIndex();
      const multi = lastIndex() > 0;
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
    }

    function applyTransform() {
      render(0);
      updateDots();
      updateArrows();
    }

    function measure() {
      const oldIdx = idx;
      const newShow = computeShow();
      const newVar = variableActive();

      // Clone-based loop is disabled; we only wrap indices in goTo()
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

      // No clone mode
      removeClones();
      slides = Array.from(track.children);

      computeMetrics();

      if (showChanged || varChanged) {
        idx = Math.min(Math.floor(oldIdx / show) * show, lastIndex());
      }

      applyTransform();
    }

    // ===== Dots (multi-set) =====
    let dotsSets = [];
    const dotsHandlers = new Map();
    let createdDotsSet = null;

    function collectDotsSets() {
      dotsSets = Array.from(el.querySelectorAll(".vs-dots"));
    }
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
      if (createdDotsSet) {
        createdDotsSet.remove();
        createdDotsSet = null;
      }
      dotsSets = [];
    }

    collectDotsSets();
    bindDots();

    // ===== Arrows =====
    let prevBtn = null, nextBtn = null;
    if (options.arrows) {
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

    // ===== Autoplay / Shuffle =====
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
    function stopAutoplay() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    // ===== Drag / Swipe =====
    let pointerDown = false;
    let dragging = false;
    let startX = 0;
    let deltaX = 0;
    let draggedBeyondClick = false;

    const DRAG_START_PX = 6;

    function resistedDelta(dx) {
      // Resist at edges (since clones are not used)
      const atFirst = idx === 0 && dx > 0;
      const atLast  = idx === lastIndex() && dx < 0;
      if (atFirst || atLast) return dx * 0.35;
      return dx;
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
      track.style.userSelect = 'none';
      track.style.cursor = 'grabbing';
      stopAutoplay();
      try { track.setPointerCapture?.(pointerId); } catch {}
    }

    function endDrag(pointerId) {
      dragging = false;
      track.classList.remove('is-dragging');
      track.style.userSelect = '';
      track.style.cursor = '';
      try { track.releasePointerCapture?.(pointerId); } catch {}
      startAutoplay();
      deltaX = 0;
    }

    const onPointerDown = (e) => {
      if (e.button != null && e.button !== 0) return;
      pointerDown = true;
      dragging = false;
      startX = e.clientX;
      deltaX = 0;
      draggedBeyondClick = false;
    };

    const onPointerMove = (e) => {
      if (!pointerDown) return;
      const rawDx = e.clientX - startX;
      const dx = resistedDelta(rawDx);

      if (!dragging && Math.abs(rawDx) > DRAG_START_PX) {
        beginDrag(e.pointerId);
      }
      if (dragging) {
        deltaX = dx;
        if (Math.abs(rawDx) > DRAG_START_PX) draggedBeyondClick = true;
        render(deltaX);
      }
    };

    function computeThresholdPx() {
      if (varOn) return Math.max(40, el.clientWidth * 0.1);
      const slideWidthPx = el.clientWidth / show;
      return Math.max(40, slideWidthPx * 0.2);
    }

    const onPointerUp = (e) => {
      if (!pointerDown) return;
      pointerDown = false;

      if (!dragging) return;

      const threshold = computeThresholdPx();
      if (Math.abs(deltaX) > threshold) {
        if (deltaX < 0) next(); else prev();
      } else {
        applyTransform();
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

    // Touch fallback handlers (referenced for removal in destroy)
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
        touching = true;
        touchDragging = false;
        startX = e.touches[0].clientX;
        deltaX = 0;
        draggedBeyondClick = false;
      };
      onTouchMove = (e) => {
        if (!touching) return;
        const rawDx = e.touches[0].clientX - startX;
        const dx = resistedDelta(rawDx);

        if (!touchDragging && Math.abs(rawDx) > DRAG_START_PX) {
          touchDragging = true;
          track.classList.add('is-dragging');
          track.style.userSelect = 'none';
          track.style.cursor = 'grabbing';
          stopAutoplay();
        }
        if (touchDragging) {
          deltaX = dx;
          if (Math.abs(rawDx) > DRAG_START_PX) draggedBeyondClick = true;
          render(dx);
        }
      };
      onTouchEnd = () => {
        if (!touching) return;
        touching = false;

        if (!touchDragging) return;

        touchDragging = false;
        track.classList.remove('is-dragging');
        track.style.userSelect = '';
        track.style.cursor = '';

        const threshold = computeThresholdPx();
        if (Math.abs(deltaX) > threshold) {
          if (deltaX < 0) next(); else prev();
        } else {
          applyTransform();
        }
        startAutoplay();
        deltaX = 0;
      };
      onTouchCancel = onTouchEnd;

      track.addEventListener("touchstart", onTouchStart, { passive: true });
      track.addEventListener("touchmove", onTouchMove, { passive: true });
      track.addEventListener("touchend", onTouchEnd, { passive: true });
      track.addEventListener("touchcancel", onTouchCancel, { passive: true });
    }

    // ===== Wrap-aware navigation (no clones) =====
    function withoutTransition(fn){
      const prev = track.style.transition;
      track.style.transition = 'none';
      fn();
      track.getBoundingClientRect(); // force reflow
      track.style.transition = prev || '';
    }
    function teleport(afterSetIdx){
      withoutTransition(() => {
        if (typeof afterSetIdx === 'function') afterSetIdx();
        render(0);
      });
    }

    function goTo(targetIdx, stopAuto) {
      const last = lastIndex();
      let newIdx = targetIdx;

      if (options.loop) {
        if (targetIdx > last) newIdx = 0;       // wrap forward
        else if (targetIdx < 0) newIdx = last;  // wrap backward
      }

      idx = Math.max(0, Math.min(newIdx, last));
      applyTransform();
      if (stopAuto) stopAutoplay();
    }

    function next(){ goTo(idx + pageStep()); }
    function prev(){ goTo(idx - pageStep()); }

    // Pause on hover (mouse only)
    el.addEventListener("mouseenter", stopAutoplay);
    el.addEventListener("mouseleave", startAutoplay);

    // Resize (element size)
    const ro = new ResizeObserver(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    ro.observe(el);

    // Init
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

      const pBtn = el.querySelector(".vs-arrow--prev");
      const nBtn = el.querySelector(".vs-arrow--next");
      if (pBtn) pBtn.remove();
      if (nBtn) nBtn.remove();

      removeClones();
      originalSlides.forEach(s => track.appendChild(s));

      const children = Array.from(track.children);
      children.forEach(c => el.appendChild(c));
      track.remove();
      delete el.__vs;
    }
  }

  // Auto-init / responsive enablement
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

  window.VanillaSlider = {
    create: createSlider,
    initAll,
    ensureAll,
    ensure: ensureSlider
  };
})();

/* featured-collections image height sync */
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

    if ('ResizeObserver' in window) {y
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

      if (m.target instanceof Element && m.target.matches?.('[data-slider]')) {
        bindSlider(m.target);
      }
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
