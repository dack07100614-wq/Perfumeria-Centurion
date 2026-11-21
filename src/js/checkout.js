/* Checkout: validación, confirmación del pedido y envío por WhatsApp. */
(() => {
  'use strict';
  const { Cart, fmt, esc, CONFIG, shipCost } = window.CenturionCart;
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
    <span class="option-box"><span class="option-radio"></span><span><span class="option-title">${esc(o.label)}${o.recommended ? `<em class="option-rec">${esc(o.badge || 'Recomendada')}</em>` : ''}</span><span class="option-desc">${esc(o.description || '')}</span></span><span class="option-tag">${esc(o.costLabel || o.eta || '')}</span></span></label>`;
  $('[data-shipping-options]').innerHTML = (CONFIG.shipping || []).map((o, i) => optionHTML('envio', o, i === 0)).join('');
  $('[data-payment-options]').innerHTML = (CONFIG.payments || []).map((o, i) => optionHTML('pago', o, i === 0)).join('');
  const depSel = $('[data-departamentos]');
  (CONFIG.departamentos || []).forEach((d) => { const op = document.createElement('option'); op.value = op.textContent = d; depSel.appendChild(op); });

  /* ───── Resumen ───── */
  function renderSummary() {
    const lines = Cart.lines();
    $('[data-summary-items]').innerHTML = lines.map((l) => `<div class="sitem">${l.i ? `<img src="${esc(l.i)}" alt="" width="56" height="56">` : '<span class="sitem-ph"></span>'}<span><b>${esc(l.n)}</b><small>${l.qty} × ${fmt(l.p)}</small></span><span class="sitem-price">${fmt(l.line)}</span></div>`).join('');
    $('[data-summary-subtotal]').textContent = fmt(Cart.subtotal());
    return lines;
  }
  // Cotización del dólar para PayPal: se consulta una vez (función de Netlify) y, si falla, se usa fallbackRate del config.
  const paypalCfg = (CONFIG.payments || []).find((x) => x.type === 'paypal');
  const usdRate = { value: paypalCfg ? paypalCfg.fallbackRate || null : null, live: false };
  if (paypalCfg) {
    fetch('/.netlify/functions/usd-rate').then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (j && j.rate > 0) { usdRate.value = j.rate; usdRate.live = true; updateUsdNote(); }
    }).catch(() => { /* sin conexión o fuera de Netlify: queda la cotización de respaldo */ });
  }
  const toUsd = (uyu) => (usdRate.value ? Math.ceil((uyu / usdRate.value) * 100) / 100 : null); // se redondea hacia arriba al centavo
  const fmtUsd = (n) => `US$\u00a0${n.toFixed(2).replace('.', ',')}`;
  const fmtRate = (n) => `$\u00a0${Number(n).toFixed(2).replace('.', ',')}`; // la cotización se muestra con centavos
  // "Envío gratis por Gestión Post (gratis)" sería repetido: si el nombre ya dice gratis, no se agrega entre paréntesis.
  const shipLine = (label, costText) => (/gratis/i.test(label) && /^gratis$/i.test(costText) ? label : `${label} (${costText})`);
  function updateUsdNote() {
    const note = $('[data-usd-note]');
    if (!note) return;
    const m = selected(CONFIG.payments || [], val('pago'));
    const usd = m && m.type === 'paypal' ? toUsd(Cart.subtotal() + (shipCost(selected(CONFIG.shipping || [], val('envio')), Cart.subtotal()) || 0)) : null;
    note.hidden = !usd;
    if (usd) note.innerHTML = `<b>Total en dólares para PayPal: ${fmtUsd(usd)}</b> (cotización: 1 US$ = ${fmtRate(usdRate.value)}).`;
  }
  const selected = (list, id) => list.find((x) => x.id === id) || list[0];
  const val = (name) => (form.elements[name]?.value || '').trim();
  const shipText = (cost, m) => (cost === null ? m.costLabel : cost === 0 ? 'Gratis' : fmt(cost));

  function updateShippingLabel() {
    const m = selected(CONFIG.shipping || [], val('envio'));
    const sub = Cart.subtotal();
    const cost = shipCost(m, sub);
    $('[data-summary-shipping]').textContent = m ? shipText(cost, m) : '';
    $('[data-summary-total]').textContent = fmt(sub + (cost || 0));
    updateUsdNote();
  }
  // Gestión Post (envío gratis) solo está disponible para compras desde minSubtotal; por debajo se usa DAC.
  function applyShippingRules() {
    const sub = Cart.subtotal();
    const inputs = $$('input[name="envio"]', form);
    inputs.forEach((input) => {
      const m = (CONFIG.shipping || []).find((x) => x.id === input.value);
      const tag = input.closest('label').querySelector('.option-tag');
      const blocked = !!(m && m.minSubtotal && sub < m.minSubtotal);
      input.disabled = blocked;
      input.closest('label').classList.toggle('option-disabled', blocked);
      if (tag && m) tag.textContent = blocked ? `Te faltan ${fmt(m.minSubtotal - sub)}` : (m.costLabel || m.eta || '');
    });
    // Elegimos el mejor envío disponible: el gratis si la compra llega al mínimo; si no, el primero habilitado.
    const free = inputs.find((i) => !i.disabled && (CONFIG.shipping || []).some((x) => x.id === i.value && x.minSubtotal));
    const current = inputs.find((i) => i.checked && !i.disabled);
    if (!current) { const pick = free || inputs.find((i) => !i.disabled); if (pick) pick.checked = true; }
    else if (free && !form.dataset.shipTouched) free.checked = true;
    updateShippingLabel();
  }
  form.addEventListener('change', (e) => {
    if (e.target.name === 'envio') { form.dataset.shipTouched = '1'; updateShippingLabel(); }
    if (e.target.name === 'pago' || e.target.name === 'envio') updateUsdNote();
  });

  function showState() {
    const lines = Cart.lines();
    const last = readLast();
    if (location.hash === '#confirmacion' && last) { if (last.pago && last.pago.type === 'mercadopago') Cart.clear(); showConfirmation(last); return; }
    wrapConf.hidden = true;
    const head0 = $('[data-checkout-head]'); if (head0) head0.hidden = false;
    wrapEmpty.hidden = lines.length > 0;
    wrapCheckout.hidden = lines.length === 0;
    if (lines.length) { renderSummary(); applyShippingRules(); }
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
    const ship = selected(CONFIG.shipping || [], val('envio'));
    if (ship && ship.minSubtotal && Cart.subtotal() < ship.minSubtotal) problems.push(`${ship.label} es para compras de ${fmt(ship.minSubtotal)} o más. Elegí DAC o sumá más perfumes.`);
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
    const o = {
      id: newOrderId(),
      date: new Date().toISOString(),
      nombre: val('nombre'), apellido: val('apellido'), telefono: val('telefono'),
      departamento: val('departamento'), localidad: val('localidad'), direccion: val('direccion'), obs: val('observaciones'),
      envio: ship, pago: pay,
      items: lines.map((l) => ({ id: l.id, n: l.n, qty: l.qty, p: l.p, line: l.line, i: l.i })),
      subtotal: Cart.subtotal(),
      envioCosto: shipCost(ship, Cart.subtotal()),
    };
    o.total = o.subtotal + (o.envioCosto || 0);
    if (pay && pay.type === 'paypal') { o.usd = toUsd(o.total); o.usdRate = usdRate.value; }
    return o;
  }
  function message(o) {
    const L = [];
    L.push(`*Pedido ${o.id} — ${CONFIG.site}*`, '');
    L.push(`*Cliente:* ${o.nombre} ${o.apellido}`, `*Teléfono:* ${o.telefono}`);
    L.push(`*Departamento:* ${o.departamento}${o.localidad ? ' · ' + o.localidad : ''}`, `*Dirección:* ${o.direccion}`);
    if (o.obs) L.push(`*Observaciones:* ${o.obs}`);
    const envio = shipText(o.envioCosto ?? null, o.envio);
    L.push(`*Envío:* ${shipLine(o.envio.label, envio)}`, `*Pago:* ${o.pago.label}${o.usd ? ' — ' + fmtUsd(o.usd) : ''}`, '', '*Productos:*');
    o.items.forEach((i) => L.push(`• ${i.qty} × ${i.n} — ${fmt(i.line)}`));
    L.push('', `Productos: ${fmt(o.subtotal)}`, `Envío: ${envio}`, `*Total:* ${fmt(o.total ?? o.subtotal)}`);
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
      form.elements['subtotal'].value = String(o.total ?? o.subtotal);
      const data = new URLSearchParams(new FormData(form));
      // Netlify solo guarda los campos que existen en el HTML: los radios de envío y pago los
      // agrega el JS, por eso se copian a estos campos ocultos para que lleguen en el mail.
      data.set('metodo_pago', o.pago.label);
      data.set('metodo_envio', `${o.envio.label} (${shipText(o.envioCosto ?? null, o.envio)})`);
      data.set('estado_pago', o.pago.type === 'mercadopago'
        ? 'Pendiente: el cliente fue a pagar a Mercado Pago. Confirmá en tu cuenta de MP con el número de pedido.'
        : 'Pendiente de pago: todavía no pagó.');
      await fetch(form.getAttribute('action') || '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data.toString() });
    } catch (_) { /* sin conexión o fuera de Netlify */ }
  }

  function showConfirmation(o) {
    wrapCheckout.hidden = true; wrapEmpty.hidden = true; wrapConf.hidden = false;
    const head = $('[data-checkout-head]'); if (head) head.hidden = true;
    $('[data-conf-id]').textContent = o.id;
    $('[data-conf-items]').innerHTML = o.items.map((i) => `<div class="sitem">${i.i ? `<img src="${esc(i.i)}" alt="" width="56" height="56">` : '<span class="sitem-ph"></span>'}<span><b>${esc(i.n)}</b><small>${i.qty} × ${fmt(i.p)}</small></span><span class="sitem-price">${fmt(i.line)}</span></div>`).join('');
    const total = o.total ?? o.subtotal;
    $('[data-conf-total]').textContent = fmt(total);
    $('[data-conf-ship]').textContent = `${shipLine(o.envio.label, shipText(o.envioCosto ?? null, o.envio)).replace(/\(([^)]*)\)$/, (m, t) => `(${t.toLowerCase()})`)}. Entrega estimada: ${o.envio.eta || 'a coordinar'}.`;
    const pay = $('[data-conf-pay]');
    const accs = o.pago.accounts || [];
    pay.innerHTML = o.pago.type === 'transfer' && accs.length
      ? `<h3>Cómo pagar</h3><p>Transferí <b>${fmt(total)}</b> ${accs.length > 1 ? 'a la cuenta que prefieras' : 'a esta cuenta'} y enviá el comprobante por WhatsApp indicando tu pedido <b>${esc(o.id)}</b>.</p>
         ${accs.map((acc) => `<dl class="acct"><div><dt>Banco</dt><dd>${esc(acc.bank)}</dd></div>${acc.type ? `<div><dt>Tipo</dt><dd>${esc(acc.type)}</dd></div>` : ''}<div><dt>Cuenta</dt><dd>${esc(acc.number)}</dd></div>${acc.currency ? `<div><dt>Moneda</dt><dd>${esc(acc.currency)}</dd></div>` : ''}<div><dt>Titular</dt><dd>${esc(acc.holder)}</dd></div><div><dt>Monto</dt><dd>${fmt(total)}</dd></div></dl>`).join('')}
         <p>Con el comprobante, preparamos y despachamos tu pedido.</p>`
      : o.pago.type === 'paypal'
        ? (() => {
          const usd = o.usd || toUsd(total);
          const base = (o.pago.link || '').replace(/\/+$/, '');
          const ok = usd && /^https:\/\/(www\.)?paypal\.me\/[A-Za-z0-9._-]+$/.test(base);
          return `<h3>Pagá con PayPal</h3><p>PayPal cobra en dólares. Tu pedido de <b>${fmt(total)}</b> son <b>${usd ? fmtUsd(usd) : 'USD (te confirmamos el monto)'}</b>${o.usdRate ? ` (cotización: 1 US$ = ${fmtRate(o.usdRate)})` : ''}.</p>
            ${ok ? `<p><a class="btn btn-gold btn-lg" href="${esc(base)}/${usd.toFixed(2)}USD" target="_blank" rel="noopener">PAGAR ${fmtUsd(usd)} CON PAYPAL</a></p>` : ''}
            <p>Cuando pagues, mandanos el comprobante por WhatsApp indicando tu pedido <b>${esc(o.id)}</b> y confirmamos el envío.</p>`;
        })()
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
      body: JSON.stringify({ orderId: o.id, items: o.items.map((i) => ({ id: i.id, qty: i.qty })), envio: o.envio.id, payer: { name: o.nombre, surname: o.apellido } }),
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
