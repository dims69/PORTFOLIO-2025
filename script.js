// ========================================================
// 1. WEB COMPONENTS (Header & Footer) - NOUVELLE APPROCHE
// ========================================================

class HeaderComponent extends HTMLElement {
    connectedCallback() {
        fetch('header.html')
            .then(response => {
                if (!response.ok) throw new Error('Header non trouvé');
                return response.text();
            })
            .then(html => {
                this.innerHTML = html;
                this.initBurgerMenu();
                window.dispatchEvent(new CustomEvent('header-loaded'));
            })
            .catch(error => {
                console.error('Erreur chargement header:', error);
            });
    }

    initBurgerMenu() {
        const burgerBtn = this.querySelector('.burger-btn');
        const mobileOverlay = document.querySelector('.mobile-menu-overlay');
        const mobileLinks = document.querySelectorAll('.mobile-link');

        if (burgerBtn && mobileOverlay) {
            // Menu Mobile avec GSAP
            const menuTimeline = gsap.timeline({ paused: true })
                .to(mobileOverlay, { duration: 0.5, autoAlpha: 1, ease: "power3.inOut" })
                .from(mobileLinks, { y: 50, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power4.out" }, "-=0.2");

            burgerBtn.addEventListener('click', () => {
                burgerBtn.classList.toggle('active');
                if (burgerBtn.classList.contains('active')) {
                    if (window.lenis) window.lenis.stop();
                    menuTimeline.play();
                } else {
                    menuTimeline.reverse();
                    if (window.lenis) window.lenis.start();
                }
            });

            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    burgerBtn.classList.remove('active');
                    menuTimeline.reverse();
                    if (window.lenis) window.lenis.start();
                });
            });
        }
    }
}

class FooterComponent extends HTMLElement {
    connectedCallback() {
        fetch('footer.html')
            .then(response => {
                if (!response.ok) throw new Error('Footer non trouvé');
                return response.text();
            })
            .then(html => {
                this.innerHTML = html;
                this.initEmailCopy();
                this.initSocialMagnetic();
                window.dispatchEvent(new CustomEvent('footer-loaded'));
                
                if (window.ScrollTrigger) {
                    ScrollTrigger.refresh();
                }
            })
            .catch(error => {
                console.error('Erreur chargement footer:', error);
            });
    }

    initEmailCopy() {
        const copyBtn = this.querySelector('.copy-email-btn');
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const email = 'olivier.p.fr@outlook.fr';
                const feedback = copyBtn.querySelector('.copy-feedback');

                navigator.clipboard.writeText(email).then(() => {
                    copyBtn.classList.add('copied');
                    
                    if (feedback) {
                        feedback.style.opacity = '1';
                    }

                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        if (feedback) {
                            feedback.style.opacity = '0';
                        }
                    }, 2000);
                }).catch(err => {
                    console.error('Erreur lors de la copie:', err);
                });
            });
        }
    }

    initSocialMagnetic() {
        const socialLinks = this.querySelectorAll('.footer-links a');
        if (window.matchMedia("(pointer: fine)").matches && socialLinks.length > 0) {
            socialLinks.forEach(link => {
                const xTo = gsap.quickTo(link, "x", { duration: 0.3, ease: "power2.out" });
                const yTo = gsap.quickTo(link, "y", { duration: 0.3, ease: "power2.out" });

                link.addEventListener('mousemove', (e) => {
                    const rect = link.getBoundingClientRect();
                    const x = (e.clientX - (rect.left + rect.width / 2)) * 0.5;
                    const y = (e.clientY - (rect.top + rect.height / 2)) * 0.5;
                    xTo(x);
                    yTo(y);
                });

                link.addEventListener('mouseleave', () => {
                    gsap.to(link, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
                });
            });
        }
    }
}

// Enregistrer les Web Components
customElements.define('app-header', HeaderComponent);
customElements.define('app-footer', FooterComponent);

// ========================================================
// 2. CŒUR DU SITE - INITIALISATION
// ========================================================

document.addEventListener("DOMContentLoaded", initWebsite);

function initWebsite() {
    // Attendre que les composants soient chargés avant de lancer l'app
    let headerLoaded = false;
    let footerLoaded = false;

    const checkAndRun = () => {
        if (headerLoaded && footerLoaded) {
            runApp();
        }
    };

    window.addEventListener('header-loaded', () => {
        headerLoaded = true;
        checkAndRun();
    });

    window.addEventListener('footer-loaded', () => {
        footerLoaded = true;
        checkAndRun();
    });

    // Si pas de composants sur la page (fallback)
    setTimeout(() => {
        if (!headerLoaded && !footerLoaded) {
            console.log('Composants non détectés, lancement direct');
            runApp();
        }
    }, 1000);
}

// ========================================================
// 3. APPLICATION PRINCIPALE
// ========================================================

function runApp() {
    
    // --------------------------------------------------------
    // CONFIGURATION (LENIS & GSAP)
    // --------------------------------------------------------

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const isProjectPage = document.body.classList.contains('project-page');

    let lenis;
    if (!isMobile && typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true
        });
        window.lenis = lenis; // Rendre accessible globalement
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
    // GESTION DU PRELOADER
    // --------------------------------------------------------

    const preloaderElement = document.querySelector(".preloader");
    const hasVisited = sessionStorage.getItem("hasVisited");

    function startSite() {
        if (lenis) lenis.start();
        initScrollLines();

        if (isProjectPage) {
            console.log('Page projet détectée');
        } else {
            initHomePageAnimations();
            playHomeHeroAnimations();
            initScrollSpy(); 
        }
    }

    if (hasVisited) {
        if (preloaderElement) preloaderElement.style.display = "none";
        
        // Initialisation immédiate des états (set)
        gsap.set(".desktop-nav", { yPercent: 0, xPercent: -50, autoAlpha: 1 });
        gsap.set(".scroll-indicator", { y: 0, autoAlpha: 0.7 });
        if (!isProjectPage) {
            gsap.set("h1.reveal-text", { y: 0, autoAlpha: 1 });
            gsap.set(".hero-subtitle", { y: 0, autoAlpha: 1 });
        }

        startSite();

    } else {
        if (lenis) lenis.stop();

        const tlLoader = gsap.timeline({
            onComplete: () => {
                startSite();
                sessionStorage.setItem("hasVisited", "true");
            }
        });

        const fillElement = document.querySelector(".fill");
        if (fillElement) {
            tlLoader.to(".fill", {
                backgroundPosition: "0% 0",
                duration: 2.5,
                ease: "power4.inOut"
            });
        }

        if (preloaderElement) {
            tlLoader.to(preloaderElement, {
                yPercent: -100,
                duration: 0.8,
                ease: "power4.inOut"
            }, fillElement ? ">" : null); 
        }

        tlLoader.add(() => {
            if (!isProjectPage) playHomeHeroAnimations();
        }, "-=0.7");
    }

    // --------------------------------------------------------
    // ANIMATIONS
    // --------------------------------------------------------

    function initScrollLines() {
        const paths = document.querySelectorAll('.organic-path');
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
        if (!document.querySelector('.hero')) return;

        const tl = gsap.timeline();
        gsap.set(".desktop-nav", { xPercent: -50 });

        tl.fromTo(".desktop-nav",
            { yPercent: -200, autoAlpha: 0 }, 
            { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: "power4.out" }
        );

        const h1 = document.querySelector("h1.reveal-text");
        if (h1) {
            tl.fromTo(h1,
                { y: 40, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05, ease: "power4.out" }, "-=0.7"
            );
        }

        const sub = document.querySelector(".hero-subtitle");
        if (sub) {
            tl.fromTo(sub,
                { y: 20, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.5"
            );
        }

        const scrollInd = document.querySelector(".scroll-indicator");
        if (scrollInd) {
            gsap.fromTo(scrollInd,
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
                heroContent.style.setProperty('--cursor-x', `${e.clientX - rect.left}px`);
                heroContent.style.setProperty('--cursor-y', `${e.clientY - rect.top}px`);
            });
        }
    }

    // Animation About
    if (document.querySelector(".about-section")) {
        gsap.from(".about-text .reveal-text", {
            scrollTrigger: {
                trigger: ".about-section",
                start: "top 70%",
                toggleActions: "play none none reverse"
            },
            y: 30,
            autoAlpha: 0,
            duration: 1,
            stagger: 0.1,
            ease: "power3.out"
        });
        
        gsap.to(".about-image-wrapper", {
            scrollTrigger: {
                trigger: ".about-section",
                start: "top 70%",
                toggleActions: "play none none reverse"
            },
            autoAlpha: 1,
            scale: 1,
            duration: 1.5,
            ease: "power2.out"
        });
    }

    // Compteurs
    const counters = gsap.utils.toArray(".counter");
    if(counters.length > 0) {
        counters.forEach(counter => {
            const target = counter.getAttribute("data-target");
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
        });
    }

    // --------------------------------------------------------
    // SCROLLSPY OPTIMISÉ
    // --------------------------------------------------------

    function initScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navBackdrop = document.querySelector('.nav-backdrop');
        const navItems = document.querySelectorAll('.nav-item');

        if (!navBackdrop || sections.length === 0) return;

        const updateNav = (id) => {
            const activeLink = document.querySelector(`.nav-item[href*="#${id}"]`);
            
            if (activeLink) {
                navItems.forEach(el => el.style.color = "");
                activeLink.style.color = "white";

                const width = activeLink.offsetWidth;
                const left = activeLink.offsetLeft;
                navBackdrop.style.width = `${width}px`;
                navBackdrop.style.left = `${left}px`;

                if (activeLink.id === 'btn-contact') {
                    navBackdrop.style.background = "var(--accent-primary)";
                } else {
                    navBackdrop.style.background = "rgba(255, 255, 255, 0.1)";
                }
            }
        };

        sections.forEach(section => {
            ScrollTrigger.create({
                trigger: section,
                start: "top center",
                end: "bottom center",
                onEnter: () => updateNav(section.id),
                onEnterBack: () => updateNav(section.id)
            });
        });
    }

    // Marquee
    const marqueeContent = document.querySelector(".marquee-content");
    if (marqueeContent) {
        gsap.to(marqueeContent, {
            xPercent: -100,
            repeat: -1,
            duration: 35,
            ease: "linear"
        });
    }

    // Scroll Indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        ScrollTrigger.create({
            trigger: "body",
            start: "50px top",
            onEnter: () => gsap.to(scrollIndicator, { opacity: 0, duration: 0.3 }),
            onLeaveBack: () => gsap.to(scrollIndicator, { opacity: 0.7, duration: 0.3 })
        });
    }
}

// ========================================================
// 4. FONCTION GLOBALE (Fallback pour ancien code HTML)
// ========================================================

window.copyEmail = function(btnElement) {
    const email = "olivier.p.fr@outlook.fr";
    const btn = btnElement || document.querySelector('.copy-email-btn');

    if(navigator.clipboard) {
        navigator.clipboard.writeText(email).then(() => {
            if (btn) {
                btn.classList.add('copied');
                setTimeout(() => { btn.classList.remove('copied'); }, 2000);
            }
        }).catch(err => console.error('Erreur copy:', err));
    } else {
        console.warn("Clipboard API non supportée");
    }
}