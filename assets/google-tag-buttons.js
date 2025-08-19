document.addEventListener("DOMContentLoaded", function () {
  
  const bookButtons = document.querySelectorAll(".w_select_nav_book");
  const navLinks = document.querySelectorAll(".site-nav__dropdown-link");

  bookButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      
      dataLayer.push({
        event: "w_select_nav_book_click",
        button_text: btn.innerText.trim()
      });
    });
  });

  const navMap = {
    "piercing services": "w_select_home_pierce_info",
    "piercing menu": "w_select_home_pierce_menu"
  };

  document.querySelectorAll(".site-nav__dropdown-link").forEach(function (link) {
    link.addEventListener("click", function () {
      const linkText = link.innerText.trim().toLowerCase();

      if (navMap[linkText]) {
        dataLayer.push({
          event: navMap[linkText],
          link_text: link.innerText.trim()
        });
      }
    });
  });

  const bannerLinks = document.querySelectorAll(".page- .inline-buttons__block a");

  bannerLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      
      const linkText = link.innerText.trim().toLowerCase();

      if (linkText === "book now") {
        dataLayer.push({
          event: "w_select_home_banner_book",
          link_text: link.innerText.trim()
        });
      }
    });
  });

  const tileButtons = document.querySelectorAll(".page- .flip-card-back .btn--white");

  tileButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      dataLayer.push({
        event: "w_select_home_tiles_pierce",
        button_text: btn.innerText.trim()
      });
    });
  });

});