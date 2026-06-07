/* SAHRI SKIN — Supabase client, catalog & orders */
(function () {
  const cfg = window.SAHRI_CONFIG || {};
  const url = cfg.supabaseUrl;
  const key = cfg.supabaseAnonKey;

  if (!url || !key || typeof supabase === 'undefined') {
    return;
  }

  const client = supabase.createClient(url, key);

  window.SAHRI_DB = {
    client,
    async getScents() {
      const { data, error } = await client
        .from('scents')
        .select('name_fr, profile_fr, mood_fr, sort_order')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    async getProducts() {
      const { data, error } = await client
        .from('catalog_products')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    async getPack() {
      const { data, error } = await client
        .from('catalog_pack')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async submitOrder(payload) {
      const { data, error } = await client.rpc('submit_order', payload);
      if (error) throw error;
      return data;
    }
  };

  const BADGE_MAP = {
    'best-seller': { cls: 'badge-gold', label: 'Best-seller' },
    'ugc-favorite': { cls: 'badge-gold', label: 'UGC favorite' },
    rituel: { cls: 'badge-navy', label: 'Rituel' },
    offert: { cls: 'badge-gift', label: '🎁 Offert' }
  };

  function badgeHtml(badge) {
    if (!badge) return '';
    const b = BADGE_MAP[badge] || { cls: 'badge-navy', label: badge };
    return `<span class="badge ${b.cls}">${b.label}</span>`;
  }

  function priceHtml(p, pack) {
    if (p.is_gift) return '<p class="catalog-price"><span class="free">Inclus dans le pack</span></p>';
    let html = `<p class="catalog-price">${Math.round(p.price_mad)} MAD</p>`;
    return html;
  }

  function renderCatalog(products, pack) {
    const grid = document.getElementById('catalog-grid');
    if (!grid || !products?.length) return;

    const cards = products.map((p) => {
      const href = p.page_path || '#';
      const cta = p.is_gift
        ? 'En savoir plus'
        : p.sold_separately
          ? 'Voir le produit'
          : 'Voir le pack';
      return `
        <article class="catalog-card">
          <div class="badge-stack">${badgeHtml(p.badge)}</div>
          <a href="${href}" class="catalog-card-img">
            <img src="${p.image_path}" alt="${p.name_fr}" loading="lazy" />
          </a>
          <div class="catalog-card-body">
            <h3><a href="${href}">${p.name_fr}</a></h3>
            <p>${p.description_short || ''}</p>
            ${priceHtml(p)}
            <a href="${href}" class="btn btn-outline">${cta}</a>
          </div>
        </article>`;
    });

    if (pack) {
      cards.push(`
        <article class="catalog-card" style="border:2px solid var(--gold)">
          <div class="badge-stack">
            <span class="badge badge-offer">Offre pack</span>
            <span class="badge badge-gold">-${Math.round(pack.savings_mad)} MAD</span>
          </div>
          <a href="${pack.page_path || 'pack/'}" class="catalog-card-img" style="background:linear-gradient(135deg,var(--navy),var(--navy-deep))">
            <img src="products/argan-parfumee-100ml/argan-parfumee-100ml-studio.png" alt="Pack Rituel" loading="lazy" />
          </a>
          <div class="catalog-card-body">
            <h3><a href="${pack.page_path || 'pack/'}">${pack.name_fr}</a></h3>
            <p>${pack.description_short || ''}</p>
            <p class="catalog-price"><span class="was">${Math.round(pack.separate_total_mad)} MAD</span> ${Math.round(pack.price_standard_mad)} MAD</p>
            <a href="${pack.page_path || 'pack/'}" class="btn btn-gold">Voir le pack →</a>
          </div>
        </article>`);
    }

    grid.innerHTML = cards.join('');
  }

  function renderScents(scents) {
    const grid = document.getElementById('scentGrid');
    if (!grid || !scents?.length) return;
    grid.innerHTML = scents
      .map(
        (s) =>
          `<div class="scent-card" data-scent="${s.name_fr}"><h4>${s.name_fr}</h4><p>${s.profile_fr}</p></div>`
      )
      .join('');

    const scentSelect = document.getElementById('scent');
    if (scentSelect && scentSelect.options.length <= 1) {
      scents.forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s.name_fr;
        opt.textContent = s.name_fr;
        scentSelect.appendChild(opt);
      });
    }

    document.querySelectorAll('.scent-card[data-scent]').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.scent-card[data-scent]').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        if (scentSelect) scentSelect.value = card.dataset.scent;
      });
    });
  }

  async function initCatalog() {
    try {
      const [products, pack, scents] = await Promise.all([
        window.SAHRI_DB.getProducts(),
        window.SAHRI_DB.getPack(),
        window.SAHRI_DB.getScents()
      ]);
      renderCatalog(products, pack);
      renderScents(scents);

      if (pack?.savings_mad) {
        document.querySelectorAll('[data-count]').forEach((el) => {
          el.dataset.count = Math.round(pack.savings_mad);
        });
      }
    } catch (err) {
      console.warn('SAHRI catalog: fallback to static HTML', err.message);
    }
  }

  window.SAHRI_submitOrderToDb = async function (formData) {
    if (!window.SAHRI_DB) return null;

    const productField = formData.get('product') || '';
    const packVal = formData.get('pack');
    let format = 'pack_standard';
    let productSlug = formData.get('product_slug') || '';

    if (packVal === '319') format = 'pack_gift';
    else if (packVal === '269') format = 'pack_standard';
    else if (productSlug) format = 'product_refill';

    if (!productSlug && productField.includes('Argan')) productSlug = 'argan-parfumee-100ml';
    if (!productSlug && productField.includes('Beurre')) productSlug = 'beurre-corporelle-200g';
    if (!productSlug && productField.includes('Gommage Corps')) productSlug = 'gommage-corps-300g';
    if (!productSlug && productField.includes('Gommage à Lèvres')) productSlug = 'gommage-levres-30g';

    const payload = {
      p_customer_name: formData.get('name'),
      p_phone: formData.get('phone'),
      p_city: formData.get('city'),
      p_scent_name: formData.get('scent') || null,
      p_product_slug: productSlug || null,
      p_pack_slug: productSlug ? null : 'pack-rituel-v2',
      p_format: format,
      p_notes: formData.get('notes') || null
    };

    return window.SAHRI_DB.submitOrder(payload);
  };

  initCatalog();
})();
