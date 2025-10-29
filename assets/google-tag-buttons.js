document.addEventListener("DOMContentLoaded", function () {
  
  const clickMap = {
    "piercing services": "w_select_home_pierce_info",
    "piercing menu": "w_select_home_pierce_menu",
    "book now": "w_select_home_banner_book",
    "book a piercing (footer)": "w_select_home_footer_book",
    "piercing menu (footer)": "w_select_home_footer_pierce_menu",
  };

  const piercingTags = [
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
      selector: ".piercing-menu-book .btn--last",
      getEvent: (el) => "w_select_pierce_menu_book"
    },
    {
      selector: ".menu-two-for",
      getEvent: (el) => "w_select_pierce_menu_2_80_info"
    },
    {
      selector: ".2-for-80-promo",
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

        // look for the previous <h3> sibling
        let h3Text = "";
        let prev = el.previousElementSibling;
        while (prev) {
          if (prev.tagName === "H3") {
            h3Text = prev.innerText.trim() + " - BOOK NOW";
            break;
          }
          prev = prev.previousElementSibling;
        }

        if (eventName) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: eventName,
            link_text: h3Text || (el.innerText.trim() + " - BOOK NOW")
          });
          console.log("Tag fired:", eventName, "| Text:", h3Text);
        }
      });
    });
  });

  
});