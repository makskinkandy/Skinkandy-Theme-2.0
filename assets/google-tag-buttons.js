document.addEventListener("DOMContentLoaded", function () {
  
  const clickMap = {
    "piercing services": "w_select_home_pierce_info",
    "piercing menu": "w_select_home_pierce_menu",
    "book now": "w_select_home_banner_book",
    "book a piercing (footer)": "w_select_home_footer_book",
    "piercing menu (footer)": "w_select_home_footer_pierce_menu",
  };
 
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
        if (eventName) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: eventName,
            link_text: el.innerText.trim()
          });
          console.log("Tag fired:", eventName, "| Text:", el.innerText.trim());
        }
      });
    });
  });

  
});