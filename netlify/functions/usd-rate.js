/**
 * Cotización del dólar (pesos uruguayos por 1 USD) para convertir el total en PayPal.
 * Consulta una API pública sin clave; si falla, el navegador usa fallbackRate de data/config.json.
 * Solo se usa para mostrar el monto en USD: no toca precios ni cobros.
 */
const json = (statusCode, body, extra = {}) => ({ statusCode, headers: { 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(body) });

exports.handler = async () => {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { signal: ctl.signal });
    clearTimeout(timer);
    const j = await r.json();
    const rate = Number(j && j.rates && j.rates.UYU);
    if (!r.ok || j.result !== 'success' || !(rate > 10 && rate < 200)) throw new Error('bad_rate'); // rango razonable, por si la API devuelve algo raro
    return json(200, { rate, source: 'live', updated: j.time_last_update_utc }, { 'Cache-Control': 'public, max-age=1800' });
  } catch (_) {
    return json(503, { error: 'rate_unavailable' }, { 'Cache-Control': 'no-store' });
  }
};
