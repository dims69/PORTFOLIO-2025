// Fancybox init — chargé juste après fancybox.umd.js (synchrone, pas de DOMContentLoaded)
(function () {
    // 1. Rendre la hero image cliquable (l'ajouter à la galerie)
    var heroImg = document.querySelector('.project-hero-image img');
    if (heroImg && !heroImg.closest('[data-fancybox]')) {
        var wrapper = document.createElement('a');
        wrapper.href = heroImg.src;
        wrapper.setAttribute('data-fancybox', 'gallery');
        wrapper.setAttribute('data-caption', heroImg.alt || '');
        wrapper.style.display = 'block';
        wrapper.style.cursor = 'zoom-in';
        heroImg.parentNode.insertBefore(wrapper, heroImg);
        wrapper.appendChild(heroImg);
    }

    // 2. Configurer Fancybox avec sauvegarde de la position de scroll
    var savedScrollY = 0;

    Fancybox.bind("[data-fancybox]", {
        Images: { zoom: false },
        on: {
            init: function () {
                savedScrollY = window.scrollY || window.pageYOffset;
                document.body.style.position = 'fixed';
                document.body.style.top = '-' + savedScrollY + 'px';
                document.body.style.width = '100%';
                if (window.lenis) window.lenis.stop();
            },
            destroy: function () {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                window.scrollTo(0, savedScrollY);
                if (window.lenis) window.lenis.start();
            }
        }
    });
})();
