document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // 1. CONFIGURATION (LENIS & GSAP)
    // --------------------------------------------------------

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const isProjectPage = document.body.classList.contains('project-page'); // Détection page projet

    let lenis;
    if (!isMobile && typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true
        });
        // On ne stop pas Lenis tout de suite si on a déjà visité, 
        // le preloader gère ça plus bas.
    }

    gsap.registerPlugin(ScrollTrigger);

    function raf(time) {
        if (lenis) lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (lenis) {
        gsap.ticker.add((time) => { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
    }

    // --------------------------------------------------------
    // 2. GESTION DU PRELOADER (Global)
    // --------------------------------------------------------

    const preloaderElement = document.querySelector(".preloader");
    const hasVisited = sessionStorage.getItem("hasVisited");

    // Fonction de démarrage selon la page
    function startSite() {
        if (lenis) lenis.start();
        initScrollLines();

        // Lancement conditionnel des animations
        if (isProjectPage) {
            // Les animations projet sont gérées par script-projet.js
            console.log('Page projet détectée');
        } else {
            initHomePageAnimations();
            playHomeHeroAnimations();
        }
    }

    if (hasVisited) {
        // VISITEUR DÉJÀ VENU
        if (preloaderElement) preloaderElement.style.display = "none";

        // Setup immédiat des éléments masqués par défaut
        gsap.set(".desktop-nav", { yPercent: 0, xPercent: -50, autoAlpha: 1 });
        gsap.set(".scroll-indicator", { y: 0, autoAlpha: 0.7 });

        // Pour l'accueil
        gsap.set("h1.reveal-text", { y: 0, autoAlpha: 1 });
        gsap.set(".hero-subtitle", { y: 0, autoAlpha: 1 });

        startSite();

    } else {
        // PREMIÈRE VISITE (Animation Preloader)
        if (lenis) lenis.stop(); // Bloque le scroll pendant le chargement

        const tlLoader = gsap.timeline({
            onComplete: () => {
                startSite();
                sessionStorage.setItem("hasVisited", "true");
            }
        });

        if (document.querySelector(".fill")) {
            tlLoader.to(".fill", {
                backgroundPosition: "0% 0",
                duration: 2.5,
                ease: "power4.inOut"
            })
                .to({}, { duration: 0.1 });
        }

        if (preloaderElement) {
            tlLoader.to(preloaderElement, {
                yPercent: -100,
                duration: 0.8,
                ease: "power4.inOut"
            });
        }

        // On lance l'intro Hero un peu avant la fin du rideau noir
        tlLoader.add(() => {
            if (!isProjectPage) playHomeHeroAnimations();
            // Les animations projet sont gérées par script-projet.js
        }, "-=0.7");
    }

    // --------------------------------------------------------
    // 3. FONCTIONS D'ANIMATIONS (ACCUEIL)
    // --------------------------------------------------------

    function initScrollLines() {
        const paths = document.querySelectorAll('.organic-path');
        if (!paths.length) return;

        paths.forEach((path) => {
            const length = path.getTotalLength();
            gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
            gsap.to(path, {
                strokeDashoffset: 0,
                ease: "none",
                scrollTrigger: {
                    trigger: "body",
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1.5
                }
            });
        });
    }

    function playHomeHeroAnimations() {
        // Sécurité : si on n'est pas sur l'accueil, on arrête
        if (!document.querySelector('.hero')) return;

        const tl = gsap.timeline();
        gsap.set(".desktop-nav", { xPercent: -50 });

        tl.fromTo(".desktop-nav",
            { yPercent: -200, xPercent: -50, autoAlpha: 0 },
            { yPercent: 0, xPercent: -50, autoAlpha: 1, duration: 0.8, ease: "power4.out" }
        );

        if (document.querySelector("h1.reveal-text")) {
            tl.fromTo("h1.reveal-text",
                { y: 40, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05, ease: "power4.out" }, "-=0.7"
            );
        }

        if (document.querySelector(".hero-subtitle")) {
            tl.fromTo(".hero-subtitle",
                { y: 20, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.5"
            );
        }

        if (document.querySelector(".scroll-indicator")) {
            gsap.fromTo(".scroll-indicator",
                { y: -10, autoAlpha: 0 },
                { y: 0, autoAlpha: 0.7, duration: 0.5, ease: "power2.out", delay: 0.3 }
            );
        }
    }

    function initHomePageAnimations() {
        // Blobs Liquides
        const heroSection = document.querySelector('.hero');
        const blobPurple = document.querySelector('.blob-purple');
        const blobBlue = document.querySelector('.blob-blue');

        if (window.matchMedia("(pointer: fine)").matches && blobPurple && blobBlue && heroSection) {
            const xToP = gsap.quickTo(blobPurple, "x", { duration: 2, ease: "power2.out" });
            const yToP = gsap.quickTo(blobPurple, "y", { duration: 2, ease: "power2.out" });
            const xToB = gsap.quickTo(blobBlue, "x", { duration: 0.8, ease: "power2.out" });
            const yToB = gsap.quickTo(blobBlue, "y", { duration: 0.8, ease: "power2.out" });

            heroSection.addEventListener('mousemove', (e) => {
                const x = e.clientX - (window.innerWidth / 2);
                const y = e.clientY - (window.innerHeight / 2);
                xToP(x); yToP(y); xToB(x); yToB(y);
            });
        }

        // Spotlight
        const heroContent = document.querySelector('.hero-content');
        if (window.matchMedia("(pointer: fine)").matches && heroContent) {
            heroContent.addEventListener('mousemove', (e) => {
                const rect = heroContent.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                heroContent.style.setProperty('--cursor-x', `${x}px`);
                heroContent.style.setProperty('--cursor-y', `${y}px`);
            });
        }
    }

    // Section About (Accueil)
    if (document.querySelector(".about-section")) {
        const aboutTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".about-section",
                start: "top 70%",
                toggleActions: "play none none reverse"
            }
        });
        aboutTl.from(".about-text .reveal-text", {
            y: 30,
            autoAlpha: 0,
            duration: 1,
            stagger: 0.1,
            ease: "power3.out"
        })
            .to(".about-image-wrapper", {
                autoAlpha: 1,
                scale: 1,
                duration: 1.5,
                ease: "power2.out"
            }, "-=0.8");
    }

    // Compteurs (Accueil)
    gsap.utils.toArray(".counter").forEach(counter => {
        const target = counter.getAttribute("data-target");
        if (target) {
            gsap.to(counter, {
                innerText: target,
                duration: 2,
                snap: { innerText: 1 },
                scrollTrigger: {
                    trigger: ".stats-grid",
                    start: "top 85%"
                },
                ease: "power1.out",
                onUpdate: function () {
                    counter.innerText = Math.ceil(counter.innerText) + "+";
                }
            });
        }
    });

    // --------------------------------------------------------
    // 6. INTERFACE (HEADER & MENU)
    // --------------------------------------------------------

    // Gestion Nav Backdrop
    const navBackdrop = document.querySelector('.nav-backdrop');
    const navItems = document.querySelectorAll('.nav-item');
    const contactBtn = document.querySelector('#btn-contact');
    const linksContainer = document.querySelector('.links');

    function moveBackdropTo(element) {
        if (!element || !navBackdrop) return;
        const width = element.offsetWidth;
        const left = element.offsetLeft;
        navBackdrop.style.width = `${width}px`;
        navBackdrop.style.left = `${left}px`;
    }



    // ScrollSpy (Uniquement si les sections existent)
    const sections = document.querySelectorAll('section[id]');
    function scrollSpy() {
        if (sections.length === 0) return;

        let current = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= (sectionTop - 300)) {
                current = section.getAttribute('id');
            }
        });
        if (current) {
            const activeLink = document.querySelector(`.nav-item[href*="index.html#${current}"], .nav-item[href="#${current}"]`);
            if (activeLink && navBackdrop) {
                moveBackdropTo(activeLink);
                if (activeLink.id === 'btn-contact') {
                    navBackdrop.style.background = "var(--accent-primary)";
                } else {
                    navBackdrop.style.background = "rgba(255, 255, 255, 0.1)";
                }
                navItems.forEach(link => link.style.color = "");
                activeLink.style.color = "white";
            }
        }
    }
    window.addEventListener('scroll', scrollSpy);

    // Menu Mobile
    const burgerBtn = document.querySelector('.burger-btn');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (burgerBtn && mobileMenu) {
        const menuTimeline = gsap.timeline({ paused: true });
        menuTimeline.to(mobileMenu, {
            duration: 0.5,
            autoAlpha: 1,
            ease: "power3.inOut"
        })
            .from(mobileLinks, {
                y: 50,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power4.out"
            }, "-=0.2");

        burgerBtn.addEventListener('click', () => {
            burgerBtn.classList.toggle('active');
            if (burgerBtn.classList.contains('active')) {
                if (lenis) lenis.stop();
                menuTimeline.play();
            } else {
                menuTimeline.reverse();
                if (lenis) lenis.start();
            }
        });

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                burgerBtn.classList.remove('active');
                menuTimeline.reverse();
                if (lenis) lenis.start();
            });
        });
    }

    // Social Magnetic
    const socialLinks = document.querySelectorAll('.footer-links a');
    if (window.matchMedia("(pointer: fine)").matches) {
        socialLinks.forEach(link => {
            link.addEventListener('mousemove', (e) => {
                const rect = link.getBoundingClientRect();
                const x = (e.clientX - (rect.left + rect.width / 2)) * 0.5;
                const y = (e.clientY - (rect.top + rect.height / 2)) * 0.5;
                gsap.to(link, { x: x, y: y, duration: 0.3, ease: "power2.out" });
            });
            link.addEventListener('mouseleave', () => {
                gsap.to(link, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
            });
        });
    }

    // Marquee Animation
    if (document.querySelector(".marquee-content")) {
        gsap.to(".marquee-content", {
            xPercent: -100,
            repeat: -1,
            duration: 35,
            ease: "linear"
        });
    }

    // Scroll Indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                gsap.to(scrollIndicator, { opacity: 0, duration: 0.3 });
            } else {
                gsap.to(scrollIndicator, { opacity: 0.7, duration: 0.3 });
            }
        });
    }
});

// Copy Email Function
function copyEmail() {
    const email = "olivier.p.fr@outlook.fr";
    navigator.clipboard.writeText(email).then(() => {
        const btn = document.querySelector('.copy-email-btn');
        if (btn) {
            btn.classList.add('copied');
            setTimeout(() => { btn.classList.remove('copied'); }, 2000);
        }
    }).catch(err => {
        console.error('Erreur lors de la copie:', err);
    });
}