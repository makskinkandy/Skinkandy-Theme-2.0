import PhotoSwipeLightbox from 'https://unpkg.com/photoswipe/dist/photoswipe-lightbox.esm.js';

// Add plugins for DayJs
dayjs.extend(window.dayjs_plugin_isBetween)
dayjs.extend(window.dayjs_plugin_utc)
dayjs.extend(window.dayjs_plugin_timezone)
dayjs.extend(window.dayjs_plugin_duration)
dayjs.tz.guess()


// Helper functions
const timeout = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Theme Helpers
theme.Helpers = {
    addItemToCartFromID: function (id, properties) {
        let item_data = [];

        item_data.push({quantity: 1, id: id, properties: properties});

        $.post('/cart/add.js', {
              items: item_data,
          })
          .always(function () {
              document.dispatchEvent(new CustomEvent('cart:build'));
          });
    }
}

document.addEventListener('DOMContentLoaded', e => {

    // Accordion
    const accordions = document.querySelectorAll('.js-accordion');
    const toggleAccordion = e => {
        const self = e.target
        const content = self.nextElementSibling;
        self.classList.toggle('active');
        content.style.maxHeight ?
            content.style.maxHeight = null :
            content.style.maxHeight = `${content.scrollHeight + 100}px`;
    }

    accordions.forEach(accordion => {
        accordion.addEventListener('click', toggleAccordion, false);
    });


    // Read more
    const showDescriptions = e => {
        const self = e.target;
        const parent = self.parentElement;
        const dots = parent.querySelector('.dots');
        const more = parent.querySelector('.more');

        if (!parent || !dots || !more) return;

        self.classList.toggle('active');
        if (dots.classList.contains('hide')) {
            dots.classList.remove('hide');
            more.classList.add('hide');
            self.textContent = 'Read more';
        } else {
            dots.classList.add('hide');
            more.classList.remove('hide');
            self.textContent = 'Read less';
        }
    }
    const rmTriggers = document.querySelectorAll('.js-read-more');
    rmTriggers.forEach(trigger => {
        trigger.addEventListener('click', showDescriptions, false);
    })


    // View more func for Reviews section
    const showReviews = e => {
        const self = e.target;
        const reviews = document.querySelectorAll('.reviews-section .review');
        for (let review of reviews) {
            if (review.classList.contains('hide'))
                review.classList.remove('hide')
        }

        self.classList.add('hide');
    }
    const vmTriggers = document.querySelectorAll('.js-view-more');
    vmTriggers.forEach(trigger => {
        trigger.addEventListener('click', showReviews, false)
    });


    // Header search bar increase width on focus
    const headerSearchBar = document.querySelector('.header-item .search-bar input[type="search"]');
    if (headerSearchBar) {
        headerSearchBar.addEventListener('focus', e => {
            const self = e.target;
            const parent = self.closest('form');
            if (parent) parent.classList.add('is-selected');
        });

        headerSearchBar.addEventListener('blur', e => {
            const self = e.target;
            const parent = self.closest('form');    
            if (parent) parent.classList.remove('is-selected');
        });
    }


    // Sticky footer
    const stickyFooter = document.querySelector('.js-sticky');
    if (stickyFooter) {
        let parent = stickyFooter.parentElement;
        parent.classList.add('is-sticky');
    }


    // Fix on flickity autoplay still working even with watchCSS
    const scrollElems = document.querySelectorAll('.grid-scroll');
    const handleFlickity = elem => {
        let flkty = Flickity.data(elem);
        if (flkty && elem.dataset.disableAutoplay)
            flkty.stopPlayer();
    }
    let mediaQuery = window.matchMedia("(min-width: 60rem)");
    if (mediaQuery.matches) {
        scrollElems.forEach(handleFlickity)
    }


    // Countdown timer sections
    const countdownHandler = elem => {
        const parent = elem.closest('.countdown-timer-section');
        const action = elem.dataset.action;
        const datetime = elem.dataset.datetime;
        const regexString = `^[12][0-9]{3}-(0?[1-9]|[1][0-2])-(0?[1-9]|[12][0-9]|3[01]){1} (0?[0-9]|1[0-9]|2[0-3]):([0-5]\\d)$`;
        const regex = new RegExp(regexString);

        if (!datetime || !regex.test(datetime)) {
            console.log('Please enter correct time format');
            return;
        }

        let days = elem.querySelector('.days'),
            hours = elem.querySelector('.hours'),
            mins = elem.querySelector('.mins'),
            secs = elem.querySelector('.secs'),
            end = dayjs(datetime);

        if (!days || !hours || !mins || !secs) return;

        let startTimer = setInterval(function () {
            let now = dayjs(),
                diff = end.diff(now),
                duration = dayjs.duration(diff);

            let d = Math.trunc(duration.asDays()),
                h = duration.get('hours'),
                m = duration.get('minutes'),
                s = duration.get('seconds');

            if (diff > 0) {
                days.innerHTML = `${d < 10 ? `0${d}` : d}`;
                hours.innerHTML = `${h < 10 ? `0${h}` : h}`;
                mins.innerHTML = `${m < 10 ? `0${m}` : m}`;
                secs.innerHTML = `${s < 10 ? `0${s}` : s}`;
            } else {
                parent.classList.add('countdown-complete');

                switch (action) {
                    case 'hide': {
                        parent.classList.add('hide');
                        console.log('Countdown section hidden');
                        break;
                    }
                    case 'message': {
                        let text = parent.querySelector('.text');
                        let message = parent.querySelector('.message');

                        if (message) message.classList.remove('hide');
                        if (text) text.classList.add('hide');
                        elem.classList.add('hide');

                        console.log('Display message');
                        break;
                    }
                }

                clearInterval(startTimer);
                document.dispatchEvent(new CustomEvent('countdown:complete'));
            }
        }, 1000);
        startTimer;
    }
    const countdownSections = document.querySelectorAll('.js-countdown-timer-elem');
    countdownSections.forEach(countdownHandler);


    // Close button for sticky countdown timer
    const hideStickyCntdwn = e => {
        const self = e.target;
        const parent = self.closest('.countdown-timer-section');
        if (parent) parent.classList.add('hide');
    }
    const cntdwnStickyBtns = document.querySelectorAll('.js-close-sticky');
    cntdwnStickyBtns.forEach(btn => {
        btn.addEventListener('click', hideStickyCntdwn, false);
    });


    // Tabs for Gallery page
    const tabBtns = document.querySelectorAll('.js-open-tab');
    const openTab = e => {
        const self = e.target;
        const parent = self.closest('.tabs-wrapper');
        const target = document.getElementById(self.dataset.target);

        const triggers = parent.querySelectorAll('.js-open-tab');
        const tabcontents = parent.querySelectorAll('.tabcontent');

        triggers.forEach(t => t.classList.remove('active'));
        tabcontents.forEach(c => c.classList.add('hide'));

        self.classList.add('active');
        target.classList.remove('hide');
    }

    
    const changeImage = e => {
        const self = e.target;
        const parent = self.closest('.image-marker');
        const target = parent.querySelector(`.image[data-index="${self.dataset.index}"]`);

        const triggers = parent.querySelectorAll('.js-change-image');
        const images = parent.querySelectorAll('.image');

        if (target) {
            triggers.forEach(t => t.classList.remove('active'));
            images.forEach(i => i.classList.add('hide'));

            self.classList.add('active');
            target.classList.remove('hide');
        }
    }
    
    document.addEventListener('galleryData:loaded', e => {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', openTab, false);
            if (btn.classList.contains('js-default-tab')) btn.click();
        });

        const changeImageBtns = document.querySelectorAll('.js-change-image');

        changeImageBtns.forEach(btn => {
            btn.addEventListener('click', changeImage, false);
            if (btn.classList.contains('js-default-open')) btn.click();
        });
    })

    // Order tracking form

    if (document.getElementById('order-tracking-form')) {
        document.getElementById('order-tracking-form').addEventListener('submit', function(event){
            event.preventDefault();
            let trackingCode = '' + document.getElementById('tracking-number').value, trackingCodePrefix;
            trackingCodePrefix = trackingCode.substring(0, 2).toLowerCase();
            if (trackingCodePrefix === 'ms' || trackingCodePrefix === 'mp') {
                window.open('https://www.aramex.com.au/tools/track?l=' + trackingCode);
            } else {
                window.open('https://auspost.com.au/mypost/track/#/details/' + trackingCode);
            }
        });
    }


  // Size guide photoswipe
  const sizeGuideBtn = document.querySelector('#photoswipe-size-guide');
  const lightbox = new PhotoSwipeLightbox({
    mainClass: 'pswp--size-guide',
    gallery: '#photoswipe-size-guide',
    children: 'a',
    initialZoomLevel: 'fit',
    secondaryZoomLevel: 1.5,
    maxZoomLevel: 2,
    arrowPrev: false,
    arrowNext: false,
    zoom: false,
    preloader: false,
    counter: false,
    pswpModule: () => import('https://unpkg.com/photoswipe')
  });
  if (sizeGuideBtn) lightbox.init();

  // Back in stock button
  const bisButton = document.getElementById('BIS_trigger_clone');
  if(bisButton) {
      bisButton.addEventListener('click', function() {
        document.getElementById('BIS_trigger').click();
      });  
  }
  
  jQuery('.collapsible-content__inner .btn').click( function () {
    jQuery(this).parents('.collapsible-content').removeClass('is-open');
    jQuery('.mobile-nav__link--button').attr("aria-expanded","false").removeClass('is-open');
  });

  jQuery('li.dropdown').click( function () {
    jQuery(this).toggleClass('active');
  });


  // Mobile Navigation SubMenu open | Homepage 2.0
  const menuItems = document.querySelectorAll('.mobile-nav__has-sublist');

  menuItems.forEach(function(item) {
    item.addEventListener('click', function(event) {
      this.querySelector('.mobile-nav__toggle').classList.toggle('open');
      this.nextElementSibling.classList.toggle('open');
      event.stopPropagation();
    });
  });

  document.querySelectorAll('.level-2-menu').forEach(menu => {
    menu.addEventListener('click', function () {
        let sibling = this.nextElementSibling;
        if (sibling && sibling.classList.contains('level-2-sub')) {
            sibling.classList.toggle('open');
        }

        this.classList.toggle('active');
    });
  });

  const call_change_country_ = (countryCode) => {
    console.log(":TEST")
    const urls = {
      'NZ': 'https://skinkandy.com/en-nz',
      'AU': 'https://skinkandy.com/'
    };
  
    const targetUrl = urls[countryCode];
  
    targetUrl ? window.location.href = targetUrl : console.error(`Invalid country code: ${countryCode}`);
  };

  document.querySelectorAll('.pfa-arrow-up').forEach(el => {
    el.setAttribute('aria-hidden', 'true');
  });

  document.querySelectorAll('i').forEach(i => {
    const em = document.createElement('em');
    em.innerHTML = i.innerHTML;
    // Copy attributes if needed (optional)
    Array.from(i.attributes).forEach(attr => {
      em.setAttribute(attr.name, attr.value);
    });
    i.replaceWith(em);
  });

  document.querySelectorAll('b').forEach(i => {
    const b = document.createElement('strong');
    b.innerHTML = i.innerHTML;
    // Copy attributes if needed (optional)
    Array.from(i.attributes).forEach(attr => {
      b.setAttribute(attr.name, attr.value);
    });
    i.replaceWith(b);
  });

  document.querySelectorAll('.pf-close-btn').forEach(el => {
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('tabindex', '-1');
  });

  document.querySelectorAll('.pf-close-btn svg').forEach(el => {
    el.setAttribute('aria-hidden', 'true');
  });

  document.querySelectorAll('script[app]').forEach(el => {
    if (el.getAttribute('app') === 'vsk') {
      el.removeAttribute('role');
    }
  });
});
