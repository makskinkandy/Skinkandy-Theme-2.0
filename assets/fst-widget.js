
/*  ===================================
 *  FREE SHIPPING TRESHOLD WIDGET
 *  - Simple widget that adds a progress bar indicating how far they are for free shipping
 *  ===================================
 */

(function(w,d){
    const settings = {
        message: 'FSTMessage',
        message_error: 'Please enter a target goal amount in the Theme Settings > Cart > Free Shipping Threshold'
    }

    let data;
    let exchange_rate = Shopify.currency.rate;

    function initData(container) {
        const dataset = container.dataset.settings ?? new Object;
        if (Object.keys(dataset).length === 0) return;
        data = JSON.parse(dataset);
    }

    function fetchCartData(container, progress_bar) {
        fetch((window.theme.routes.cart ? window.theme.routes.cart : '/cart.js'), {
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => calculateShipping(data, progress_bar));
    }

    function renderElements(container, progress_bar) {
        const labelHTML = d.createElement('label')
        labelHTML.setAttribute('for', progress_bar)
        // labelHTML.textContent = 'Free shipping progress'

        const progressBarHTML = d.createElement('div')
        progressBarHTML.id = progress_bar
        progressBarHTML.className = 'progress_bar'
        progressBarHTML.setAttribute('max', 100)
        progressBarHTML.setAttribute('value', 0)
        progressBarHTML.dataset.target = data.target ?? null

        /* Step One */
        const stepOne = d.createElement('div');
        stepOne.classList.add('fst-step-one');
        stepOne.dataset.value = data.step_one ?? null
        stepOne.dataset.color = '#707070'
        /* End Step One */

        /* Labels */
        const stepOneLabel = d.createElement('div');
        stepOneLabel.classList.add('fst-step-one-label');
        stepOneLabel.dataset.value = data.step_one_label ?? null

        const targetLabel = d.createElement('div');
        targetLabel.classList.add('fst-target-label');
        targetLabel.dataset.value = data.target_label ?? null
        /* End Labels */

        const progressBarWrapper = d.createElement('div')
        progressBarWrapper.classList.add('fst-progress-bar-wrapper')
        progressBarWrapper.dataset.target = data.target ?? null
        progressBarWrapper.appendChild(progressBarHTML)
        progressBarWrapper.appendChild(stepOne)
        progressBarWrapper.appendChild(stepOneLabel)
        progressBarWrapper.appendChild(targetLabel)

        const messageHTML = d.createElement('div')
        messageHTML.id = settings.message
        messageHTML.classList.add('fst-message')

        container.appendChild(messageHTML);
        container.appendChild(labelHTML);
        container.appendChild(progressBarWrapper);
    }

    function calculateShipping(cartJson, progress_bar) {
        const target = data.target ? parseFloat(data.target) : null;
        const stepOne = data.step1 ? parseFloat(data.step1) : null;
        let cart_total = (cartJson.total_price ? cartJson.total_price : cartJson.final_price) / 100;

        if (data.shop_currency != data.cart_currency) {
            cart_total = cart_total / exchange_rate;
        }

        /* Set Step one */
        let stepOnes = document.querySelectorAll('.fst-step-one');
        if (stepOnes) {
            for (const stepOne of stepOnes) {
                stepOne.style.left = `${data.step_one / data.target * 100}%`;

                if (cart_total >= parseInt(data.step_one)) {
                    stepOne.classList.add('active');
                    // delay  base on transition 2s
                    setTimeout(
                        function() {
                            startConfetti();

                            // stop after 5 sec
                            setTimeout(
                                function() {
                                    stopConfetti();
                                }
                            ,5000);
                        }
                    ,2000);

                } else {
                    stepOne.classList.remove('active');
                    stopConfetti();
                }
            }
        }
        /* End Set Step one */

        /* Labels */
        let stepOneLabels = document.querySelectorAll('.fst-step-one-label');
        if (stepOneLabels) {
            for (const stepOneLabel of stepOneLabels) {
                stepOneLabel.style.left = `${data.step_one / data.target * 100}%`;
            }
        }

        let targetLabels = document.querySelectorAll('.fst-target-label');
        if (targetLabels) {
            for (const targetLabel of targetLabels) {
             targetLabel.style.left = '100%';
            }
        }
        /* End Labels */

        const progress_value = (cart_total / target) * 100;
        const remaining = stepOne - cart_total;
        const remaininExpress = target - cart_total;
        let message = '';

        if (target) {
            // Set value of progress bar
            if (progress_value >= 100){
                d.getElementById('FSTBar').setAttribute('value', 100);
                d.getElementById('FSTBar').parentElement.setAttribute('value', 100);

                // delay  base on transition 2s
                setTimeout(
                    function() {
                        startConfetti();

                        // stop after 5 sec
                        setTimeout(
                            function() {
                                stopConfetti();
                            }
                        ,5000);
                    }
                ,2000);

                if ( d.getElementById('FSTBarProduct') != null ) {
                    d.getElementById('FSTBarProduct').setAttribute('value', 100);
                    d.getElementById('FSTBarProduct').parentElement.setAttribute('value', 100);
                }

                // jQuery can't select peudo selector
                $( "<style>#FSTBar:before, #FSTBarProduct:before { width: 100%; } #FSTBar:after, #FSTBarProduct:after { left: 100%; }</style>" ).appendTo( "head" );
            } else {
                d.getElementById('FSTBar').setAttribute('value', progress_value ? progress_value : 0);
                d.getElementById('FSTBar').parentElement.setAttribute('value', progress_value ? progress_value : 0);

                // stopConfetti();

                if ( d.getElementById('FSTBarProduct') != null ) {
                    d.getElementById('FSTBarProduct').setAttribute('value', progress_value ? progress_value : 0);
                    d.getElementById('FSTBarProduct').parentElement.setAttribute('value', progress_value ? progress_value : 0);
                }

                // jQuery can't select peudo selector
                if ( isNaN( progress_value )) {
                    $( "<style>#FSTBar:before, #FSTBarProduct:before { width: 0%; } #FSTBar:after, #FSTBarProduct:after { left: 0%; }</style>" ).appendTo( "head" );

                } else {
                    $( "<style>#FSTBar:before, #FSTBarProduct:before { width:" + progress_value + "%; } #FSTBar:after, #FSTBarProduct:after { left: " + progress_value + "%; }</style>" ).appendTo( "head" );
                }

            }

            message =
                remaining >= stepOne ? data.message_default.replace('[target]', `$${stepOne}`) :
                remaining <= 0 ? data.message_ongoing.replace('[remaining]', `$${remaining ? remaining.toFixed(2) : stepOne}`)  :
                remaininExpress <= 0 ? data.message_success : data.message_ongoing_express.replace('[remaining]', `$${remaining ? remaining.toFixed(2) : target}`);

        }
        else
            message = settings.message_error

        // Display message
        d.getElementById(settings.message).innerHTML = message;
    }

    function init() {
        // if (!container) return;
        const containerProduct = d.getElementById('FSTContainerProduct');
        const container = d.getElementById('FSTContainer');

        initData(container);
        renderElements(container, 'FSTBar');
        fetchCartData(container, 'FSTBar');

        if ( containerProduct != null) {
            initData(containerProduct);
            renderElements(containerProduct, 'FSTBarProduct');
            fetchCartData(containerProduct, 'FSTBarProduct');
        }

        // Listeners for product added and cart updates
        ['cart:build', 'cart:updated', 'ajaxProduct:added', 'ajaxProduct:error'].forEach(evt =>
            d.addEventListener(evt, fetchCartData, false)
        );
    }

    init();
})(window, document)
