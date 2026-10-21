/* Alexia Monroy — Portafolio 2026 */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Smooth scroll ---------------------------------------------------------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis; // shared with motion.js (ScrollTrigger sync)
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const navOffset = () => -($('[data-nav]')?.offsetHeight || 0);
  const scrollToEl = (el) => {
    if (lenis) lenis.scrollTo(el, { offset: el.id === 'top' ? 0 : navOffset() });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };

  /* Loader ----------------------------------------------------------------- */
  const loader = $('.loader');
  let loadDone = false;
  const finishLoad = () => {
    if (loadDone) return;
    loadDone = true;
    loader?.classList.add('is-done');
    root.classList.add('is-loaded');
    setTimeout(() => loader?.remove(), 1000);
  };
  if (reduced || !loader || root.classList.contains('no-intro')) {
    finishLoad();
  } else {
    try { sessionStorage.setItem('am-intro', '1'); } catch {}
    // "alexia_monroy" typed letter by letter; the underscore takes the accent colour
    const out = $('[data-loader-text]', loader);
    const word = 'alexia_monroy';
    let i = 0;
    const type = () => {
      const ch = word[i++];
      out.insertAdjacentHTML('beforeend', ch === '_' ? '<span class="us">_</span>' : ch);
      if (i < word.length) setTimeout(type, ch === '_' ? 180 : 55);
      else setTimeout(finishLoad, 380);
    };
    setTimeout(type, 200);
    setTimeout(finishLoad, 2600); // safety net if timers are throttled
  }

  /* Navigation ------------------------------------------------------------- */
  const nav = $('[data-nav]');
  const hero = $('.hero');
  const toggle = $('.nav__toggle');
  const menu = $('#menu');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    const pastHero = y > (hero?.offsetHeight || 600) - 80;
    nav.classList.toggle('is-solid', pastHero);
    nav.classList.toggle('is-hidden', pastHero && y > lastY + 4 && !menu.classList.contains('is-open'));
    if (y < lastY - 4 || !pastHero) nav.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    toggle.textContent = open ? 'Cerrar' : 'Menú';
    // keep keyboard and screen-reader focus inside the open menu
    ['#main', '#contacto'].forEach((s) => { const el = $(s); if (el) el.inert = open; });
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });

  // In-page anchors (excluding case links, handled below)
  $$('a[href^="#"]:not([data-case])').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = id && document.getElementById(id);
      if (!target || target.tagName === 'DIALOG') return;
      e.preventDefault();
      if (menu.classList.contains('is-open')) setMenu(false);
      scrollToEl(target);
      history.replaceState(null, '', id === 'top' ? location.pathname : `#${id}`);
      if (id === 'main' || id === 'top') return;
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  // Active section in nav
  const links = $$('.nav__menu a');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.setAttribute('aria-current', String(l.getAttribute('href') === `#${en.target.id}`)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['proyectos', 'sobre-mi', 'servicios', 'contacto'].forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });

  /* Typed specialities ----------------------------------------------------- */
  const typed = $('[data-typed]');
  let heroVisible = true;
  if (hero) new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; }).observe(hero);
  if (typed && !reduced) {
    const words = typed.dataset.words.split('|');
    let w = 0, i = words[0].length, deleting = true;
    const step = () => {
      if (!heroVisible) return setTimeout(step, 600); // idle while off screen
      const word = words[w];
      if (deleting) {
        i--;
        if (i === 0) { deleting = false; w = (w + 1) % words.length; }
      } else {
        i++;
        if (i === words[w].length) { deleting = true; typed.textContent = words[w]; return setTimeout(step, 2000); }
      }
      typed.textContent = (deleting ? word : words[w]).slice(0, i);
      setTimeout(step, deleting ? 45 : 85);
    };
    setTimeout(step, 2600);
  }

  /* Hero avatar parallax --------------------------------------------------- */
  const avatar = $('[data-parallax]');
  if (avatar && finePointer && !reduced) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      avatar.style.setProperty('--mx', `${x * -24}px`);
      avatar.style.setProperty('--my', `${y * -14}px`);
    });
  }

  /* Client marquee: pause control + pause off screen ------------------------ */
  const marquee = $('.marquee');
  const mToggle = $('[data-marquee-toggle]');
  if (marquee && mToggle) {
    mToggle.addEventListener('click', () => {
      const paused = marquee.classList.toggle('is-paused');
      mToggle.setAttribute('aria-pressed', String(paused));
      mToggle.textContent = paused ? 'Reanudar' : 'Pausar';
    });
    new IntersectionObserver(([en]) => marquee.classList.toggle('is-offscreen', !en.isIntersecting)).observe(marquee);
  }

  /* Reveal on scroll ------------------------------------------------------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('[data-reveal]').forEach((el) => revealIO.observe(el));

  /* Custom cursor ---------------------------------------------------------- */
  const cursor = $('.cursor');
  if (cursor && finePointer && !reduced) {
    root.classList.add('has-cursor');
    const label = $('.cursor__label', cursor);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      const t = e.target instanceof Element ? e.target : null;
      const hot = t?.closest('[data-cursor]');
      cursor.classList.toggle('is-big', !!hot);
      if (hot) label.textContent = hot.dataset.cursor;
      cursor.classList.toggle('on-dark', !!t?.closest('.services, .loader, .nav__menu.is-open'));
      cursor.classList.toggle('on-cobalt', !!t?.closest('.hero, .contact, .about__visual, .nav:not(.is-solid)'));
      cursor.classList.toggle('is-hidden', !!t?.closest('input, textarea, select'));
    });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'));
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* Project filters -------------------------------------------------------- */
  const grid = $('[data-grid]');
  const cards = $$('.card', grid);
  const status = $('[data-filter-status]');
  const pattern = ['is-l', 'is-s', 'is-s', 'is-l'];
  const layout = () => {
    cards.filter((c) => !c.hidden).forEach((c, i) => {
      c.classList.remove('is-l', 'is-s');
      c.classList.add(pattern[i % 4]);
    });
  };
  $$('.filters button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      $$('.filters button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      let shown = 0;
      cards.forEach((c) => {
        const match = f === 'all' || c.dataset.cats.split(' ').includes(f);
        c.hidden = !match;
        c.classList.remove('is-entering');
        if (match) {
          c.classList.add('is-in');
          void c.offsetWidth;
          c.style.setProperty('--d', `${shown * 0.06}s`);
          c.classList.add('is-entering');
          shown++;
        }
      });
      layout();
      document.dispatchEvent(new Event('grid:filtered'));
      status.textContent = `${shown} ${shown === 1 ? 'proyecto' : 'proyectos'} en ${btn.childNodes[0].textContent.trim()}`;
    });
  });

  /* Case study dialogs ----------------------------------------------------- */
  let lastTrigger = null;
  const openCase = (id, trigger) => {
    const dlg = document.getElementById(id);
    if (!dlg || dlg.tagName !== 'DIALOG') return;
    $$('dialog.case[open]').forEach((d) => { if (d !== dlg) { d.close(); } });
    if (trigger && !trigger.closest('dialog')) lastTrigger = trigger;
    if (!dlg.open) dlg.showModal();
    if (cursor && root.classList.contains('has-cursor')) dlg.append(cursor); // keep cursor above the top layer
    $('.case__scroll', dlg).scrollTop = 0;
    document.dispatchEvent(new CustomEvent('case:open', { detail: dlg }));
    lenis?.stop();
    if (location.hash !== `#${id}`) history.pushState({ case: id }, '', `#${id}`);
  };
  const closeCase = (dlg) => {
    if (!dlg.open || dlg.classList.contains('is-closing')) return;
    if (reduced) return dlg.close();
    dlg.classList.add('is-closing');
    dlg.addEventListener('animationend', () => { dlg.classList.remove('is-closing'); dlg.close(); }, { once: true });
  };

  $$('[data-case]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    openCase(a.dataset.case, a);
  }));
  $$('dialog.case').forEach((dlg) => {
    $('[data-close]', dlg).addEventListener('click', () => closeCase(dlg));
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeCase(dlg); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) closeCase(dlg); });
    dlg.addEventListener('close', () => {
      if (!$('dialog.case[open]')) {
        if (cursor) document.body.append(cursor);
        lenis?.start();
        if (location.hash === `#${dlg.id}`) history.replaceState(null, '', '#proyectos');
        lastTrigger?.focus({ preventScroll: true });
      }
    });
  });

  const syncHash = () => {
    const id = location.hash.slice(1);
    const dlg = id && document.getElementById(id);
    if (dlg?.tagName === 'DIALOG') openCase(id);
    else $$('dialog.case[open]').forEach((d) => d.close());
  };
  addEventListener('popstate', syncHash);
  if (location.hash.startsWith('#caso-')) {
    lastTrigger = $(`.card [data-case="${location.hash.slice(1)}"]`);
    syncHash();
  }

  /* Testimonials ------------------------------------------------------------- */
  const track = $('[data-voices-track]');
  if (track) {
    const prev = $('[data-voices="prev"]');
    const next = $('[data-voices="next"]');
    const amount = () => (track.firstElementChild?.offsetWidth || 400) + 24;
    const update = () => {
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -amount(), behavior: reduced ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: amount(), behavior: reduced ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }

  /* Contact form ------------------------------------------------------------- */
  const form = $('[data-form]');
  if (form) {
    const out = $('[data-form-status]', form);
    const fields = $$('input[required], textarea[required]', form);
    // inline errors: shown on blur or submit, cleared as soon as the field becomes valid
    const check = (f) => {
      const err = document.getElementById(f.getAttribute('aria-describedby'));
      const ok = f.checkValidity();
      f.setAttribute('aria-invalid', String(!ok));
      if (err) err.textContent = ok ? '' : err.dataset.error;
      return ok;
    };
    fields.forEach((f) => {
      f.addEventListener('blur', () => { if (f.value) check(f); });
      f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') check(f); });
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const invalid = fields.filter((f) => !check(f));
      if (invalid.length) {
        out.textContent = invalid.length === 1 ? 'Falta completar 1 campo.' : `Faltan completar ${invalid.length} campos.`;
        invalid[0].focus();
        return;
      }
      const endpoint = form.dataset.endpoint;
      if (!endpoint || endpoint.includes('TU_FORM_ID')) {
        out.innerHTML = 'El formulario aún no está conectado. Escríbeme por <a class="link-u" href="https://www.linkedin.com/in/ale-monroy/" target="_blank" rel="noopener">LinkedIn</a>.';
        return;
      }
      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      out.textContent = 'Enviando…';
      try {
        const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        out.textContent = '¡Gracias! Tu mensaje llegó. Te responderé pronto.';
      } catch {
        out.textContent = 'No se pudo enviar. Inténtalo de nuevo o escríbeme por LinkedIn.';
      } finally {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
      }
    });
  }

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
