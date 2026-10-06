/**
 * Cobro online con Mercado Pago (Checkout Pro).
 * Se activa cargando MP_ACCESS_TOKEN en Netlify y poniendo "enabled": true en data/config.json.
 *
 * Seguridad: los precios NUNCA vienen del navegador. Se leen de data/products.json en el servidor,
 * así nadie puede modificar el monto desde la web.
 */
const fs = require('fs');
const path = require('path');

const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return json(503, { error: 'not_configured' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (_) { return json(400, { error: 'bad_json' }); }
  const { orderId, items, payer } = body;
  if (!/^CEN-[A-Z0-9]{5,12}$/.test(String(orderId || ''))) return json(400, { error: 'bad_order' });
  if (!Array.isArray(items) || !items.length || items.length > 20) return json(400, { error: 'bad_items' });

  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/products.json'), 'utf8')).products;
  const byId = Object.fromEntries(catalog.filter((p) => p.published !== false).map((p) => [p.id, p]));
  const mpItems = [];
  for (const it of items) {
    const p = byId[it.id];
    const qty = parseInt(it.qty, 10);
    if (!p || !(qty >= 1 && qty <= 10)) return json(400, { error: 'bad_item' });
    mpItems.push({ id: p.id, title: `${p.brand} ${p.name} ${p.ml ? p.ml + ' ml' : ''}`.trim(), quantity: qty, unit_price: Number(p.price), currency_id: 'UYU' });
  }

  const site = (process.env.URL || '').replace(/\/$/, '');
  const preference = {
    items: mpItems,
    external_reference: orderId,
    payer: { name: String((payer && payer.name) || '').slice(0, 60), surname: String((payer && payer.surname) || '').slice(0, 60) },
    statement_descriptor: 'CENTURION',
    ...(site ? { back_urls: { success: `${site}/checkout/#confirmacion`, pending: `${site}/checkout/#confirmacion`, failure: `${site}/checkout/` }, auto_return: 'approved' } : {}),
  };

  try {
    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(preference),
    });
    const data = await r.json();
    if (!r.ok || !data.init_point) return json(502, { error: 'mp_error' });
    return json(200, { url: data.init_point });
  } catch (_) {
    return json(502, { error: 'mp_unreachable' });
  }
};
