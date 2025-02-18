const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class QuickAdss extends HTMLElement {
  constructor(){
    super();

    const variants = this.querySelectorAll('.quick-add-variant-selector');
    if (variants) {
      const updatePrice = (el, amount) => {
        const parent = el.closest('.quick-add-item');
        const priceEl = parent.querySelector('.quick-add-price');
        if (!priceEl) return;
        priceEl.innerText = amount;
      };

      variants.forEach((el) => {
        const parent = el.closest('.quick-add-item');
        const button = parent.querySelector('button');
        if (el.classList.contains('group-selector')) {
          const pills = el.querySelectorAll('.pill');
          pills.forEach((pill) => {
            pill.addEventListener('click', (e) => {
              pills.forEach((p) => p.classList.remove('active'));
              e.target.classList.add('active');
              updatePrice(e.target, e.target.dataset.price);
              button.dataset.variant = e.target.dataset.variant;
            });
          })
        }
        else {
          el.addEventListener('change', (e) => {
            updatePrice(e.target, e.target.options[e.target.selectedIndex].dataset.price);
            button.dataset.variant = e.target.value;
          });
        }
      });
    }


    const buttons = this.querySelectorAll('button');
    buttons.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const self = e.target;
        const variantId = self.dataset.variant;
        if (!variantId) return;

        self.classList.add('btn--loading');
        try {
          const res = await fetch(window.Shopify.routes.root + 'cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [
                {
                 id: +variantId,
                 quantity: 1
                }
              ]
            })
          });
          const data = await res.json();

          if (res.status === 422) {
            console.log({ data });
            this.error(self, data);
          }
          if (res.ok) {
            this.success(self, data);
          }
        } catch (error) {
          console.log(error);
          this.error(self, error);
        } finally {
          self.classList.remove('btn--loading');
        }
      });
    });

    // Init slick slider
    const slider = this.querySelector('[data-slick]');
    if (slider) {
      const observer = new IntersectionObserver(([entry], observer) => {
        if (entry.isIntersecting) {
          if (!entry.target.classList.contains('slick-initialized'))
            $(entry.target).slick();

          $(entry.target).slick('refresh');
          $(entry.target).slick('setPosition');
        }
      });
      observer.observe(slider);
    }
  }

  async success(buttonEl, error) {
    document.dispatchEvent(new CustomEvent('cart:build'));

    buttonEl.classList.add('no-event');
    buttonEl.lastElementChild.textContent = 'Added!';
    await timeout(2000);
    buttonEl.lastElementChild.textContent = 'Add to Basket';
    buttonEl.classList.remove('no-event');
  }

  async error(buttonEl, error) {
    const parent = buttonEl.closest('.quick-add-item');
    if(!parent) return;

    const elem = document.createElement('div');
    elem.classList.add('note', 'error');
    elem.innerHTML = error.description;

    parent.classList.add('no-event');
    parent.appendChild(elem);
    await timeout(2000);
    elem.remove();
    parent.classList.remove('no-event');
  }
}

if (!customElements.get('quick-adds')) {
  customElements.define('quick-adds', QuickAdss);
}