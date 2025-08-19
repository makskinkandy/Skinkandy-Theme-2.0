document.addEventListener("DOMContentLoaded", function () {
  // Target all buttons with class .w_select_nav_book
  const bookButtons = document.querySelectorAll(".w_select_nav_book");

  bookButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      
      dataLayer.push({
        event: "w_select_nav_book_click",
        button_text: btn.innerText.trim()
      });
    });
  });
});