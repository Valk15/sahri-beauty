/* SAHRI SKIN — shared site behaviour */
(function () {
  const navToggle = document.getElementById('navToggle');
  const nav = document.querySelector('.nav');
  navToggle?.addEventListener('click', () => nav?.classList.toggle('open'));

  /* Scroll reveal */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* Stagger: reveal children when parent is visible */
  document.querySelectorAll('[data-stagger]').forEach((parent) => {
    [...parent.children].forEach((child, i) => {
      child.style.setProperty('--i', i);
    });
    if ('IntersectionObserver' in window) {
      const sio = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          parent.classList.add('is-visible');
          sio.disconnect();
        }
      }, { threshold: 0.1 });
      sio.observe(parent);
    } else parent.classList.add('is-visible');
  });

  /* Scent cards sync */
  const scentSelect = document.getElementById('scent');
  document.querySelectorAll('.scent-card[data-scent]').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.scent-card[data-scent]').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      if (scentSelect) scentSelect.value = card.dataset.scent;
    });
  });

  /* Ritual step progress (pack page) */
  const ritualSteps = document.querySelectorAll('.ritual-step');
  const ritualProgress = document.querySelector('.ritual-progress-fill');
  if (ritualSteps.length && ritualProgress) {
    const updateRitual = () => {
      const mid = window.innerHeight * 0.55;
      let active = 0;
      ritualSteps.forEach((step, i) => {
        const r = step.getBoundingClientRect();
        if (r.top < mid) active = i;
      });
      ritualSteps.forEach((step, i) => step.classList.toggle('is-active', i <= active));
      const pct = ((active + 1) / ritualSteps.length) * 100;
      ritualProgress.style.height = pct + '%';
    };
    window.addEventListener('scroll', updateRitual, { passive: true });
    updateRitual();
  }

  /* Pack composition orbit hover */
  document.querySelectorAll('.pack-orbit-item').forEach((item) => {
    item.addEventListener('mouseenter', () => {
      document.querySelectorAll('.pack-orbit-item').forEach((i) => i.classList.remove('is-focused'));
      item.classList.add('is-focused');
    });
  });

  /* Order form → Supabase + WhatsApp */
  document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const product = fd.get('product') || 'Pack Rituel SAHRI SKIN';
    const packVal = fd.get('pack');
    let packLine = '';
    if (packVal === '319') packLine = 'Gift box — 319 MAD';
    else if (packVal === '269') packLine = 'Pack standard — 269 MAD';
    else if (packVal) packLine = String(packVal);

    let orderRef = '';
    if (typeof window.SAHRI_submitOrderToDb === 'function') {
      try {
        const id = await window.SAHRI_submitOrderToDb(fd);
        if (id) orderRef = '\nRef: ' + id;
      } catch (err) {
        console.warn('Order DB save failed:', err.message);
      }
    }

    const msg = [
      'Commande SAHRI SKIN',
      'Produit: ' + product,
      'Nom: ' + fd.get('name'),
      'Tel: ' + fd.get('phone'),
      'Ville: ' + fd.get('city'),
      fd.get('scent') ? 'Parfum: ' + fd.get('scent') : '',
      packLine ? 'Format: ' + packLine : '',
      fd.get('notes') ? 'Notes: ' + fd.get('notes') : '',
      orderRef
    ].filter(Boolean).join('\n');

    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
    alert('Merci — commande enregistrée. Complète l\'envoi sur WhatsApp ou contacte @sahriskin.');
  });

  /* Counter animation */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    if (Number.isNaN(target)) return;
    const run = () => {
      const start = performance.now();
      const dur = 1200;
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const cio = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          run();
          cio.disconnect();
        }
      }, { threshold: 0.5 });
      cio.observe(el);
    } else run();
  });
})();
