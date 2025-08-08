const btnPopup = document.getElementById('btn-popup');
const POPUP = document.querySelector(".form-popup");
const templateName = "No metafield value";

function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, options = {}) {
    options = {
        path: '/',
        ...options
    };

    if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
    }

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
        updatedCookie += "; " + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }
    }

    document.cookie = updatedCookie;
}


document.addEventListener('DOMContentLoaded', (event) => {
    let timeDelay = 2;
    
    if (5) {
        timeDelay = 5;
    }

    const totalDelay = timeDelay * 1000;

    if (!getCookie('popupClosed')) {
        setTimeout(() => {
            POPUP.classList.remove("hidden");
            document.body.classList.add('no-scroll');
        }, totalDelay);
    }

    console.log("Current template name: ", templateName);

    document.querySelector(".popup-close").addEventListener("click", (e) => {
        e.preventDefault();
        POPUP.classList.add("hidden");
        setCookie('popupClosed', 'true', { 'max-age': 3600 * 24 * 30 });
        document.body.classList.remove('no-scroll');
    });

  let today = new Date();
  today.setDate(today.getDate() - 1);
  let day = String(today.getDate()).padStart(2, '0');
  let month = String(today.getMonth() + 1).padStart(2, '0');
  let year = today.getFullYear();
  let yesterday = year + "-" + month + "-" + day;
  document.getElementById("dob").setAttribute('max', yesterday);
  
  if (window.location.href.indexOf('en-nz') !== -1) {
    var hiddenField = document.getElementById('country');
    hiddenField.value = 'New Zealand';
  }

  if (window.location.href.indexOf('en-us') !== -1) {
    var hiddenField = document.getElementById('country');
    hiddenField.value = 'United States';
  }

  const popupButtons = document.querySelectorAll(".js-btn-popup");

  popupButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      console.log("TEST");
      e.preventDefault();
      POPUP.classList.remove("hidden");
      document.body.classList.add("no-scroll");
    });
  });

  console.log("Form Loaded");
  
});

const dobInput = document.getElementById('dob');

btnPopup.addEventListener("click", (e) => {
  e.preventDefault();
  POPUP.classList.remove("hidden");
  document.body.classList.add('no-scroll');
});

document.getElementById('discountForm').addEventListener('submit', function(event) {
  event.preventDefault();

  grecaptcha.ready(function() {
    grecaptcha.execute('6LdPjysqAAAAAOesGMLIqt41z0ESfcWm64yv058y', {action: 'submit'}).then(function(token) {
      document.getElementById('recaptcha_token').value = token;
      onSubmit(token);
    });
  });
});


function onSubmit(token) {
  const form = document.getElementById('discountForm');
  const formData = new FormData(form);
  const responseDiv = document.getElementById('response');
  const loader = document.querySelector(".form-loader");
  const popupTitle = document.getElementById("popup-title");
  const subTitle = document.getElementById("subtitle");
  const embedForm = document.getElementById('embedded-form');
  const bottomButton = document.querySelector(".bottom__btn");
  const tcLink = document.querySelector(".tc_link");
  
  loader.classList.remove("hidden");

  fetch(form.action, {
    method: 'POST',
    body: formData
  })
    .then(async response => {
      loader.classList.add("hidden");
      
      try {
        const result = await response.json();
        if (result.type == "success") {
          responseDiv.textContent = `${result.discount_code}`;
          embedForm.classList.add("hidden");
          responseDiv.classList.add("success");
          responseDiv.classList.add("copy-link");
          popupTitle.textContent = "You\’re in—Welcome to KandyClub!";
          subTitle.textContent = "";
          subTitle.classList.add("success");
          subTitle.innerHTML = "<p>It’s valid for 24 hours, so treat yourself while it lasts. You’ll also get access to exclusive promotions, birthday & anniversary perks, and more. <br/><br/>Your 10% off code is:</p>";
          setCookie('popupClosed', 'true', { 'max-age': 3600 * 24 * 30 });
          loader.classList.add("hidden");
          bottomButton.classList.remove("hidden");
          
            
          
          
          popupTitle.classList.add("success");
          
          const div = document.querySelector(".copy-link");
          
          div.addEventListener('click', () => {
              const text = div.innerText;
              navigator.clipboard.writeText(text).then(() => {
                  alert('Voucher code copied to clipboard!');
              }).catch(err => {
                  console.error('Failed to copy text: ', err);
              });
          });
        } else {
          responseDiv.textContent = `${result.message}`;
          responseDiv.classList.add("error");
          loader.classList.add("hidden");
        }
      } catch (error) {
        responseDiv.textContent = `Unexpected response format: ${error.message}`;
        responseDiv.classList.add("error");
      }
    })
    .catch(error => {
      responseDiv.textContent = `${error.message}`;
      responseDiv.classList.add("error");
      loader.classList.add("hidden");
    });
}

function isPastDate(inputDate) {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset hours to ignore time

    // Convert input string to date (assuming dd/mm/yyyy format)
    const [day, month, year] = inputDate.split('/');
    const enteredDate = new Date(year, month - 1, day); // month is 0-indexed
    enteredDate.setHours(0, 0, 0, 0); // Reset hours to ignore time

    // Check if the entered date is before today
    return enteredDate.getTime() < today.getTime();
}
  
function validateDate() {
  const value = dobInput.value.trim();
  if (!isPastDate(value)) {
    dobInput.setCustomValidity('Enter a valid date in the format dd/mm/yyyy, from yesterday or later.');
  } else {
    dobInput.setCustomValidity(''); // Clear custom validity message
  }
}

dobInput.addEventListener('input', validateDate);