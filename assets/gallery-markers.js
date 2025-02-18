(function(w,d){
    let _data = [];

    const initData = () => {
        const dataElems = d.querySelectorAll('.js-piercing-type-data');
        dataElems.forEach(dataElem => {
            _data.push(JSON.parse(dataElem.innerText.replaceAll('page-gallery--', '')));
        });

        if (!_data) return;
    };

    const renderMarkers = (container, arr) => {
        for (let [index, item] of arr.entries()) {
            let span = d.createElement('span');
            span.classList.add('marker', 'js-change-image');
            span.setAttribute('aria-hidden', true);
            span.setAttribute('data-index', index);
            span.style.setProperty('--pos-x', `${item.pos_x}%`);
            span.style.setProperty('--pos-y', `${item.pos_y}%`);

            if (index === 0) {
                span.classList.add('js-default-open');
            }

            container.append(span);
        }
    };

    const renderImages = (container, arr) => {
        for (let [index, item] of arr.entries()) {
            let li = d.createElement('li');
            li.classList.add('image', 'hide');
            li.setAttribute('data-index', index);

            if (item.image) {
                li.style.backgroundImage = `url(${item.image})`;
            }

            if (item.link) {
                let anchor = d.createElement('a');
                anchor.href = item.link
                li.append(anchor)
            }

            container.append(li);
        }
    };

    const render = () => {
        for (let data of _data) {
            const type = Object.keys(data)[0];
            const content = data[type];

            const wrapper = d.getElementById(`tab-${type}`);
            const diagram = wrapper.querySelector('.diagram');
            const images = wrapper.querySelector('.images');

            if (diagram) renderMarkers(diagram, content);
            if (diagram) renderImages(images, content);
        }
    };

    const init = e => {
        initData();
        render();

        d.dispatchEvent(new Event('galleryData:loaded'));

        if (Shopify.designMode) {
            // This will only render in the theme editor
            initData();
            render();
        }
    };

    d.addEventListener('DOMContentLoaded', init, false);
})(window, document);