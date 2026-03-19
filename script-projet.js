document.addEventListener("DOMContentLoaded", () => {

    // Sécurité : on vérifie qu'on est sur la page projet
    if (!document.body.classList.contains('project-page')) return;

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Synchronisation : attendre que les images soient chargées (load)
    // ET que script.js ait fini (header/footer injectés + reveals initialisés)
    let loadDone = false;
    let appDone = false;

    function setup() {
        if (!loadDone || !appDone) return;
        if (setup.done) return;
        setup.done = true;

        // Sécurité : nettoyer tout blocage de scroll résiduel
        document.body.classList.remove('no-scroll');
        document.documentElement.classList.remove('lenis-stopped');
        document.body.style.overflow = '';
        document.body.style.overflowX = '';
        document.body.style.overflowY = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.overflowX = '';
        document.documentElement.style.overflowY = '';

        // Attendre que le navigateur ait calculé le layout
        requestAnimationFrame(() => {
            initAnimations();

            const isMobileDevice = window.innerWidth <= 1024;

            // Sur mobile, pas besoin de sticky ni de refresh ScrollTrigger
            if (isMobileDevice) return;

            // Forcer le chargement des images lazy dans la section sticky
            // (elles doivent avoir leur hauteur réelle pour que le pin soit correct)
            const scrollImgs = document.querySelectorAll('.scroll-images img[loading="lazy"]');
            scrollImgs.forEach(img => img.removeAttribute('loading'));

            // Créer le pin après le chargement de toutes les images
            const imgPromises = Array.from(scrollImgs).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.addEventListener('load', resolve, { once: true });
                    img.addEventListener('error', resolve, { once: true });
                });
            });

            Promise.all(imgPromises).then(() => {
                // --- STICKY NATIF CSS (remplace le pin GSAP) ---
                const stickyContent = document.querySelector(".sticky-content");
                if (!stickyContent) return;

                function calcStickyTop() {
                    const contentHeight = stickyContent.offsetHeight;
                    const viewportHeight = window.innerHeight;
                    const headerOffset = 100; // espace sous le header fixe

                    if (contentHeight > viewportHeight - headerOffset) {
                        // Contenu plus long que le viewport : coller le bas du contenu
                        // au bas du viewport (top négatif)
                        stickyContent.style.top = `${viewportHeight - contentHeight - 40}px`;
                    } else {
                        // Contenu court : coller en haut sous le header
                        stickyContent.style.top = `${headerOffset}px`;
                    }
                }

                stickyContent.style.position = 'sticky';
                stickyContent.style.alignSelf = 'flex-start';
                calcStickyTop();

                // Recalculer au resize
                window.addEventListener('resize', calcStickyTop);

                ScrollTrigger.refresh();
            });
        });
    }

    window.addEventListener("load", () => { loadDone = true; setup(); });
    window.addEventListener("appReady", () => { appDone = true; setup(); });

    // Filet de sécurité : forcer le déblocage du scroll après tout le JS
    window.addEventListener("load", () => {
        setTimeout(() => {
            document.body.classList.remove('no-scroll');
            document.body.style.overflow = '';
            document.body.style.overflowX = '';
            document.body.style.overflowY = '';
            document.documentElement.style.overflow = '';
            document.documentElement.style.overflowX = '';
            document.documentElement.style.overflowY = '';
            document.documentElement.classList.remove('lenis-stopped');
        }, 500);
    });

    // 1. Wrapper la hero image immédiatement (pas besoin de Fancybox pour ça)
    const heroImg = document.querySelector('.project-hero-image img');
    if (heroImg && !heroImg.closest('[data-fancybox]')) {
        const wrapper = document.createElement('a');
        wrapper.href = heroImg.src;
        wrapper.setAttribute('data-fancybox', 'gallery');
        wrapper.setAttribute('data-caption', heroImg.alt || '');
        wrapper.style.display = 'block';
        wrapper.style.cursor = 'zoom-in';
        heroImg.parentNode.insertBefore(wrapper, heroImg);
        wrapper.appendChild(heroImg);
    }

    // 2. Bind Fancybox quand disponible
    let fancyboxBound = false;

    function bindFancybox() {
        if (fancyboxBound || typeof Fancybox === 'undefined') return;
        fancyboxBound = true;

        let savedScrollY = 0;

        Fancybox.bind("[data-fancybox]", {
            Images: { zoom: false },
            on: {
                init: () => {
                    savedScrollY = window.scrollY || window.pageYOffset;
                    document.body.style.position = 'fixed';
                    document.body.style.top = `-${savedScrollY}px`;
                    document.body.style.width = '100%';
                    if (window.lenis) window.lenis.stop();
                },
                destroy: () => {
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.width = '';
                    window.scrollTo(0, savedScrollY);
                    if (window.lenis) window.lenis.start();
                }
            }
        });
    }

    // Essayer immédiatement (si Fancybox déjà chargé)
    bindFancybox();

    // Sinon, essayer au load
    if (document.readyState === 'complete') {
        bindFancybox();
    } else {
        window.addEventListener("load", bindFancybox);
    }

    // Filet de sécurité : retry après un court délai
    setTimeout(bindFancybox, 1000);

    function initAnimations() {
        const isMobile = window.innerWidth <= 768;

        // Sur mobile, tout est visible immédiatement
        if (isMobile) {
            gsap.set([".project-hero h1", ".project-tags-container", ".project-hero-description", ".project-meta", ".project-hero-image", ".context-section h2", ".context-section p", ".scroll-image-item"], { opacity: 1, y: 0 });
            return;
        }

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        if(document.querySelector(".project-hero h1")) {
            gsap.set([".project-hero h1", ".project-tags-container", ".project-hero-description", ".project-meta", ".project-hero-image"], { opacity: 0, y: 30 });

            tl.to(".project-hero h1", { y: 0, opacity: 1, duration: 0.8 })
              .to(".project-tags-container", { y: 0, opacity: 1, duration: 0.6 }, "-=0.5")
              .to(".project-hero-description", { y: 0, opacity: 1, duration: 0.6 }, "-=0.4")
              .to(".project-meta", { y: 0, opacity: 1, duration: 0.6 }, "-=0.4")
              .to(".project-hero-image", { y: 0, opacity: 1, duration: 0.8 }, "-=0.4");
        }

        gsap.utils.toArray(".context-section h2, .context-section p").forEach(el => {
            gsap.from(el, {
                scrollTrigger: { trigger: el, start: "top 85%" },
                y: 30, opacity: 0, duration: 0.8
            });
        });

        gsap.utils.toArray(".scroll-image-item").forEach(img => {
            gsap.from(img, {
                scrollTrigger: { trigger: img, start: "top 85%" },
                y: 50, opacity: 0, duration: 1, ease: "power2.out"
            });
        });
    }
});