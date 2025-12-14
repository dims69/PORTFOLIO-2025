document.addEventListener("DOMContentLoaded", () => {
    
    // Sécurité : on vérifie qu'on est sur la page projet
    if (!document.body.classList.contains('project-page')) return;

    gsap.registerPlugin(ScrollTrigger);

    window.addEventListener("load", () => {
        
        initAnimations();

        // --- GESTION DU RESPONSIVE GSAP (Stable) ---
        let mm = gsap.matchMedia();

        // Active le sticky SEULEMENT sur Desktop (> 1024px)
        mm.add("(min-width: 1025px)", () => {
            
            ScrollTrigger.create({
                trigger: ".sticky-container",
                start: "top 15%",
                end: "bottom bottom",
                pin: ".sticky-content",
                pinSpacing: false,
                invalidateOnRefresh: true,
            });

        });
        
        ScrollTrigger.refresh(); 
    });

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