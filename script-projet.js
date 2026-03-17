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

        // Attendre que le navigateur ait calculé le layout
        requestAnimationFrame(() => {
            initAnimations();

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
                // --- GESTION DU RESPONSIVE GSAP (Stable) ---
                let mm = gsap.matchMedia();

                // Active le sticky SEULEMENT sur Desktop (> 1024px)
                mm.add("(min-width: 1025px)", () => {
                    const stickyContent = document.querySelector(".sticky-content");
                    if (!stickyContent) return;

                    const contentHeight = stickyContent.offsetHeight;
                    const viewportHeight = window.innerHeight;
                    const overflow = contentHeight - (viewportHeight * 0.85);

                    ScrollTrigger.create({
                        trigger: ".sticky-container",
                        // Si le contenu est plus grand que le viewport, on retarde le pin
                        start: overflow > 0 ? `top+=${overflow}px top` : "top 15%",
                        end: "bottom bottom",
                        pin: ".sticky-content",
                        pinSpacing: false,
                        invalidateOnRefresh: true,
                    });
                });

                ScrollTrigger.refresh();
            });
        });
    }

    window.addEventListener("load", () => { loadDone = true; setup(); });
    window.addEventListener("appReady", () => { appDone = true; setup(); });

    function initAnimations() {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        if(document.querySelector(".project-hero h1")) {
            tl.from(".project-category", { y: 20, opacity: 0, duration: 0.8 })
              .from(".project-hero h1", { y: 40, opacity: 0, duration: 1 }, "-=0.6")
              .from(".project-hero-description", { y: 20, opacity: 0, duration: 0.8 }, "-=0.6")
              .from(".project-meta", { y: 20, opacity: 0, duration: 0.8 }, "-=0.6")
              .from(".project-hero-image", { y: 60, opacity: 0, duration: 1.2 }, "-=0.8");
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