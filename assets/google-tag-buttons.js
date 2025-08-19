document.addEventListener("DOMContentLoaded", function () {
  
  const clickMap = {
    "piercing services": "w_select_home_pierce_info",
    "piercing menu": "w_select_home_pierce_menu",
    "book now": "w_select_home_banner_book",
    "book a piercing": "w_select_home_footer_book",
    "piercing menu (footer)": "w_select_home_footer_pierce_menu",
    "book a piercing (nav)": "w_select_nav_book"
  };

 
  const rules = [
    {
      selector: ".header-icons .book-now-btn",
      getEvent: (el) => clickMap[el.innerText.trim().toLowerCase()]
    },
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
    }
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
});