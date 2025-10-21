document.addEventListener('DOMContentLoaded', function() {

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
});