/* Alexia Monroy — motion layer (GSAP + ScrollTrigger + SplitText)
   Patterns from the ui-ux-pro-max GSAP library: masked line reveal for headlines,
   clip reveal + subtle parallax for project media, magnetic focal buttons,
   count-up figures and a choreographed case-study entrance.
   Everything runs only with prefers-reduced-motion: no-preference; without GSAP
   the page stays fully readable (nothing is hidden by default). */
(() => {
  const { gsap, ScrollTrigger, SplitText } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger, ...(SplitText ? [SplitText] : []));

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const EASE = 'expo.out';

  // keep ScrollTrigger in sync with Lenis smooth scroll
  if (window.__lenis) window.__lenis.on('scroll', ScrollTrigger.update);

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    /* 1 · Headlines: masked line reveal ------------------------------------- */
    const splitReveal = (el, vars = {}) => {
      if (!SplitText) return gsap.from(el, { opacity: 0, y: 24, duration: 0.9, ease: EASE, ...vars });
      return SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.1, stagger: 0.09, ease: EASE, ...vars }),
      });
    };
    $$('.section-head h2, .contact__title').forEach((el) => {
      splitReveal(el, { scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });

    /* 2 · Hero: content drifts and fades as you scroll away ----------------- */
    const hero = $('.hero');
    if (hero) {
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } })
        .to('.hero__title', { yPercent: -18, opacity: 0.25, ease: 'none' }, 0)
        .to('.hero__bottom', { y: -40, opacity: 0, ease: 'none' }, 0)
        .to(hero, { '--hy': '18%', ease: 'none' }, 0);
    }

    /* 3 · Project cards: clip reveal + inner parallax ----------------------- */
    $$('.card__media').forEach((media) => {
      gsap.fromTo(media,
        { clipPath: 'inset(14% 6% 0% 6% round 18px)', '--es': 1.18 },
        { clipPath: 'inset(0% 0% 0% 0% round 18px)', '--es': 1, duration: 1.4, ease: EASE,
          scrollTrigger: { trigger: media, start: 'top 88%', once: true } });
      gsap.fromTo(media, { '--py': '-4%' }, {
        '--py': '4%', ease: 'none',
        scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    // re-measure after filtering re-flows the grid
    document.addEventListener('grid:filtered', () => ScrollTrigger.refresh());

    /* 4 · About: avatar parallax and count-up figures ---------------------- */
    const aboutCard = $('.about__visual');
    if (aboutCard) {
      gsap.fromTo(aboutCard, { '--ay': '12%' }, {
        '--ay': '-6%', ease: 'none',
        scrollTrigger: { trigger: aboutCard, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
    $$('.facts dd').forEach((dd) => {
      const target = parseInt(dd.textContent, 10);
      if (!/^\d+$/.test(dd.textContent.trim())) return; // C1, 3er stay static
      const pad = dd.textContent.trim().length;
      const n = { v: 0 };
      gsap.to(n, {
        v: target, duration: 1.4, ease: 'power3.out',
        onUpdate: () => { dd.textContent = String(Math.round(n.v)).padStart(pad, '0'); },
        scrollTrigger: { trigger: dd, start: 'top 90%', once: true },
      });
    });

    /* 5 · Services: rows sweep in from the left, staggered ------------------ */
    const services = $$('.service');
    if (services.length) {
      services.forEach((s) => s.removeAttribute('data-reveal'));
      gsap.from(services, {
        x: -40, opacity: 0, duration: 1, stagger: 0.1, ease: EASE,
        scrollTrigger: { trigger: services[0].parentElement, start: 'top 80%', once: true },
      });
    }

    /* 6 · Magnetic focal buttons (max 3, pointer: fine only) --------------- */
    if (matchMedia('(pointer: fine)').matches) {
      $$('.nav__cta, .hero__scroll span, .form .btn').forEach((el) => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
        const move = (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.3);
          yTo((e.clientY - r.top - r.height / 2) * 0.3);
        };
        const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', leave);
      });
    }

    /* 7 · Case study entrance (fired by main.js when a dialog opens) ------- */
    const onCase = (e) => {
      const dlg = e.detail;
      const head = $('.case__head', dlg);
      const title = $('h2', head);
      const tl = gsap.timeline({ delay: 0.3 });
      // split each case title once, replay its lines on every open
      if (SplitText) {
        title._split ||= SplitText.create(title, { type: 'lines', mask: 'lines' });
        tl.from(title._split.lines, { yPercent: 110, duration: 1.1, stagger: 0.09, ease: EASE }, 0);
      } else {
        tl.from(title, { opacity: 0, y: 24, duration: 0.9, ease: EASE }, 0);
      }
      tl.from($('.eyebrow', head), { opacity: 0, y: 12, duration: 0.6, ease: EASE }, 0)
        .from($('.case__lede', head), { opacity: 0, y: 16, duration: 0.8, ease: EASE }, 0.15)
        .from($$('.case__facts > div', head), { opacity: 0, y: 14, duration: 0.7, stagger: 0.06, ease: EASE }, 0.25);
      const cover = $('.case__cover', dlg);
      if (cover) tl.fromTo(cover, { clipPath: 'inset(10% 4% 0% 4% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.2, ease: EASE }, 0.3);
      // galleries reveal as they scroll into view inside the dialog
      const scroller = $('.case__scroll', dlg);
      $$('.gallery figure', dlg).forEach((fig) => {
        if (fig.dataset.animated) return;
        fig.dataset.animated = '1';
        gsap.from(fig, { opacity: 0, y: 30, duration: 0.9, ease: EASE,
          scrollTrigger: { trigger: fig, scroller, start: 'top 92%', once: true } });
      });
    };
    document.addEventListener('case:open', onCase);

    return () => document.removeEventListener('case:open', onCase);
  });

  // fonts and the intro curtain change layout: re-measure once both settle
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 1200));
})();
