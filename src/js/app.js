/* Perfumería Centurión — comportamiento del sitio (sin dependencias). */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const readJSON = (id) => { try { return JSON.parse(document.getElementById(id).textContent); } catch (_) { return null; } };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const CATALOG = readJSON('catalog-data') || [];
  const CONFIG = readJSON('site-config') || {};
  const BY_ID = Object.fromEntries(CATALOG.map((p) => [p.id, p]));
  const MAX_QTY = 10;
  const KEY = 'centurion-cart-v1';

  /* ───────── Carrito ───────── */
  // Solo guardamos {id: cantidad}. Los precios SIEMPRE salen del catálogo de la página.
  const Cart = {
    read() {
      try {
        const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
        const clean = {};
        for (const [id, q] of Object.entries(raw)) {
          const qty = Math.min(MAX_QTY, Math.max(0, parseInt(q, 10) || 0));
          if (BY_ID[id] && qty) clean[id] = qty;
        }
        return clean;
      } catch (_) { return {}; }
    },
    write(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (_) { /* modo privado */ } document.dispatchEvent(new CustomEvent('cart:change')); },
    add(id, qty = 1) { const c = this.read(); c[id] = Math.min(MAX_QTY, (c[id] || 0) + qty); this.write(c); },
    set(id, qty) { const c = this.read(); if (qty <= 0) delete c[id]; else c[id] = Math.min(MAX_QTY, qty); this.write(c); },
    clear() { this.write({}); },
    lines() { return Object.entries(this.read()).map(([id, qty]) => ({ ...BY_ID[id], qty, line: BY_ID[id].p * qty })); },
    count() { return this.lines().reduce((a, l) => a + l.qty, 0); },
    subtotal() { return this.lines().reduce((a, l) => a + l.line, 0); },
  };
  window.CenturionCart = { Cart, fmt, esc, CONFIG, BY_ID };

  const shippingLabel = () => (CONFIG.shipping && CONFIG.shipping[0] && CONFIG.shipping[0].costLabel) || 'A pagar en destino';

  const toast = $('[data-toast]');

  /* ───────── Drawer del carrito ───────── */
  const drawer = $('#cart-drawer');
  const overlay = $('[data-overlay]');
  let lastFocus = null;

  function renderCart() {
    const lines = Cart.lines();
    const count = Cart.count();
    $$('[data-cart-count]').forEach((el) => { el.textContent = count; el.hidden = count === 0; });
    if (!drawer) return;
    const body = $('[data-cart-items]', drawer);
    const foot = $('[data-cart-foot]', drawer);
    if (!lines.length) {
      body.innerHTML = `<div class="cart-empty"><svg class="i" aria-hidden="true"><use href="#i-cart"/></svg><p>Tu carrito está vacío.<br>Descubrí tu próxima fragancia.</p><a class="btn btn-gold" href="/#perfumes" data-close-cart>VER PERFUMES</a></div>`;
      foot.hidden = true;
      return;
    }
    body.innerHTML = lines.map((l) => `
      <div class="citem" data-line="${esc(l.id)}">
        <a class="citem-img" href="${esc(l.u)}">${l.i ? `<img src="${esc(l.i)}" alt="" width="76" height="76" loading="lazy">` : '<svg class="i" aria-hidden="true"><use href="#i-drop"/></svg>'}</a>
        <div>
          <p class="citem-brand">${esc(l.b)}</p>
          <a class="citem-name" href="${esc(l.u)}">${esc(l.n.replace(l.b + ' ', ''))}</a>
          <div class="citem-row">
            <div class="qty" role="group" aria-label="Cantidad de ${esc(l.n)}">
              <button type="button" data-dec="${esc(l.id)}" aria-label="Quitar uno"><svg class="i" aria-hidden="true"><use href="#i-minus"/></svg></button>
              <span aria-live="polite">${l.qty}</span>
              <button type="button" data-inc="${esc(l.id)}" aria-label="Agregar uno" ${l.qty >= MAX_QTY ? 'disabled' : ''}><svg class="i" aria-hidden="true"><use href="#i-plus"/></svg></button>
            </div>
            <p class="citem-price">${fmt(l.line)}${l.qty > 1 ? `<small>${fmt(l.p)} c/u</small>` : ''}</p>
          </div>
          <button type="button" class="citem-remove" data-remove="${esc(l.id)}"><svg class="i" aria-hidden="true"><use href="#i-trash"/></svg> Eliminar</button>
        </div>
      </div>`).join('');
    const sub = Cart.subtotal();
    $('[data-cart-subtotal]', drawer).textContent = fmt(sub);
    $('[data-cart-total]', drawer).textContent = fmt(sub);
    $('[data-cart-shipping]', drawer).textContent = shippingLabel();
    foot.hidden = false;
  }

  function openCart() {
    if (!drawer) return;
    closeMenu();
    if (toast) toast.hidden = true;
    lastFocus = document.activeElement;
    renderCart();
    overlay.hidden = false;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('.icon-btn', drawer)?.focus(), 50);
  }
  function closeCart() {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    document.body.style.overflow = '';
    lastFocus?.focus?.();
  }

  /* ───────── Menú móvil ───────── */
  const menu = $('#mobile-menu');
  const menuBtn = $('[data-open-menu]');
  function openMenu() { if (!menu) return; menu.hidden = false; menuBtn?.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
  function closeMenu() { if (!menu || menu.hidden) return; menu.hidden = true; menuBtn?.setAttribute('aria-expanded', 'false'); if (!drawer?.classList.contains('is-open')) document.body.style.overflow = ''; }

  let toastTimer;
  function showToast(text) {
    if (!toast) return;
    toast.innerHTML = `<span>${esc(text)}</span><button type="button" data-open-cart>VER CARRITO</button>`;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3800);
  }

  function addToCart(id, qty = 1, btn) {
    if (!BY_ID[id]) return;
    Cart.add(id, qty);
    const cartBtn = $('.cart-btn');
    if (cartBtn) { cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump'); }
    if (btn) {
      const old = btn.textContent;
      btn.classList.add('is-added'); btn.textContent = '✓ AGREGADO';
      setTimeout(() => { btn.classList.remove('is-added'); btn.textContent = old; }, 1400);
    }
    if (!drawer?.classList.contains('is-open')) showToast(`Agregado: ${BY_ID[id].n}`);
  }

  /* ───────── Eventos globales (delegación) ───────── */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, a, [data-overlay]');
    if (!t) return;
    if (t.hasAttribute('data-add')) {
      e.preventDefault();
      const qtyEl = t.hasAttribute('data-add-qty') ? $('[data-qty-value]') : null;
      addToCart(t.getAttribute('data-add'), qtyEl ? parseInt(qtyEl.textContent, 10) || 1 : 1, t);
    } else if (t.hasAttribute('data-open-cart')) { e.preventDefault(); openCart(); }
    else if (t.hasAttribute('data-close-cart') || t.hasAttribute('data-overlay')) { closeCart(); }
    else if (t.hasAttribute('data-open-menu')) { openMenu(); }
    else if (t.hasAttribute('data-close-menu')) { closeMenu(); }
    else if (t.hasAttribute('data-inc')) { const id = t.getAttribute('data-inc'); Cart.set(id, (Cart.read()[id] || 0) + 1); }
    else if (t.hasAttribute('data-dec')) { const id = t.getAttribute('data-dec'); Cart.set(id, (Cart.read()[id] || 0) - 1); }
    else if (t.hasAttribute('data-remove')) { Cart.set(t.getAttribute('data-remove'), 0); }
    else if (menu && !menu.hidden && t.tagName === 'A' && menu.contains(t)) { closeMenu(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCart(); closeMenu(); $('.lightbox')?.remove(); }
    if (e.key === 'Tab' && drawer?.classList.contains('is-open')) {
      const f = $$('a[href], button:not([disabled])', drawer).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('cart:change', renderCart);
  window.addEventListener('storage', (e) => { if (e.key === KEY) renderCart(); });
  window.addEventListener('pageshow', renderCart);
  renderCart();

  /* ───────── Header sólido al hacer scroll ───────── */
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('is-solid', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ───────── Aparición al hacer scroll ───────── */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((en) => en.isIntersecting);
      visible.forEach((en, i) => { en.target.style.setProperty('--d', `${Math.min(i, 6) * 70}ms`); en.target.classList.add('in'); io.unobserve(en.target); });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else { reveals.forEach((el) => el.classList.add('in')); }

  /* ───────── Catálogo: filtros, búsqueda y orden ───────── */
  const grid = $('[data-grid]');
  if (grid) {
    const cards = $$('.pcard', grid);
    const state = { filter: 'todos', q: '', brand: '', sort: 'priority' };
    const chips = $$('[data-filter]');
    const countEl = $('[data-count]');
    const emptyEl = $('[data-empty]');
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    const matches = (c) => {
      const f = state.filter;
      if (f === 'masculino' || f === 'femenino' || f === 'unisex') { if (c.dataset.gender !== f) return false; }
      else if (f === 'best') { if (c.dataset.best !== '1') return false; }
      else if (f === 'new') { if (c.dataset.new !== '1') return false; }
      else if (f !== 'todos') { if (!c.dataset.tags.split(' ').includes(f)) return false; }
      if (state.brand && c.dataset.brand !== state.brand) return false;
      if (state.q && !norm(c.dataset.name + ' ' + c.dataset.tags).includes(norm(state.q))) return false;
      return true;
    };
    const sorters = {
      priority: (a, b) => a.dataset.priority - b.dataset.priority,
      'price-asc': (a, b) => a.dataset.price - b.dataset.price,
      'price-desc': (a, b) => b.dataset.price - a.dataset.price,
      name: (a, b) => a.dataset.name.localeCompare(b.dataset.name, 'es'),
    };
    function apply() {
      let n = 0;
      cards.sort(sorters[state.sort]).forEach((c) => {
        grid.appendChild(c);
        const ok = matches(c);
        c.classList.toggle('is-hidden', !ok);
        if (ok) { n++; c.classList.add('in'); }
      });
      countEl.textContent = n === 1 ? 'Mostrando 1 perfume' : `Mostrando ${n} perfumes`;
      emptyEl.hidden = n !== 0;
    }
    chips.forEach((chip) => chip.addEventListener('click', () => {
      state.filter = chip.dataset.filter;
      chips.forEach((c) => { const on = c === chip; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', on); });
      apply();
    }));
    let t;
    $('[data-search]')?.addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value.trim(); apply(); }, 120); });
    $('[data-brand-filter]')?.addEventListener('change', (e) => { state.brand = e.target.value; apply(); });
    $('[data-sort]')?.addEventListener('change', (e) => { state.sort = e.target.value; apply(); });
    $('[data-reset]')?.addEventListener('click', () => {
      state.filter = 'todos'; state.q = ''; state.brand = '';
      $('[data-search]').value = ''; $('[data-brand-filter]').value = '';
      chips.forEach((c) => { const on = c.dataset.filter === 'todos'; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', on); });
      apply();
    });
    // Enlaces profundos: /?marca=lattafa  /?filtro=dulce
    const params = new URLSearchParams(location.search);
    if (params.get('marca')) { state.brand = params.get('marca'); const s = $('[data-brand-filter]'); if (s) s.value = state.brand; }
    const fp = params.get('filtro');
    if (fp) { const chip = chips.find((c) => c.dataset.filter === fp); chip?.click(); }
    if (params.get('marca')) apply();
  }

  /* ───────── Página de producto ───────── */
  const prod = $('[data-product]');
  if (prod) {
    let qty = 1;
    const out = $('[data-qty-value]');
    const sync = () => { out.textContent = qty; };
    $('[data-qty-minus]')?.addEventListener('click', () => { qty = Math.max(1, qty - 1); sync(); waSync(); });
    $('[data-qty-plus]')?.addEventListener('click', () => { qty = Math.min(MAX_QTY, qty + 1); sync(); waSync(); });
    const wa = $('[data-wa-product]');
    function waSync() {
      if (!wa) return;
      const name = wa.getAttribute('data-wa-product');
      const msg = qty > 1 ? `Hola, estoy interesado/a en ${qty} unidades de ${name}. ¿Siguen disponibles?` : `Hola, estoy interesado/a en ${name}. ¿Sigue disponible?`;
      wa.href = `https://wa.me/${CONFIG.wa}?text=${encodeURIComponent(msg)}`;
    }
    // Barra de compra fija en móvil cuando el botón principal sale de la vista
    const bar = $('[data-buybar]');
    const main = $('.buy [data-add]');
    if (bar && main && 'IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => bar.classList.toggle('is-on', !en.isIntersecting && en.boundingClientRect.top < 0)).observe(main);
    }
    // Miniaturas de la galería
    $$('.pgal-thumb').forEach((th) => th.addEventListener('click', () => {
      $$('.pgal-thumb').forEach((x) => x.classList.toggle('is-active', x === th));
      const main = $('.pgallery-main'); const img = $('img', main);
      img.removeAttribute('srcset'); img.src = th.dataset.full; main.dataset.zoom = th.dataset.full;
    }));
    // Zoom de foto
    const zoom = $('[data-zoom]');
    zoom?.addEventListener('click', () => {
      const lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Foto ampliada');
      const img = document.createElement('img');
      img.src = zoom.dataset.zoom; img.alt = $('img', zoom)?.alt || '';
      lb.appendChild(img);
      lb.addEventListener('click', () => lb.remove());
      document.body.appendChild(lb);
    });
  }
})();
