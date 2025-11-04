document.addEventListener('DOMContentLoaded', function() {
    const overlay    = document.querySelector('.header-overlay');
    const menus      = [...document.querySelectorAll('.js-submenu')];
    const containers = [...document.querySelectorAll('.header_sub-menu')];
    const mains      = [...document.querySelectorAll('.header_sub-menu__main')];
    const hamburger    = document.querySelector('.hamburger');
    const hamburgerClose = document.querySelector('.close-sub');

    // NEW: child/grandchild groups
    const children      = [...document.querySelectorAll('.child[data-group]')];
    const grandchildren = [...document.querySelectorAll('.grandchild[data-group]')];
    const grandchildrenchild = [...document.querySelectorAll('.grandchild_item[data-group]')];

    // Helper to read group key (prefer data-group, then id)
    const getKey = el => el?.getAttribute?.('data-group') || el?.id || '';

    // Lookups by group
    const containerByGroup = new Map(containers.map(c => [getKey(c), c]).filter(([k]) => k));
    const mainByGroup      = new Map(mains.map(m => [getKey(m), m]).filter(([k]) => k));

    // NEW: there may be multiple grandchildren per group, so store arrays
    const grandchildrenByGroup = (() => {
        const map = new Map();
        for (const gc of grandchildren) {
            const k = getKey(gc);
            if (!k) continue;
            if (!map.has(k)) map.set(k, []);
            map.get(k).push(gc);
        }
        return map;
    })();

    function clearAll() {
        menus.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
        });
        containers.forEach(c => c.classList.remove('active'));
        mains.forEach(m => m.classList.remove('active'));

        // NEW: clear child + grandchild actives too
        children.forEach(ch => {
            ch.classList.remove('active');
            ch.setAttribute('aria-expanded', 'false');
        });
        grandchildren.forEach(gc => gc.classList.remove('active'));
    }

    function activateGroup(key) {
        if (!key) return;

        // Reset top-level first
        menus.forEach(btn => {
            const isMatch = getKey(btn) === key;
            btn.classList.toggle('active', isMatch);
            btn.setAttribute('aria-expanded', String(isMatch));
        });

        // Containers/mains
        containers.forEach(c => c.classList.remove('active'));
        mains.forEach(m => m.classList.remove('active'));

        let container = containerByGroup.get(key) || (containers.length === 1 ? containers[0] : null);
        let main      = mainByGroup.get(key)      || (mains.length === 1 ? mains[0] : null);
        if (container && !main) main = container.querySelector('.header_sub-menu__main');

        container?.classList.add('active');
        main?.classList.add('active');
        container?.setAttribute('tabindex', '0');
        overlay?.classList.add('active');
    }

    // NEW: child -> grandchild activation (same data-group)
    function activateChildGroup(key, clickedChild) {
        if (!key) return;

        // Toggle children ARIA/active
        children.forEach(ch => {
            const isMatch = ch === clickedChild;
            ch.classList.toggle('active', isMatch);
            ch.setAttribute('aria-expanded', String(isMatch));
        });

        // Only matching grandchildren get active
        grandchildren.forEach(gc => gc.classList.remove('active'));
        const matches = grandchildrenByGroup.get(key);
        if (matches) matches.forEach(el => el.classList.add('active'));

        // You can choose whether the overlay should appear for child clicks:
        // If you want the overlay for child interactions too, leave this on:
        overlay?.classList.add('active');
    }

    // Click handlers (top-level menus)
    menus.forEach(menu => {
        menu.addEventListener('click', e => {
            e.preventDefault();
            activateGroup(getKey(menu));
        });
    });

    // NEW: Click handlers (children -> grandchildren)
    children.forEach(child => {
        child.addEventListener('click', e => {
            activateChildGroup(getKey(child), child);
        });
    });

    // Close on overlay click
    overlay?.addEventListener('click', () => {
        overlay.classList.remove('active');
        clearAll();
    });

    hamburger.addEventListener('click', e => {
        document.querySelector('.header_sub-menu').classList.add('active');
        overlay.classList.add('active');
    });

    hamburgerClose.addEventListener('click', e => {
        e.preventDefault();
        document.querySelector('.header_sub-menu').classList.remove('active');
        overlay.classList.remove('active');
    });

    // --- NEW: level-3 clickers (.grandchild_item.placement) and level-4 targets (.grandchild_child)
    const gcPlacements = [...document.querySelectorAll('.grandchild_item.placement[data-group]')];
    const gcTargets    = [...document.querySelectorAll('.grandchild_child[data-group]')];

    // Map level-4 targets by group
    const gcTargetsByGroup = (() => {
    const map = new Map();
    for (const el of gcTargets) {
        const k = getKey(el);
        if (!k) continue;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(el);
    }
    return map;
    })();

    // --- NEW: when switching child/grandchild or clearing, also reset these
    const _origClearAll = clearAll;
    clearAll = function () {
    _origClearAll();
    gcPlacements.forEach(el => el.classList.remove('active'));
    gcTargets.forEach(el => el.classList.remove('active'));
    };

    // Also reset deeper level when a child group is activated
    const _origActivateChildGroup = activateChildGroup;
    activateChildGroup = function (key, clickedChild) {
    _origActivateChildGroup(key, clickedChild);
    gcPlacements.forEach(el => el.classList.remove('active'));
    gcTargets.forEach(el => el.classList.remove('active'));
    };

    // --- NEW: handler for clicking a .grandchild_item.placement
    function activateGrandchildItem(key, clicked) {
    if (!key) return;

    // Only the clicked placement is active
    gcPlacements.forEach(el => el.classList.toggle('active', el === clicked));

    // Show only matching .grandchild_child panels
    gcTargets.forEach(el => el.classList.remove('active'));
    const matches = gcTargetsByGroup.get(key);
    if (matches) matches.forEach(el => el.classList.add('active'));

    overlay?.classList.add('active');
    }

    // Bind clicks
    gcPlacements.forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        // Optional: e.stopPropagation(); // if upper levels also listen to clicks
        activateGrandchildItem(getKey(item), item);
    });
    });

    //Country Dropdown

    document.querySelectorAll('.dropdown-item').forEach((root) => {
        if (root) {
            root.addEventListener('click', function (e) {
                this.classList.toggle('active');
            });
        }
    });
    
    

    document.querySelectorAll('.kandyclub-form__content').forEach((root) => {
        const bulletsWrap = root.querySelector('.kandyclub-form__bullet');
        if (!bulletsWrap) return;

        bulletsWrap.addEventListener('click', (e) => {
            const bullet = e.target.closest('.content-bullet');
            if (!bullet || !bulletsWrap.contains(bullet)) return;


            const targetClass = [...bullet.classList].find(c => /^content-\d+$/.test(c));
            if (!targetClass) return;

            const bullets = bulletsWrap.querySelectorAll('.content-bullet');
            const items = root.querySelectorAll('.content-item');


            bullets.forEach(b => b.classList.remove('active'));
            items.forEach(i => i.classList.remove('active'));

            bullet.classList.add('active');
            const item = root.querySelector(`.content-item.${targetClass}`);
            if (item) item.classList.add('active');
        });
    });

    initClassSwitcher({
        sectionSelector: ".featured-collections",
        buttonSelector: ".featured-collections__btn",
        itemSelector: ".featured-collections__item"
    });

    initClassSwitcher({
        sectionSelector: ".piercing-menu__wrapper",
        buttonSelector: ".piercing-menu__nav-item",
        itemSelector: ".piercing-menu__items"
    });

    initClassSwitcher({
        sectionSelector: ".accordion-metaobject__wrapper",
        buttonSelector: ".accordion-button",
        itemSelector: ".accordion-metaobject__item"
    });

    document.querySelectorAll('.accordion-metaobject__content').forEach((root) => {
        root.tabIndex = 0; // make focusable
        const toggle = () => root.classList.toggle('active');
        
        root.addEventListener('click', toggle);
        root.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
            }
        });
    });

    setupCollapsible({
        container: '.list-content',    
        itemSelector: '.list-content__item', 
        panelSelector: '.content',         
        exclusive: false,
        toggle: true,
        onlyOnMobile: true,                
        mobileMaxWidth: 767
    });



    document.addEventListener('click', (e) => {
        // If a click happened on a link inside an item, let it behave normally.
        const link = e.target.closest('a');
        if (link && link.closest('.piercing-menu__item')) return;
        
        const item = e.target.closest('.piercing-menu__item');
        if (!item) return;
    
    });





    /* Custom Functions */


    /**
     * Generic content switcher using a class prefix (e.g., "content-1")
     * Works with multiple sections on the page.
     *
     * @param {Object} opts
     * @param {string} opts.sectionSelector - container(s) to bind (e.g., ".featured-collections")
     * @param {string} opts.buttonSelector  - buttons inside each section (e.g., ".featured-collections__btn")
     * @param {string} opts.itemSelector    - items to toggle inside each section (e.g., ".featured-collections__item")
     * @param {string} [opts.activeClass="active"] - class to mark active btn/item
     * @param {string} [opts.contentPrefix="content-"] - prefix to detect on buttons
     * @param {"first"|"all"} [opts.match="first"] - activate first or all matching items
     */
    function initClassSwitcher({
        sectionSelector,
        buttonSelector,
        itemSelector,
        activeClass = "active",
        contentPrefix = "content-",
        match = "first",
    }) {
        const esc = (v) => (window.CSS && CSS.escape ? CSS.escape(v) : v.replace(/([^\w-])/g, "\\$1"));
    
        document.querySelectorAll(sectionSelector).forEach((section) => {
        const buttons = Array.from(section.querySelectorAll(buttonSelector));
        const items   = Array.from(section.querySelectorAll(itemSelector));
    
        if (!buttons.length || !items.length) return;
    
        const deactivate = () => {
            buttons.forEach((b) => b.classList.remove(activeClass));
            items.forEach((i) => i.classList.remove(activeClass));
        };
    
        const activateFor = (btn) => {
            const targetClass = Array.from(btn.classList).find((c) => c.startsWith(contentPrefix));
            if (!targetClass) return;
    
            deactivate();
            btn.classList.add(activeClass);
    
            if (match === "all") {
            section
                .querySelectorAll(`${itemSelector}.${esc(targetClass)}`)
                .forEach((el) => el.classList.add(activeClass));
            } else {
            const el = section.querySelector(`${itemSelector}.${esc(targetClass)}`);
            if (el) el.classList.add(activeClass);
            }
        };
    
        // Event delegation (fast + resilient to dynamic content)
        section.addEventListener("click", (e) => {
            const btn = e.target.closest(buttonSelector);
            if (!btn || !section.contains(btn)) return;
            e.preventDefault();
            activateFor(btn);
        });
    
        // Basic keyboard support
        section.addEventListener("keydown", (e) => {
            if ((e.key === "Enter" || e.key === " ") && e.target.matches(buttonSelector)) {
            e.preventDefault();
            activateFor(e.target);
            }
        });
    
        // Initial state: prefer a pre-marked active button; otherwise first button with a target
        const initialBtn =
            buttons.find((b) => b.classList.contains(activeClass)) ||
            buttons.find((b) => Array.from(b.classList).some((c) => c.startsWith(contentPrefix)));
    
        if (initialBtn) activateFor(initialBtn);
        });
    }

    document.querySelectorAll('.open-popup').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const item  = e.currentTarget.closest('.accordion-metaobject__content');
            const popup = item?.querySelector('.accordion-popup__popup');
        
            if (popup) popup.classList.add('active');
        });
    });

    document.querySelectorAll('.apply-job').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    document.querySelectorAll('.close-popup').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
    
          const popup = btn.closest('.accordion-popup__popup');
      
          if (popup) {
            popup.classList.remove('active');
          }
        });
      });

    document.querySelectorAll('.apply-job-popup').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const popup = btn.closest('.accordion-popup__popup');
      
          if (popup) {
            popup.classList.remove('active');
          }
        });
    });

    
    /**
     * Setup a reusable collapsible list.
     * It auto-adds standard classes so CSS is generic.
     */
    function setupCollapsible({
        container,                     // selector or element (required)
        itemSelector,                  // clickable item (required)
        panelSelector,                 // the content inside item (required)
        baseClass = 'is-collapsible',  // base class the CSS uses
        activeClass = 'is-active',     // active state class used by CSS
        exclusive = false,             // only one open at a time
        toggle = true,                 // clicking active closes it
        onlyOnMobile = false,          // limit to mobile only
        mobileMaxWidth = 767           // mobile breakpoint
    } = {}) {
        const root = typeof container === 'string' ? document.querySelector(container) : container;
        if (!root) return;
    
        // add base class to container
        root.classList.add(baseClass);
    
        // add standard item/panel classes to matched nodes (one-time)
        root.querySelectorAll(itemSelector).forEach(item => {
        item.classList.add(`${baseClass}__item`);
        const panel = item.querySelector(panelSelector);
        if (panel) panel.classList.add(`${baseClass}__panel`);
        });
    
        // event delegation
        root.addEventListener('click', (e) => {
        if (onlyOnMobile && window.innerWidth > mobileMaxWidth) return;
    
        const item = e.target.closest(itemSelector);
        if (!item || !root.contains(item)) return;
    
        const panel = item.querySelector(panelSelector);
        const isActive = item.classList.contains(activeClass);
    
        if (exclusive) {
            root.querySelectorAll(`.${baseClass}__item.${activeClass}`).forEach(openItem => {
            openItem.classList.remove(activeClass);
            openItem.querySelector(`.${baseClass}__panel`)?.classList.remove(activeClass);
            });
        }
    
        if (toggle && isActive) {
            item.classList.remove(activeClass);
            panel?.classList.remove(activeClass);
        } else {
            item.classList.add(activeClass);
            panel?.classList.add(activeClass);
        }
        });
    }
    

    (function stopParentHandlers(){
        document.addEventListener('click', (e) => {
          if (e.target.closest('.no-propagate')) {
            e.stopImmediatePropagation();
            e.stopPropagation();
          }
        }, true);
    })();


    // SLIDER: custom arrows anywhere + no visible duplicates (keeps internals hidden)
    (function () {
        // Mark your custom arrows with these:
        const CUSTOM_PREV = '[data-slider-prev]';
        const CUSTOM_NEXT = '[data-slider-next]';
    
        // The moving element (track). Adjust if needed or add data-slider-track in your HTML.
        const TRACK_SELECTOR = '[data-slider-track], .vs-track';
    
        // The slider's own arrows (when data-arrows="true")
        const INTERNAL_PREV = '.vs-arrow--prev';
        const INTERNAL_NEXT = '.vs-arrow--next';
    
        // Optional wrapper hint to scope a slider and its arrows
        const ROOT_HINT = '[data-slider-root]';
    
        // Hide internal arrows (not remove) to avoid duplicates but keep functionality
        const HIDDEN_CLASS = 'slider-internal-hidden';
        if (!document.getElementById('slider-internal-hidden-style')) {
        const s = document.createElement('style');
        s.id = 'slider-internal-hidden-style';
        s.textContent = `.${HIDDEN_CLASS}{display:none!important}`;
        document.head.appendChild(s);
        }
    
        const $ = (root, sel) => root.querySelector(sel);
        const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));
    
        function findTrack(root) {
        return $(root, TRACK_SELECTOR);
        }
    
        // Find a wrapper that contains both the clicked arrow and a track.
        // Prefer [data-slider-root]; otherwise walk up until we find a track.
        function findRoot(arrow) {
        const hinted = arrow.closest(ROOT_HINT);
        if (hinted && findTrack(hinted)) return hinted;
    
        let n = arrow;
        while (n && n !== document.documentElement) {
            if (findTrack(n)) return n;
            n = n.parentElement;
        }
        return null;
        }
    
        // If custom arrows exist in this wrapper, hide the internal ones to avoid duplicates.
        function reconcile(root) {
        const track = findTrack(root);
        if (!track) return;
        const hasCustom = $(root, `${CUSTOM_PREV}, ${CUSTOM_NEXT}`);
        if (!hasCustom) return;
        $$(root, `${INTERNAL_PREV}, ${INTERNAL_NEXT}`).forEach(b => b.classList.add(HIDDEN_CLASS));
        }
    
        // Move the slider: prefer the slider's own buttons; else a custom event; else scroll fallback.
        function step(root, track, dir) {
        // 1) Click internal arrow if present (even if hidden)
        const internal =
            $(root, dir < 0 ? INTERNAL_PREV : INTERNAL_NEXT) ||
            $((track.parentElement || root), dir < 0 ? INTERNAL_PREV : INTERNAL_NEXT);
    
        if (internal) {
            internal.click();
            return;
        }
    
        // 2) Custom hook (for in-house sliders)
        const ev = new CustomEvent('vs:step', { bubbles: true, cancelable: true, detail: { dir } });
        const canceled = !track.dispatchEvent(ev); // false if preventDefault was called
        if (canceled) return;
    
        // 3) Generic scroll by one slide width
        const slide = track.querySelector('.vs-slide, [data-slider-slide]') || track.firstElementChild;
        const w = slide ? (slide.getBoundingClientRect().width || slide.offsetWidth || track.clientWidth) : track.clientWidth;
        if (typeof track.scrollBy === 'function') {
            track.scrollBy({ left: dir < 0 ? -w : w, behavior: 'smooth' });
        }
        }
    
        // Delegate clicks for custom arrows anywhere in the document
        document.addEventListener('click', (e) => {
        const prev = e.target.closest(CUSTOM_PREV);
        const next = !prev && e.target.closest(CUSTOM_NEXT);
        if (!prev && !next) return;
    
        const root = findRoot(prev || next);
        const track = root && findTrack(root);
        if (!root || !track) return;
    
        e.preventDefault();
        step(root, track, prev ? -1 : 1);
        }, true);
    
        // Initial pass: for each custom arrow found, reconcile its wrapper
        function scan() {
        document.querySelectorAll(`${CUSTOM_PREV}, ${CUSTOM_NEXT}`).forEach(arrow => {
            const root = findRoot(arrow);
            if (root) reconcile(root);
        });
        }
        scan();
    
        // Watch for the slider injecting its own arrows (e.g., data-arrows="true")
        const mo = new MutationObserver(scan);
        mo.observe(document.documentElement, { childList: true, subtree: true });
    })();
  
});