document.addEventListener("DOMContentLoaded", function () {
  
  const clickMap = {
    "piercing services": "w_select_home_pierce_info",
    "piercing menu": "w_select_home_pierce_menu",
    "book now": "w_select_home_banner_book",
    "book a piercing (footer)": "w_select_home_footer_book",
    "piercing menu (footer)": "w_select_home_footer_pierce_menu",
  };

  const piercingTags = [
    "advance_book",
    "doubleops_book",
    "downsize_book",
    "anatomy_book",
    "dahlia_book",
    "nipple_book",
    "oconch_book",
    "vhelix_book",
    "hhelix_book",
    "slobe_book",
    "snipple_book",
    "sseptum_book",
    "hnostril_book",
    "nfree_lobes_book",
    "nfree_doubleopslobe_book",
    "loben_book",
    "lobec_book",
    "helix_book",
    "fhelix_book",
    "rook_book",
    "conch_book",
    "flat_book",
    "tragus_book",
    "antitragus_book",
    "daith_book",
    "snug_book",
    "translobe_book",
    "nostril_book",
    "septum_book",
    "eyebrow_book",
    "bridge_book",
    "lip_book",
    "labret_book",
    "ashley_book",
    "vlabret_book",
    "philtrum_book",
    "jestrum_book",
    "tongue_book",
    "smiley_book",
    "tongueweb_book",
    "navel_book",
    "lnavel_book",
    "fnavel_book",
    "nipplem_book",
    "nipplef_book",
    "industrial_book",
    "lobelg_book",
    "surface_book",
    "dermal_book",
    "cheek_book",
  ];
 
  const rules = [
    {
      selector: ".site-nav__dropdown-link",
      getEvent: (el) => clickMap[el.innerText.trim().toLowerCase()]
    },
    {
      selector: ".page- .inline-buttons__block a",
      getEvent: (el) => clickMap[el.innerText.trim().toLowerCase()]
    },
    {
      selector: ".page- .flip-card-back .btn--white",
      getEvent: () => "w_select_home_tiles_pierce"
    },
    {
      selector: ".footer-submenu a",
      getEvent: (el) => {
        const text = el.innerText.trim().toLowerCase();
        if (text === "book a piercing") return "w_select_home_footer_book";
        if (text === "piercing menu") return "w_select_home_footer_pierce_menu";
      }
    },
    {
      selector: ".book-now-header",
      getEvent: (el) => "w_select_nav_book"
    },
    {
      selector: ".why-book",
      getEvent: (el) => "w_select_pierce_info_why_book"
    },
    {
      selector: ".needle-book",
      getEvent: (el) => "w_select_pierce_info_needle_book"
    },
    {
      selector: ".ear-more",
      getEvent: (el) => "w_select_pierce_info_ear_more"
    },
    {
      selector: ".price-book",
      getEvent: (el) => "w_select_pierce_info_price_book"
    },
    {
      selector: ".faq-book",
      getEvent: (el) => "w_select_pierce_info_faq_book"
    },
    {
      selector: ".two-for-80 .btn--last",
      getEvent: (el) => "w_select_2for80_book"
    },
    {
      selector: ".piercing-menu-book",
      getEvent: (el) => "w_select_pierce_menu_book"
    },
    {
      selector: ".menu-two-for",
      getEvent: (el) => "w_select_pierce_menu_2_80_info"
    },
    {
      selector: ".menu-two-for-id",
      getEvent: (el) => "w_select_pierce_menu_id_info"
    },

  ];

  rules.forEach(({ selector, getEvent }) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener("click", function () {
        const eventName = getEvent(el);
        if (eventName) {
          dataLayer.push({
            event: eventName,
            link_text: el.innerText.trim()
          });
          console.log("Tag fired:", eventName); 
        }
      });
    });
  });

  
  const piercingMenu = piercingTags.map(tag => ({
    selector: `.${tag}`, 
    getEvent: () => `w_select_pierce_menu__${tag}`
  }));

  
  piercingMenu.forEach(({ selector, getEvent }) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener("click", function () {
        const eventName = getEvent(el);
  
        const container = el.closest(".piercing-menu__item") || document;
  
        // Prefer H3 inside item-data, else anywhere in the container; then fall back to H2
        const h3 = container.querySelector(".piercing-menu__item-data h3") || container.querySelector("h3");
        const h2 = h3 ? null : (container.querySelector(".two-column-slider__item h2") || container.querySelector("h2"));
  
        const headingEl = h3 || h2;
  
        const hText = headingEl
          ? `${headingEl.textContent.trim()} - BOOK NOW`
          : `${(el.innerText || el.textContent || "").trim()} - BOOK NOW`;
  
        if (eventName) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: eventName,
            link_text: hText
          });
          console.log("Tag fired:", eventName, "| Text:", hText);
        }
      });
    });
  });

  
});