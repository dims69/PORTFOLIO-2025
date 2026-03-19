// ========================================================
// 0. CONFIGURATION & CHARGEMENT
// ========================================================

// Appliquer le thème sauvegardé immédiatement (avant le rendu)
(function() {
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

// Redirection automatique vers /en/ si navigateur non-francophone
// (sauf si le visiteur a déjà choisi manuellement sa langue)
(function() {
    try {
        const langChoice = localStorage.getItem('langChoice');
        if (langChoice) return; // Choix manuel déjà fait, ne pas rediriger

        const isOnFrench = !window.location.pathname.includes('/en/');
        if (!isOnFrench) return; // Déjà sur la version EN

        const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (browserLang.startsWith('fr')) return; // Navigateur francophone, rester sur FR

        // Rediriger vers la page EN équivalente
        const path = window.location.pathname;
        const page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        window.location.replace('en/' + page);
    } catch (e) { /* localStorage bloqué */ }
})();

// Marquer la session dès qu'une page sans preloader est visitée
// → au retour sur l'accueil le preloader ne se rejouera pas
(function() {
    try {
        if (!document.getElementById('preloader')) {
            sessionStorage.setItem('preloaderSeen', 'true');
        }
    } catch (e) {}
})();

gsap.registerPlugin(ScrollTrigger);

// Empêcher ScrollTrigger de recalculer quand seule la hauteur change (barre d'URL mobile)
ScrollTrigger.config({ ignoreMobileResize: true });

document.addEventListener("DOMContentLoaded", () => {
    loadComponents();
});

function loadComponents() {
    // 0. Preloader — démarrer immédiatement (en parallèle des fetches, pas après)
    const preloaderReady = startPreloaderIfNeeded();

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

    // 3. Lancer le site une fois tout chargé (composants + preloader)
    Promise.allSettled([headerLoad, footerLoad, preloaderReady]).then(() => {
        initThemeToggle();
        initScrollToTop();
        initBentoFilters();
        runApp();
        initTouchPrefetch();
        ScrollTrigger.refresh();
        window.dispatchEvent(new Event('appReady'));
    });
}

// Flag global — le preloader a-t-il joué lors de ce chargement ?
let _preloaderWasPlayed = false;

function startPreloaderIfNeeded() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return Promise.resolve();

    let preloaderSeen = false;
    try { preloaderSeen = sessionStorage.getItem('preloaderSeen'); } catch (e) {}

    if (preloaderSeen) {
        preloader.remove();
        return Promise.resolve();
    }

    // Première visite : bloquer le scroll et jouer l'animation
    _preloaderWasPlayed = true;
    document.body.classList.add('no-scroll');
    return new Promise(resolve => {
        playPreloader(() => {
            document.body.classList.remove('no-scroll');
            resolve();
        });
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
        } else if (!nowMobile && !window.lenis && typeof Lenis !== 'undefined') {
            // Retour desktop : recréer Lenis
            const newLenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smooth: true
            });
            window.lenis = newLenis;
            newLenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => newLenis.raf(time * 1000));
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
    initBurgerMenu();
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
        // Le preloader est géré dans startPreloaderIfNeeded() (lancé en parallèle des fetches)
        playHomeHeroAnimations(_preloaderWasPlayed);
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

    const done = () => {
        try { sessionStorage.setItem('preloaderSeen', 'true'); } catch (e) { /* Storage bloqué */ }
        preloader.remove();
        if (onComplete) onComplete();
    };

    // Même animation partout (desktop + mobile)
    // On attend 2 frames pour que le layout initial soit terminé (crucial sur iOS 120Hz)
    requestAnimationFrame(() => { requestAnimationFrame(() => {
        const tl = gsap.timeline({ onComplete: done });

        tl.to(letters, {
            backgroundPosition: "0 -200%",
            duration: 1,
            ease: "power2.out",
            stagger: { each: 0.07, from: "start" },
            force3D: true
        }, 0.2);

        tl.to({}, { duration: 0.2 });

        tl.to(inner, {
            scale: 1.2,
            autoAlpha: 0,
            duration: 0.5,
            ease: "power3.in",
            force3D: true
        });

        tl.to(preloader, {
            autoAlpha: 0,
            duration: 0.4,
            ease: "power2.inOut"
        });
    }); });
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

    // Note : pas de réduction du menu au scroll sur mobile — le nom reste toujours visible

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

// ========================================================
// BURGER MENU (Mobile & Tablette)
// ========================================================

function initBurgerMenu() {
    if (window.innerWidth > 768) return;

    const burger = document.querySelector('.burger-btn');
    if (!burger) return;

    // Déterminer si on est sur la version EN
    const isEN = window.location.pathname.includes('/en/');

    // Créer l'overlay dynamiquement (supprime l'ancien s'il existait en dur)
    const existing = document.querySelector('.mobile-menu-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';

    // Liens — toujours pointer vers index.html avec ancre
    const base = isEN ? 'index.html' : 'index.html';
    const links = isEN
        ? [
            { label: 'Projects', href: base + '#projects' },
            { label: 'About', href: base + '#about' },
            { label: 'Contact', href: base + '#contact' }
          ]
        : [
            { label: 'Projets', href: base + '#projets' },
            { label: 'Infos', href: base + '#infos' },
            { label: 'Contact', href: base + '#contact' }
          ];

    const nav = document.createElement('nav');
    nav.className = 'mobile-nav-links';

    links.forEach(link => {
        const a = document.createElement('a');
        a.className = 'mobile-link';
        a.href = link.href;
        a.textContent = link.label;
        nav.appendChild(a);
    });

    overlay.appendChild(nav);

    // Footer de l'overlay : LinkedIn (icône) + theme toggle
    const footer = document.createElement('div');
    footer.className = 'mobile-menu-footer';

    const linkedin = document.createElement('a');
    linkedin.href = 'https://www.linkedin.com/in/olivier-pouchoy/';
    linkedin.target = '_blank';
    linkedin.rel = 'noopener noreferrer';
    linkedin.className = 'mobile-menu-icon-btn';
    linkedin.setAttribute('aria-label', 'LinkedIn');
    linkedin.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';
    footer.appendChild(linkedin);

    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) {
        const clone = themeBtn.cloneNode(true);
        clone.className = 'mobile-menu-icon-btn';
        clone.addEventListener('click', () => {
            themeBtn.click();
        });
        footer.appendChild(clone);
    }
    overlay.appendChild(footer);

    document.body.appendChild(overlay);

    // Animation
    let isOpen = false;
    const mobileLinks = overlay.querySelectorAll('.mobile-link');

    function openMenu() {
        isOpen = true;
        burger.classList.add('active');
        overlay.classList.add('active');

        // Bloquer le scroll
        document.body.classList.add('no-scroll');
        if (window.lenis) window.lenis.stop();

        const tl = gsap.timeline();
        tl.to(overlay, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
        tl.fromTo(mobileLinks, { autoAlpha: 0, y: 20 }, {
            autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out",
            stagger: 0.07, force3D: true
        }, "-=0.1");
        tl.to(footer, { autoAlpha: 1, duration: 0.3, force3D: true }, "-=0.2");
    }

    function closeMenu() {
        isOpen = false;
        burger.classList.remove('active');
        overlay.classList.remove('active');

        gsap.to(overlay, {
            autoAlpha: 0, duration: 0.25, ease: "power2.in",
            onComplete: () => {
                gsap.set(mobileLinks, { autoAlpha: 0, y: 20 });
                gsap.set(footer, { autoAlpha: 0 });
            }
        });

        // Débloquer le scroll
        document.body.classList.remove('no-scroll');
        if (window.lenis) window.lenis.start();
    }

    burger.addEventListener('click', () => {
        if (isOpen) closeMenu();
        else openMenu();
    });

    // Fermer au clic sur un lien
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => closeMenu());
    });

    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) closeMenu();
    });
}

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
            const current = this.dataset.active;
            const next = current === 'fr' ? 'en' : 'fr';

            // Calculer l'URL équivalente dans l'autre langue
            const path = window.location.pathname;
            const page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
            let target;

            if (current === 'fr') {
                // FR → EN : ajouter /en/ devant le fichier
                target = 'en/' + page;
            } else {
                // EN → FR : remonter d'un niveau
                target = '../' + page;
            }

            // Basculer l'état visuel
            this.dataset.active = next;
            this.querySelectorAll('.lang-pill-label').forEach(label => {
                label.classList.toggle('active');
            });

            // Mémoriser le choix manuel pour ne plus rediriger automatiquement
            try { localStorage.setItem('langChoice', next); } catch (e) {}

            // Naviguer après l'animation
            setTimeout(() => {
                window.location.href = target;
            }, 350);
        });
    });
}

// ========================================================
// 5. PREFETCH AU TOUCH (Safari iOS)
// ========================================================
// Safari ne fait pas de prefetch natif — on pré-charge la page
// dès que le doigt touche le lien (avant le click)

function initTouchPrefetch() {
    const prefetched = new Set();

    document.addEventListener('touchstart', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        // Ignorer les ancres, liens externes et déjà prefetchés
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || prefetched.has(href)) return;

        prefetched.add(href);
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = href;
        document.head.appendChild(prefetchLink);
    }, { passive: true });
}