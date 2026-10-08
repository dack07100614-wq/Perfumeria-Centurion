/* Checkout: validación, confirmación del pedido y envío por WhatsApp. */
(() => {
  'use strict';
  const { Cart, fmt, esc, CONFIG } = window.CenturionCart;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const LAST = 'centurion-last-order';

  const form = $('#order-form');
  const wrapCheckout = $('[data-checkout]');
  const wrapEmpty = $('[data-checkout-empty]');
  const wrapConf = $('[data-confirmation]');
  const errBox = $('[data-form-error]');

  /* ───── Opciones de envío y pago (vienen de data/config.json) ───── */
  const optionHTML = (name, o, checked) => `<label class="option"><input type="radio" name="${name}" value="${esc(o.id)}" ${checked ? 'checked' : ''} required>
    <span class="option-box"><span class="option-radio"></span><span><span class="option-title">${esc(o.label)}</span><span class="option-desc">${esc(o.description || '')}</span></span><span class="option-tag">${esc(o.costLabel || o.eta || '')}</span></span></label>`;
  $('[data-shipping-options]').innerHTML = (CONFIG.shipping || []).map((o, i) => optionHTML('envio', o, i === 0)).join('');
  $('[data-payment-options]').innerHTML = (CONFIG.payments || []).map((o, i) => optionHTML('pago', o, i === 0)).join('');
  const depSel = $('[data-departamentos]');
  (CONFIG.departamentos || []).forEach((d) => { const op = document.createElement('option'); op.value = op.textContent = d; depSel.appendChild(op); });

  /* ───── Resumen ───── */
  function renderSummary() {
    const lines = Cart.lines();
    $('[data-summary-items]').innerHTML = lines.map((l) => `<div class="sitem">${l.i ? `<img src="${esc(l.i)}" alt="" width="56" height="56">` : '<span class="sitem-ph"></span>'}<span><b>${esc(l.n)}</b><small>${l.qty} × ${fmt(l.p)}</small></span><span class="sitem-price">${fmt(l.line)}</span></div>`).join('');
    const sub = Cart.subtotal();
    $('[data-summary-subtotal]').textContent = fmt(sub);
    $('[data-summary-total]').textContent = fmt(sub);
    return lines;
  }
  const selected = (list, id) => list.find((x) => x.id === id) || list[0];
  const val = (name) => (form.elements[name]?.value || '').trim();

  function updateShippingLabel() {
    const m = selected(CONFIG.shipping || [], val('envio'));
    $('[data-summary-shipping]').textContent = m ? m.costLabel : '';
  }
  form.addEventListener('change', (e) => { if (e.target.name === 'envio') updateShippingLabel(); });

  function showState() {
    const lines = Cart.lines();
    const last = readLast();
    if (location.hash === '#confirmacion' && last) { if (last.pago && last.pago.type === 'mercadopago') Cart.clear(); showConfirmation(last); return; }
    wrapConf.hidden = true;
    const head0 = $('[data-checkout-head]'); if (head0) head0.hidden = false;
    wrapEmpty.hidden = lines.length > 0;
    wrapCheckout.hidden = lines.length === 0;
    if (lines.length) { renderSummary(); updateShippingLabel(); }
  }
  document.addEventListener('cart:change', () => { if (wrapConf.hidden) showState(); });

  /* ───── Validación ───── */
  function validate() {
    const problems = [];
    $$('.is-invalid', form).forEach((el) => el.classList.remove('is-invalid'));
    const mark = (name, msg) => { const el = form.elements[name]; if (el) el.classList.add('is-invalid'); problems.push(msg); };
    if (val('nombre').length < 2) mark('nombre', 'Ingresá tu nombre.');
    if (val('apellido').length < 2) mark('apellido', 'Ingresá tu apellido.');
    const digits = val('telefono').replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 13) mark('telefono', 'Ingresá un teléfono válido (ej. 098 123 456).');
    if (!val('departamento')) mark('departamento', 'Elegí tu departamento.');
    if (val('direccion').length < 5) mark('direccion', 'Ingresá tu dirección de entrega.');
    if (!val('envio')) problems.push('Elegí un método de envío.');
    if (!val('pago')) problems.push('Elegí un método de pago.');
    if (!Cart.lines().length) problems.push('Tu carrito está vacío.');
    if (problems.length) {
      errBox.textContent = problems[0];
      errBox.hidden = false;
      const first = $('.is-invalid', form);
      (first || errBox).scrollIntoView({ behavior: 'smooth', block: 'center' });
      first?.focus({ preventScroll: true });
      return false;
    }
    errBox.hidden = true;
    return true;
  }

  /* ───── Pedido ───── */
  function newOrderId() {
    const rnd = Math.random().toString(36).slice(2, 4).toUpperCase();
    return `CEN-${Date.now().toString(36).slice(-5).toUpperCase()}${rnd}`;
  }
  function collect() {
    const lines = Cart.lines();
    const ship = selected(CONFIG.shipping || [], val('envio'));
    const pay = selected(CONFIG.payments || [], val('pago'));
    return {
      id: newOrderId(),
      date: new Date().toISOString(),
      nombre: val('nombre'), apellido: val('apellido'), telefono: val('telefono'),
      departamento: val('departamento'), localidad: val('localidad'), direccion: val('direccion'), obs: val('observaciones'),
      envio: ship, pago: pay,
      items: lines.map((l) => ({ id: l.id, n: l.n, qty: l.qty, p: l.p, line: l.line, i: l.i })),
      subtotal: Cart.subtotal(),
    };
  }
  function message(o) {
    const L = [];
    L.push(`*Pedido ${o.id} — ${CONFIG.site}*`, '');
    L.push(`*Cliente:* ${o.nombre} ${o.apellido}`, `*Teléfono:* ${o.telefono}`);
    L.push(`*Departamento:* ${o.departamento}${o.localidad ? ' · ' + o.localidad : ''}`, `*Dirección:* ${o.direccion}`);
    if (o.obs) L.push(`*Observaciones:* ${o.obs}`);
    L.push(`*Envío:* ${o.envio.label} (${o.envio.costLabel})`, `*Pago:* ${o.pago.label}`, '', '*Productos:*');
    o.items.forEach((i) => L.push(`• ${i.qty} × ${i.n} — ${fmt(i.line)}`));
    L.push('', `*Total productos:* ${fmt(o.subtotal)}`, `Envío: ${o.envio.costLabel}`);
    return L.join('\n');
  }
  const waUrl = (text) => `https://wa.me/${CONFIG.wa}?text=${encodeURIComponent(text)}`;

  function saveLast(o) { try { sessionStorage.setItem(LAST, JSON.stringify(o)); } catch (_) { /* ignore */ } }
  function readLast() { try { return JSON.parse(sessionStorage.getItem(LAST) || 'null'); } catch (_) { return null; } }

  // Registro del pedido en Netlify Forms (llega por email). Es un respaldo: el pedido
  // se confirma de todas formas por WhatsApp, así que si falla no frena la compra.
  async function registerOrder(o) {
    try {
      form.elements['pedido_id'].value = o.id;
      form.elements['productos'].value = o.items.map((i) => `${i.qty} x ${i.n} (${fmt(i.line)})`).join(' | ');
      form.elements['subtotal'].value = String(o.subtotal);
      const data = new URLSearchParams(new FormData(form));
      data.set('envio', o.envio.label); data.set('pago', o.pago.label);
      await fetch(form.getAttribute('action') || '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data.toString() });
    } catch (_) { /* sin conexión o fuera de Netlify */ }
  }

  function showConfirmation(o) {
    wrapCheckout.hidden = true; wrapEmpty.hidden = true; wrapConf.hidden = false;
    const head = $('[data-checkout-head]'); if (head) head.hidden = true;
    $('[data-conf-id]').textContent = o.id;
    $('[data-conf-items]').innerHTML = o.items.map((i) => `<div class="sitem">${i.i ? `<img src="${esc(i.i)}" alt="" width="56" height="56">` : '<span class="sitem-ph"></span>'}<span><b>${esc(i.n)}</b><small>${i.qty} × ${fmt(i.p)}</small></span><span class="sitem-price">${fmt(i.line)}</span></div>`).join('');
    $('[data-conf-total]').textContent = fmt(o.subtotal);
    $('[data-conf-ship]').textContent = `${o.envio.label}: ${o.envio.description || o.envio.costLabel} Entrega estimada: ${o.envio.eta || 'a coordinar'}.`;
    const pay = $('[data-conf-pay]');
    const acc = o.pago.account;
    pay.innerHTML = o.pago.type === 'transfer' && acc
      ? `<h3>Cómo pagar</h3><p>Transferí <b>${fmt(o.subtotal)}</b> a esta cuenta y enviá el comprobante por WhatsApp indicando tu pedido <b>${esc(o.id)}</b>.</p>
         <dl class="acct"><div><dt>Banco</dt><dd>${esc(acc.bank)}</dd></div><div><dt>Cuenta</dt><dd>${esc(acc.number)}</dd></div><div><dt>Titular</dt><dd>${esc(acc.holder)}</dd></div><div><dt>Monto</dt><dd>${fmt(o.subtotal)}</dd></div></dl>
         <p>Con el comprobante, preparamos y despachamos tu pedido.</p>`
      : o.pago.type === 'mercadopago'
        ? `<h3>Pago con Mercado Pago</h3><p>Si el pago se aprobó, ya lo recibimos. Para coordinar el envío, mandanos el pedido por WhatsApp con el botón de abajo.</p><p>Si cerraste la ventana de pago antes de terminar, escribinos y te ayudamos a completarlo.</p>`
        : `<h3>Pago</h3><p>${esc(o.pago.label)}. Te contactamos por WhatsApp para coordinar el pago.</p>`;
    $('[data-conf-wa]').href = waUrl(message(o) + `\n\nQuedo atento/a a los datos de pago.`);
    if (location.hash !== '#confirmacion') history.replaceState(null, '', '#confirmacion');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function startMercadoPago(o) {
    const r = await fetch('/.netlify/functions/mp-checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: o.id, items: o.items.map((i) => ({ id: i.id, qty: i.qty })), payer: { name: o.nombre, surname: o.apellido } }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url || !/^https:\/\//.test(j.url)) throw new Error('mp');
    return j.url;
  }

  let busy = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !validate()) return;
    busy = true;
    const btn = $('[data-submit]'); const old = btn.textContent; btn.textContent = 'PROCESANDO…'; btn.disabled = true;
    const o = collect();
    try {
      if (o.pago.type === 'mercadopago') {
        saveLast(o);
        registerOrder(o);
        const url = await startMercadoPago(o); // el carrito se vacía al volver del pago, así no se pierde si el pago falla
        location.href = url;
        return;
      }
      await registerOrder(o);
      saveLast(o);
      Cart.clear();
      showConfirmation(o);
    } catch (_) {
      errBox.textContent = 'No pudimos iniciar el pago online. Probá con otro medio de pago o finalizá por WhatsApp.';
      errBox.hidden = false;
    } finally { busy = false; btn.textContent = old; btn.disabled = false; }
  });

  $('[data-order-wa]').addEventListener('click', () => {
    if (!validate()) return;
    const o = collect();
    // Se abre WhatsApp de inmediato (dentro del gesto del usuario) para evitar bloqueos del navegador.
    window.open(waUrl(message(o)), '_blank', 'noopener');
    registerOrder(o);
    saveLast(o);
    Cart.clear();
    showConfirmation(o);
  });

  window.addEventListener('hashchange', showState);
  showState();
})();
