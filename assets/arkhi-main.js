const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const answerValueMatrix = [
  {
    answer: "A love of piercing, body modifications and body jewellery",
    value: 1
  }, {
    answer: "A passion for providing legendary customer service",
    value: 1
  }, {
    answer: "A respect for following guidelines and procedures",
    value: 1
  }, {
    answer: "Individuality, creativity and a fun loving attitude",
    value: 1
  }, {
    answer: "I don't have a particular interest in piercing or retail, but I'm super keen to work and willing to give it my best shot!",
    value: 0
  }, {
    answer: "I don't have retail or piercing experience, but I'd LOVE to work in the piercing industry",
    value: 1
  }, {
    answer: "I'm a customer service superstar with experience in retail",
    value: 2
  }, {
    answer: "I'm an experienced piercer! OR I have completed a piercing training course! OR I'm currently doing a piercing training course!",
    value: 3
  }, {
    answer: "I'm an all-round Legend! I have piercing experience or training, AND I also have experience in Retail!",
    value: 4
  }, {
    answer: "Yes! I have completed this course.",
    value: 3
  }, {
    answer: "Yes! I am currently studying this course.",
    value: 2
  }, {
    answer: "No, but I am definitely willing to!",
    value: 1
  }, {
    answer: "No. I am not sure I am keen for more study.",
    value: 0
  }
]

class CustomScore extends HTMLElement {
  constructor() {
    super();

    this.matrix = answerValueMatrix ?? null;
    if (!this.matrix) return;

    const updateScore = (evt) => {
      const { target } = evt;
      const form = target.closest('form');
      const formData = new FormData(form);

      const total = [...formData.values()].reduce((acc, data) => {
        if (typeof data === 'string') {
          const found = answerValueMatrix.find(({answer}) => answer.toLowerCase() === data.toLowerCase());
          if (found) {
            return acc + found.value
          }
        }
        return acc;
      }, 0);

      const scoreEl = form.querySelector('input#hidden');
      if (!scoreEl) return;
      scoreEl.value = total;
      console.log({ scoreEl }, scoreEl.value);
    }

    document.addEventListener('globo.formbuilder.form.loaded', (e) => {
      console.log('Globo form loaded', { e });
      const { detail: { form, formId } } = e;
      if (!form) return;

      const formEl = form.querySelector('form');
      if (!formEl) return;

      const formElements = formEl.elements;
      const submitBtn = [...formElements].find((el) => el.type === 'button' && el.classList.contains('submit'));

      const observer = new MutationObserver(([mutation]) => {
        if (!mutation) return;
        const { target } = mutation;
        target.addEventListener('click', updateScore);
      });

      if (submitBtn) {
        observer.observe(submitBtn, { attributes: false, childList: true, subtree: true });
      }
    });
  }
}

customElements.define('custom-score', CustomScore);

class ProductGrid extends HTMLElement {

  constructor() {
    super();

    const mql = window.matchMedia("(min-width: 60rem)");
    const isDesktop = mql.matches;
    this.limit = isDesktop ? 8 : 5;

    this.selectors = {
      quickAdd: '[data-quick-add]',
      swatchColors: '[data-swatches--colors]',
      swatchOthers: '[data-swatches--other="true"]'
    }

    this.modal = document.querySelector('.js-ss-modal');

    // console.log(theme && theme.settings.searchSpringEnabled === false, { theme })
    if (theme && theme.settings.searchSpringEnabled === false) {
      this.init();
    }

    window.addEventListener('searchspring.domReady', (e) => {
      // console.log('Searchspring dom ready', { e });
      this.script = this.querySelector('script');
      this.data = this.script && this.script.innerText ? JSON.parse(this.script.innerText) : null;

      this.swatchColorsEl = this.querySelector(this.selectors.swatchColors);
      this.swatchOthersEl = this.querySelector(this.selectors.swatchOthers);

      this.buttonEl = this.querySelector(this.selectors.quickAdd);
      this.buttonTextEl = this.buttonEl.querySelector('span');

      this.buttonEl.addEventListener('click', (e) => {
        // console.log('Quick add button clicked', { e });
        // console.log(this.script, this.data);
        this.checkForOptions();
      });

      if (this.swatchColorsEl) {
        const colorInputs = this.swatchColorsEl.querySelectorAll('input');
        colorInputs.forEach((input) => {
          input.addEventListener('change', (e) => {
            this.updateProductGridImage(e)
          });
        });

        const defaultColor = [...colorInputs].find((el) => el.checked || el.getAttribute('checked'));
        if (defaultColor) {
          // console.log({ defaultColor });
          defaultColor.click();
          defaultColor.dispatchEvent(new Event('change'));
        }
      }
    }, { once: true });
  }

  init() {
    this.script = this.querySelector('script');
    this.data = this.script && this.script.innerText ? JSON.parse(this.script.innerText) : null;

    this.swatchColorsEl = this.querySelector(this.selectors.swatchColors);
    this.swatchOthersEl = this.querySelector(this.selectors.swatchOthers);

    this.buttonEl = this.querySelector(this.selectors.quickAdd);
    this.buttonTextEl = this.buttonEl?.querySelector('span');

    this.buttonEl?.addEventListener('click', (e) => {
      // console.log('Quick add button clicked', { e });
      // console.log(this.script, this.data);
      this.checkForOptions();
    });

    if (this.swatchColorsEl) {
      const colorInputs = this.swatchColorsEl.querySelectorAll('input');
      colorInputs.forEach((input) => {
        input.addEventListener('change', (e) => {
          this.updateProductGridImage(e)
        });
      });

      const defaultColor = [...colorInputs].find((el) => el.checked || el.getAttribute('checked'));
      if (defaultColor) {
        // console.log({ defaultColor });
        defaultColor.click();
        defaultColor.dispatchEvent(new Event('change'));
      }
    }
  }

  updateProductGridImage(evt) {
    const self = evt.target;

    const variants = this.data && this.data.variants ? this.data.variants : null;
    if (!variants) return;

    const filteredVariants = variants.filter((v) => v.options.includes(self.value));
    if (!filteredVariants.length) return;

    const [ firstVariant ] = filteredVariants;
    const position = firstVariant?.featured_media?.position;
    if (!position) return;

    const productGridImages = this.querySelectorAll('.grid-product__image-mask img');
    const selectedImage = [...productGridImages].find((el) => +el.dataset.position === position);
    if (!selectedImage) return;

    [...productGridImages].forEach((el) => el.classList.remove('is-visible'));
    selectedImage.classList.add('is-visible');
  }

  async checkForOptions() {
    const {
      available,
      has_only_default_variant,
      handle,
      id,
      options_with_values,
      variants
    } = this.data;

    if (!available) {
      return;
    }

    if (this.buttonEl.classList.contains('btn-quick-add-close')) {
      this.buttonEl.classList.remove('btn-quick-add-close');

      if (this.swatchOthersEl) {
        this.swatchOthersEl.classList.remove('is-visible');
      }

      if (this.buttonTextEl) {
        this.buttonTextEl.innerText = this.buttonEl.dataset.default ?? 'Add to basket';
      }
      return;
    }

    // For products that have only default variant, add straight to cart
    if (has_only_default_variant && variants[0].available) {
      this.addToCart(variants[0].id);
    }

    // Open modal for the following conditions:
    // if product has more than 2 options
    // if product has two options and none of them are Colour
    // if product has two options and one of them is Colour and has more than 3 variants
    // if product has one option and it is the Colour option and has more than 3 variants
    else if (
      options_with_values.length > 2 ||
      options_with_values.length > 1 && options_with_values.every((option) => (option.name.toLowerCase() !== 'colour' && option.name.toLowerCase() !== 'color')) ||
      options_with_values.length > 0 && options_with_values.some((option) => (option.name.toLowerCase() === 'colour' || option.name.toLowerCase() === 'color') && option.values.length > this.limit)
    ) {
      if (!this.modal) {
        return;
      }

      const holder = this.modal.querySelector('.modal__centered-content > div');
      if (!holder) {
        return;
      }

      this.modal.id = `QuickShopModal-${id}`;
      this.modal.dataset.productId = id;
      holder.id = `QuickShopHolder-${handle}`;

      // console.log(this.modal);

      theme.preloadProductModal(handle, id, this.buttonEl);
    }

    // Render option elements
    else {
      this.renderOptions();
    }


  }

  renderOptions() {
    const { options_with_values, handle, variants } = this.data;

    // Add selected colour variant to cart if product only has colour option
    if (options_with_values.length === 1 && options_with_values.some((option) => (option.name.toLowerCase() === 'colour' || option.name.toLowerCase() === 'color') && option.values.length <= this.limit)) {
      const selectedColour = this.querySelector('fieldset[name="options-colour"] input:checked');
      const currentVariant = selectedColour ? variants.find((v) => v.options.includes(selectedColour.value)) : null;
      if (!currentVariant) return;

      this.addToCart(currentVariant.id);
    }

    // Render elements for other option to show as hover effect
    else {
      const [ firstOption ] = options_with_values.filter((option) => option.name.toLowerCase() !== 'colour' && option.name.toLowerCase() !== 'color');

      this.buttonEl.classList.add('btn-quick-add-close');

      if (this.buttonTextEl) {
        this.buttonTextEl.innerText = 'Close';
      }

      // console.log(this.swatchOthersEl)
      if (this.swatchOthersEl) {
        this.swatchOthersEl.classList.add('is-visible');
      }

      if (!this.swatchOthersEl.firstChild) {
        this.swatchOthersEl.innerHTML = `
          <fieldset name="options-other" data-variant-count="${firstOption.values.length}">
            <legend>${firstOption.name}</legend>
            ${ firstOption.values.map((value) => {
              return `
                <span>
                  <label>
                    <input class="visually-hidden" type="radio" name="${handle}-other" value="${value}">
                    ${value}
                  </label>
                </span>
              `;
            }).join('') }
          </fieldset>
        `;

        const otherOptions = this.swatchOthersEl.querySelectorAll('fieldset[name="options-other"] input');
        otherOptions.forEach((option) => {
          option.addEventListener('change', (e) => {
            const self = e.target;
            const value = self.value;

            const hasColorOption = options_with_values.some((o) => o.name.toLowerCase() === 'colour' || o.name.toLowerCase() === 'color');
            const selectedColour = hasColorOption ? this.querySelector('fieldset[name="options-colour"] input:checked') : false;
            const currentVariant = value ? variants.find((v) => {
              return selectedColour ? v.options.includes(value) && v.options.includes(selectedColour.value) : v.options.includes(value)
            }) : null;

            // console.log({ value, hasColorOption, selectedColour, currentVariant, variants});
            if (!currentVariant) return;

            this.addToCart(currentVariant.id);
            this.buttonEl.click();
          })
        });
      }

      else {
        const checkedOption = this.swatchOthersEl.querySelector('fieldset[name="options-other"] input:checked');
        if (checkedOption) {
          checkedOption.checked = false;
        }
      }
    }
  }

  async addToCart(id) {
    console.log('Adding this variant', { id });
    if (!id) return;

    this.buttonEl.classList.add('btn--loading');

    try {
      const res = await fetch(theme.routes.cartAdd, {
        method: 'POST',
        body: JSON.stringify({
          items: [{
            id,
            quantity: 1,
            properties: {
              "_purchaseURL": window.location.href
            }
          }]
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      if (res.ok && res.status === 200) {
        document.dispatchEvent(new CustomEvent('ajaxProduct:added', {
          detail: {
            product: data,
            addToCartBtn: this.buttonEl
          }
        }));

        if (this.buttonTextEl) {
          this.buttonTextEl.innerText = 'Added!';
        }

      } else {
        console.log({ res, data });
        if (this.buttonTextEl) {
          this.buttonTextEl.innerText = res.status === 422 ? 'Soldout' : 'Not added';
        }
      }

    } catch (error) {
      console.log({ error }, error.message);

      if (this.buttonTextEl) {
        this.buttonTextEl.innerText = 'Not added';
      }

    } finally {
      this.buttonEl.classList.remove('btn--loading');

      await timeout(2000);
      if (this.buttonTextEl) {
        this.buttonTextEl.innerText = this.buttonEl.dataset.default ?? 'Add to basket';
        this.buttonEl.classList.add('quick-add-product-added');
      }
    }
  }
}

if (!customElements.get('product-grid')) {
  customElements.define('product-grid', ProductGrid);
}

const domReady = () => {
  // Enable Ajaxinate
  // https://ajaxinate.elkfox.io/
  new Ajaxinate();

  $(document).on('click', '.js-quickadd-popup-product', (e) => {
    const id = parseInt(e.target.getAttribute('data-variant-id'));
    let formData = {
      'items': [{
          'id': id,
          'quantity': 1
      }]
    };
    fetch(theme.routes.cartAdd, {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(function(data) {
      if (data.status === 422) {
        console.error(data);
      } else {
        var product = data;
        document.dispatchEvent(new CustomEvent('ajaxProduct:added', {
          detail: {
            product: product,
          }
        }));
        window.location.href = '/checkout'
      }
    })

  });
}

document.addEventListener('DOMContentLoaded', domReady);
