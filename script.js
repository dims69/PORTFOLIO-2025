// ========================================================
// 0. CONFIGURATION & CHARGEMENT
// ========================================================

// Appliquer le thème sauvegardé immédiatement (avant le rendu)
(function() {
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

gsap.registerPlugin(ScrollTrigger);

// Empêcher ScrollTrigger de recalculer quand seule la hauteur change (barre d'URL mobile)
ScrollTrigger.config({ ignoreMobileResize: true });

document.addEventListener("DOMContentLoaded", () => {
    loadComponents();
});

function loadComponents() {
    // 1. Charger le Header — rendre la nav visible immédiatement après injection
    const headerLoad = fetch('header.html')
        .then(res => { if (!res.ok) throw new Error("Header introuvable"); return res.text(); })
        .then(html => {
            const placeholder = document.getElementById('header-placeholder');
            if (placeholder) {
                placeholder.innerHTML = html;
                // Nav visible dès l'injection, sans attendre runApp()
                const nav = document.querySelector('.desktop-nav');
                if (nav) { nav.style.opacity = '1'; nav.style.visibility = 'visible'; }
            }
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
        initThemeToggle();
        initScrollToTop();
        initBentoFilters();
        runApp();
        ScrollTrigger.refresh();
        window.dispatchEvent(new Event('appReady'));
    });
}

// ========================================================
// 0.5. THEME TOGGLE
// ========================================================

function initThemeToggle() {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            if (next === 'dark') {
                document.documentElement.removeAttribute('data-theme');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }
            localStorage.setItem('theme', next === 'dark' ? '' : 'light');
            // Recalculer la couleur du nav item actif
            if (window._getCurrentActiveId && window._updateNav) {
                window._updateNav(window._getCurrentActiveId());
            }
        });
    });
}

// ========================================================
// 0.6. SCROLL TO TOP
// ========================================================

function initScrollToTop() {
    const btn = document.querySelector('.scroll-top-btn');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        if (window.lenis) {
            window.lenis.scrollTo(0);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

// ========================================================
// 0.7. BENTO FILTERS
// ========================================================

function initBentoFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.bento-card[data-category]');
    if (!buttons.length || !cards.length) return;

    const grid = document.querySelector('.bento-grid');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            // Update active button
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle filtered mode on grid
            grid.classList.toggle('bento-filtered', filter !== 'all');

            // Filter cards
            cards.forEach(card => {
                const match = filter === 'all' || card.dataset.category === filter;
                if (match) {
                    card.classList.remove('filter-hidden');
                    card.classList.add('filter-fade-in');
                    card.addEventListener('animationend', () => {
                        card.classList.remove('filter-fade-in');
                    }, { once: true });
                } else {
                    card.classList.add('filter-hidden');
                    card.classList.remove('filter-fade-in');
                }
            });

            // Refresh ScrollTrigger after layout change
            ScrollTrigger.refresh();
        });
    });
}

// ========================================================
// 1. FONCTIONS DU FOOTER
// ========================================================

function initFooterInteractions() {
    // Année dynamique
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Formulaire de contact Netlify
    const form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="arrow">⏳</span>';

            fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(new FormData(form)).toString()
            })
            .then(res => {
                if (res.ok) {
                    btn.innerHTML = '✓ Envoyé';
                    btn.classList.add('form-success');
                    form.reset();
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.classList.remove('form-success');
                        btn.disabled = false;
                    }, 3000);
                } else {
                    throw new Error('Erreur');
                }
            })
            .catch(() => {
                btn.innerHTML = 'Erreur, réessayez';
                btn.disabled = false;
                setTimeout(() => { btn.innerHTML = originalText; }, 3000);
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

    // Sécurité : nettoyer tout blocage de scroll résiduel
    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('lenis-stopped');
    document.body.style.overflow = '';
    document.body.style.overflowX = '';
    document.body.style.overflowY = '';
    document.documentElement.style.overflow = '';
    document.documentElement.style.overflowX = '';
    document.documentElement.style.overflowY = '';

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
    } else {
        // Sur mobile : s'assurer que Lenis n'a pas ajouté de classes résiduelles
        document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
        window.lenis = null;
    }

    // --- SÉCURITÉ RESIZE : détruire Lenis si passage en mobile ---
    let lastWidthCheck = window.innerWidth;
    window.addEventListener('resize', () => {
        if (window.innerWidth === lastWidthCheck) return;
        lastWidthCheck = window.innerWidth;

        const nowMobile = window.innerWidth <= 1024;
        if (nowMobile && window.lenis) {
            window.lenis.destroy();
            window.lenis = null;
            document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
            document.documentElement.style.overflow = '';
            document.documentElement.style.overflowX = '';
            document.documentElement.style.overflowY = '';
            document.body.style.overflow = '';
            document.body.style.overflowX = '';
            document.body.style.overflowY = '';
        }
    });

    // --- INITIALISATION VISUELLE ---
    // Fixe la nav (Vertical & Opacité gérés par JS, Horizontal par CSS margin:auto)
    gsap.set(".desktop-nav", { yPercent: 0, autoAlpha: 1 });
    gsap.set(".scroll-indicator", { y: 0, autoAlpha: 0.7 });

    // --- ANIMATIONS GLOBALES ---
    if (!isMobile) {
        initScrollLines(); // SVG path animation — skip on mobile (element hidden anyway)
        initMarquee();     // GSAP marquee — skip on mobile (CSS animation used instead)
    }
    initStatsCounters();
    initScrollHideNav();
    initScrollReveals();
    initLangPill();

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
        if (!isMobile) initHomeBlobs(); // mousemove tracking inutile sur mobile
        const preloader = document.getElementById('preloader');
        let preloaderSeen = false;
        try { preloaderSeen = sessionStorage.getItem('preloaderSeen'); } catch (e) { /* Storage bloqué (nav privée / tracking prevention) */ }

        if (isMobile || preloaderSeen) {
            // Mobile ou visite suivante : supprimer le preloader et afficher directement
            if (preloader) preloader.remove();
            playHomeHeroAnimations();
        } else if (preloader) {
            // Desktop, première visite : lancer le preloader puis le hero
            document.body.classList.add('no-scroll');
            playPreloader(() => {
                document.body.classList.remove('no-scroll');
                playHomeHeroAnimations(true);
            });
        } else {
            playHomeHeroAnimations();
        }
    }
}

// ========================================================
// 2.5 PRELOADER
// ========================================================

function playPreloader(onComplete) {
    const preloader = document.getElementById('preloader');
    const letters = document.querySelectorAll('.preloader-letter');
    const inner = document.querySelector('.preloader-inner');

    if (!preloader) { onComplete(); return; }

    const tl = gsap.timeline({
        onComplete: () => {
            try { sessionStorage.setItem('preloaderSeen', 'true'); } catch (e) { /* Storage bloqué */ }
            preloader.remove();
            if (onComplete) onComplete();
        }
    });

    // Phase 1 : Le fluide remplit chaque lettre du bas vers le haut
    // background-position: 0 0 = invisible (haut du gradient = quasi transparent)
    // background-position: 0 -200% = rempli (bas du gradient = blanc)
    tl.to(letters, {
        backgroundPosition: "0 -200%",
        duration: 1,
        ease: "power2.out",
        stagger: {
            each: 0.07,
            from: "start"
        }
    }, 0.2);

    // Phase 2 : Pause pour apprécier le résultat
    tl.to({}, { duration: 0.6 });

    // Phase 3 : Exit — le texte scale up et fade, puis le fond disparaît
    tl.to(inner, {
        scale: 1.2,
        autoAlpha: 0,
        duration: 0.5,
        ease: "power3.in"
    });

    tl.to(preloader, {
        autoAlpha: 0,
        duration: 0.4,
        ease: "power2.inOut"
    });
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
    gsap.set(".marquee-primary", { xPercent: 0 });
    gsap.to(".marquee-primary", {
        xPercent: -50, repeat: -1, duration: 60, ease: "none"
    });

    gsap.set(".marquee-secondary", { xPercent: -50 });
    gsap.to(".marquee-secondary", {
        xPercent: 0, repeat: -1, duration: 70, ease: "none"
    });
}

function playHomeHeroAnimations(skipNavAndTitle) {
    if (!document.querySelector('.hero')) return;
    const isMobileHero = window.innerWidth <= 768;

    // Sur mobile ou après preloader : tout visible immédiatement, pas d'animation
    if (isMobileHero || skipNavAndTitle) {
        gsap.set(".desktop-nav", { yPercent: 0, autoAlpha: 1 });
        document.querySelectorAll("h1.reveal-text").forEach(el => gsap.set(el, { y: 0, autoAlpha: 1 }));
        const sub = document.querySelector(".hero-subtitle");
        if (sub) gsap.set(sub, { y: 0, autoAlpha: 1 });
        const scrollInd = document.querySelector(".scroll-indicator");
        if (scrollInd) gsap.set(scrollInd, { y: 0, autoAlpha: 0.7 });
        return;
    }

    // Desktop sans preloader : animation complète
    const tl = gsap.timeline();

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

   // Exposer updateNav pour le recalcul depuis d'autres fonctions
   window._updateNav = (id) => updateNav(id);
   window._getCurrentActiveId = () => currentActiveId;

   const updateNav = (id) => {
    currentActiveId = id;
    const activeLink = document.querySelector(`.nav-item[href*="#${id}"]`);

    // Reset : tous les liens en couleur muted
    navItems.forEach(el => el.style.color = "");

    if (activeLink) {
        activeLink.style.color = document.documentElement.getAttribute('data-theme') === 'light' ? 'var(--text-main)' : 'white';
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

                    // Tout en haut : header complet avec le nom
                    if (scrollY < 50) {
                        if (nav.classList.contains('nav-scrolled')) {
                            nav.classList.remove('nav-scrolled');

                        }
                        return;
                    }

                    // Au scroll : passer en mode compact (cacher le nom, garder les liens)
                    if (!nav.classList.contains('nav-scrolled')) {
                        nav.classList.add('nav-scrolled');
                        recalcBackdrop();
                    }
                }
            });

            // Nettoyage automatique quand on repasse sur Desktop
            return () => {
                nav.classList.remove('nav-scrolled');
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
    const isMobile = window.innerWidth <= 768;

    // Sur mobile, rendre tout visible immédiatement sans animation
    if (isMobile) {
        document.querySelectorAll(".reveal, .reveal-item").forEach(el => {
            gsap.set(el, { autoAlpha: 1, y: 0 });
        });
        return;
    }

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

// ========================================================
// LANG PILL — Animation du toggle avant navigation
// ========================================================
function initLangPill() {
    document.querySelectorAll('.lang-pill').forEach(pill => {
        pill.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const current = this.dataset.active;
            const next = current === 'fr' ? 'en' : 'fr';

            // Basculer l'état visuel
            this.dataset.active = next;
            this.querySelectorAll('.lang-pill-label').forEach(label => {
                label.classList.toggle('active');
            });

            // Naviguer après l'animation
            setTimeout(() => {
                window.location.href = href;
            }, 350);
        });
    });
}