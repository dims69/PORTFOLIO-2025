// ========================================================
// 0. CONFIGURATION & CHARGEMENT
// ========================================================

gsap.registerPlugin(ScrollTrigger);

// Empêcher ScrollTrigger de recalculer quand seule la hauteur change (barre d'URL mobile)
ScrollTrigger.config({ ignoreMobileResize: true });

document.addEventListener("DOMContentLoaded", () => {
    loadComponents();
});

function loadComponents() {
    // 1. Charger le Header (Juste l'affichage, plus de logique burger)
    const headerLoad = fetch('header.html')
        .then(res => { if (!res.ok) throw new Error("Header introuvable"); return res.text(); })
        .then(html => {
            const placeholder = document.getElementById('header-placeholder');
            if (placeholder) placeholder.innerHTML = html;
        })
        .catch(err => console.error(err));

    // 2. Charger le Footer (Et activer ses interactions)
    const footerLoad = fetch('footer.html')
        .then(res => { if (!res.ok) throw new Error("Footer introuvable"); return res.text(); })
        .then(html => {
            const placeholder = document.getElementById('footer-placeholder');
            if (placeholder) {
                placeholder.innerHTML = html;
                initFooterInteractions();
            }
        })
        .catch(err => console.error(err));

    // 3. Lancer le site une fois tout chargé
    Promise.allSettled([headerLoad, footerLoad]).then(() => {
        runApp();
        ScrollTrigger.refresh();
        window.dispatchEvent(new Event('appReady'));
    });
}

// ========================================================
// 1. FONCTIONS DU FOOTER
// ========================================================

function initFooterInteractions() {
    // Copie Email
    const copyBtn = document.querySelector('.copy-email-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const email = 'olivier.p.fr@outlook.fr';
            const feedback = copyBtn.querySelector('.copy-feedback');
            
            navigator.clipboard.writeText(email).then(() => {
                copyBtn.classList.add('copied');
                if (feedback) feedback.style.opacity = '1';
                
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    if (feedback) feedback.style.opacity = '0';
                }, 2000);
            });
        });
    }

    // Liens Magnétiques
    const socialLinks = document.querySelectorAll('.footer-links a');
    if (window.matchMedia("(pointer: fine)").matches && socialLinks.length > 0) {
        socialLinks.forEach(link => {
            const xTo = gsap.quickTo(link, "x", { duration: 0.3, ease: "power2.out" });
            const yTo = gsap.quickTo(link, "y", { duration: 0.3, ease: "power2.out" });

            link.addEventListener('mousemove', (e) => {
                const rect = link.getBoundingClientRect();
                const x = (e.clientX - (rect.left + rect.width / 2)) * 0.5;
                const y = (e.clientY - (rect.top + rect.height / 2)) * 0.5;
                xTo(x); yTo(y);
            }, { passive: true });

            link.addEventListener('mouseleave', () => {
                gsap.to(link, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
            });
        });
    }
}

// ========================================================
// 2. APPLICATION PRINCIPALE (Animations, Scroll, Nav)
// ========================================================

function runApp() {
    const isMobile = window.matchMedia("(max-width: 1024px)").matches;
    const isProjectPage = document.body.classList.contains('project-page');

    // --- LENIS SCROLL ---
    let lenis;
    if (!isMobile && typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true
        });
        window.lenis = lenis;

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }

    // --- INITIALISATION VISUELLE ---
    // Fixe la nav (Vertical & Opacité gérés par JS, Horizontal par CSS margin:auto)
    gsap.set(".desktop-nav", { yPercent: 0, autoAlpha: 1 });
    gsap.set(".scroll-indicator", { y: 0, autoAlpha: 0.7 });

    // --- ANIMATIONS GLOBALES ---
    initScrollLines();
    initStatsCounters();
    initMarquee();
    initScrollHideNav();
    initScrollReveals(); // <--- NOUVEAU : Active les animations d'apparition au scroll

    // --- SCROLL SPY (toutes les pages) ---
    initScrollSpy();

    // --- SMOOTH SCROLL pour les liens avec ancre ---
    document.querySelectorAll('a[href*="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            const hash = href.includes('#') ? '#' + href.split('#')[1] : null;
            if (!hash) return;
            const target = document.querySelector(hash);
            if (!target) return;
            e.preventDefault();
            if (window.lenis) {
                window.lenis.scrollTo(target, { offset: 0, duration: 1.2 });
            } else {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- ANIMATIONS PAGE D'ACCUEIL ---
    if (!isProjectPage) {
        initHomeBlobs();
        playHomeHeroAnimations();
    }
}

// ========================================================
// 3. SOUS-FONCTIONS D'ANIMATION
// ========================================================

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

function initStatsCounters() {
    const counters = gsap.utils.toArray(".counter");
    counters.forEach(counter => {
        const target = counter.getAttribute("data-target");
        gsap.to(counter, {
            innerText: target, duration: 2, snap: { innerText: 1 },
            scrollTrigger: { trigger: ".stats-grid", start: "top 85%" },
            onUpdate: function () { counter.innerText = Math.ceil(counter.innerText) + "+"; }
        });
    });
}

function initMarquee() {
    gsap.set(".marquee-wrapper", { xPercent: 0 });
    gsap.to(".marquee-wrapper", {
        xPercent: -50, repeat: -1, duration: 35, ease: "none"
    });
}

function playHomeHeroAnimations() {
    if (!document.querySelector('.hero')) return;
    const tl = gsap.timeline();

    // Animation d'entrée de la nav (uniquement axe Y)
    tl.fromTo(".desktop-nav", 
        { yPercent: -200, autoAlpha: 0 }, 
        { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: "power4.out" }
    );

    const h1 = document.querySelector("h1.reveal-text");
    if (h1) tl.fromTo(h1, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05, ease: "power4.out" }, "-=0.7");

    const sub = document.querySelector(".hero-subtitle");
    if (sub) tl.fromTo(sub, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.5");

    const scrollInd = document.querySelector(".scroll-indicator");
    if (scrollInd) gsap.fromTo(scrollInd, { y: -10, autoAlpha: 0 }, { y: 0, autoAlpha: 0.7, duration: 0.5, ease: "power2.out", delay: 0.3 });
}

function initHomeBlobs() {
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
        }, { passive: true });
    }
}

function initScrollSpy() {
    const sectionElements = document.querySelectorAll('section[id]');
    const contactEl = document.getElementById('contact');
    const sections = [...sectionElements];
    if (contactEl && !contactEl.matches('section')) sections.push(contactEl);
    const navBackdrop = document.querySelector('.nav-backdrop');
    const navItems = document.querySelectorAll('.nav-item');

    if (!navBackdrop || sections.length === 0) return;

   let currentActiveId = null;

   const updateNav = (id) => {
    currentActiveId = id;
    const activeLink = document.querySelector(`.nav-item[href*="#${id}"]`);
    
    if (activeLink) {
        // Reset des styles
        navItems.forEach(el => el.style.color = "");
        
        // Style du lien actif
        activeLink.style.color = "white";

        // Calcul du Backdrop (Identique pour tous les liens)
        const width = activeLink.offsetWidth;
        const left = activeLink.offsetLeft;
        
        navBackdrop.style.width = `${width}px`;
        navBackdrop.style.left = `${left}px`;
        navBackdrop.style.opacity = "1"; // On force la visibilité

        // Distinction de couleur uniquement
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
            start: section.id === 'contact' ? "top 90%" : "top center",
            end: "bottom center",
            onEnter: () => updateNav(section.id),
            onEnterBack: () => updateNav(section.id)
        });
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const href = item.getAttribute('href') || '';
            const match = href.match(/#([^/]+)$/);
            if (match) updateNav(match[1]);
        });
    });

    // Sur les pages projet, activer "Projets" par défaut
    if (document.body.classList.contains('project-page')) {
        updateNav('projets');
    }

    // Recalculer la position du backdrop au resize
    window.addEventListener('resize', () => {
        if (currentActiveId) updateNav(currentActiveId);
    });
}

function initScrollHideNav() {
    // On vérifie que la nav existe
    const nav = document.querySelector('.desktop-nav');
    if (!nav) return;

    // Flag pour ignorer le masquage après un clic nav
    let navClickLock = false;
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navClickLock = true;
            gsap.to(nav, { yPercent: 0, autoAlpha: 1, duration: 0.3, overwrite: true });
            setTimeout(() => { navClickLock = false; }, 1200);
        });
    });

    // ScrollTrigger.matchMedia gère automatiquement l'activation/désactivation
    // selon la taille de l'écran (ici max 768px)
    ScrollTrigger.matchMedia({
        "(max-width: 768px)": function() {

            let lastScrollY = 0;

            // On crée le trigger
            ScrollTrigger.create({
                trigger: 'body',
                start: "top top",
                end: "bottom bottom",
                onUpdate: (self) => {
                    if (navClickLock) return;
                    const scrollY = self.scroll();

                    // Ignorer les micro-mouvements (barre d'URL mobile)
                    if (Math.abs(scrollY - lastScrollY) < 8) return;
                    lastScrollY = scrollY;

                    // Sécurité : tout en haut, on affiche toujours
                    if (scrollY < 50) {
                        gsap.to(nav, { yPercent: 0, autoAlpha: 1, duration: 0.3, overwrite: true });
                        return;
                    }

                    // Direction : 1 = descend, -1 = monte
                    if (self.direction === 1) {
                        // ON DESCEND : On cache (vers le haut -150% et opacité réduite)
                        gsap.to(nav, { yPercent: -150, autoAlpha: 0, duration: 0.3, ease: "power2.out", overwrite: true });
                    } else {
                        // ON MONTE : On affiche
                        gsap.to(nav, { yPercent: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out", overwrite: true });
                    }
                }
            });

            // Nettoyage automatique quand on repasse sur Desktop
            return () => {
                gsap.set(nav, { yPercent: 0, autoAlpha: 1 });
            };
        }
    });

    // Sécurité : forcer la visibilité au resize (uniquement si la largeur change)
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        if (window.innerWidth === lastWidth) return; // Ignorer les changements de hauteur seule (barre d'URL mobile)
        lastWidth = window.innerWidth;
        if (window.innerWidth > 768) {
            gsap.set(nav, { yPercent: 0, autoAlpha: 1, clearProps: "visibility,opacity" });
        }
    });
}

// --- NOUVELLE FONCTION AJOUTÉE ---
function initScrollReveals() {
    const isProjectPage = document.body.classList.contains('project-page');

    // 1. ÉLÉMENTS SIMPLES (Titre, Texte, Image seule)
    const simpleReveals = document.querySelectorAll(".reveal");

    simpleReveals.forEach((element) => {
        // Sur les pages projet, ignorer les éléments déjà animés par script-projet.js
        if (isProjectPage && (
            element.closest('.project-hero') ||
            element.closest('.context-section') ||
            element.closest('.scroll-images')
        )) return;

        gsap.fromTo(element,
            { y: 50, autoAlpha: 0 },
            {
                y: 0,
                autoAlpha: 1,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: element,
                    start: "top 85%",
                }
            }
        );
    });

    // 2. GROUPES EN CASCADE (Grilles, Listes, Bento)
    const groupReveals = document.querySelectorAll(".reveal-group");

    groupReveals.forEach((group) => {
        // Sur les pages projet, ignorer les groupes du hero (gérés par la timeline)
        if (isProjectPage && group.closest('.project-hero')) return;

        const items = group.querySelectorAll(".reveal-item");

        if (items.length > 0) {
            gsap.fromTo(items,
                { y: 30, autoAlpha: 0 },
                {
                    y: 0,
                    autoAlpha: 1,
                    duration: 0.8,
                    ease: "power2.out",
                    stagger: 0.1,
                    scrollTrigger: {
                        trigger: group,
                        start: "top 80%"
                    }
                }
            );
        }
    });
}