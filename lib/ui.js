// Componentes visuales reutilizables: íconos, tarjetas, layout general.
const { esc, fmt, waLink } = require('./model');

/* ───────── Íconos (sprite SVG inline) ───────── */
const ICONS = {
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
  card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
  bank: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  cart: '<path d="M3 4h2.5l2 11h10l2-8H7"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  gift: '<rect x="3" y="9" width="18" height="11" rx="1.5"/><path d="M12 9v11M3 13h18M12 9c-2-4-6-4-6-1.5S10 9 12 9zm0 0c2-4 6-4 6-1.5S14 9 12 9z"/>',
  drop: '<path d="M12 3s6 6.2 6 10.5A6 6 0 016 13.5C6 9.2 12 3 12 3z"/>',
};
const WA_PATH = 'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.7.3 1.26.49 1.7.63.72.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.83 9.83 0 016.99 2.9 9.82 9.82 0 012.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.8 11.8 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.68 1.45c6.55 0 11.89-5.34 11.89-11.9a11.8 11.8 0 00-3.48-8.41z';

const sprite = () =>
  `<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false"><defs>` +
  Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`).join('') +
  `<symbol id="i-whatsapp" viewBox="0 0 24 24"><path fill="currentColor" d="${WA_PATH}"/></symbol></defs></svg>`;

const icon = (name, cls = '') => `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

/* ───────── Imágenes de producto ───────── */
function placeholder(p) {
  return `<div class="ph" role="img" aria-label="${esc(p.fullName)} — foto próximamente">
    <svg viewBox="0 0 120 150" class="ph-bottle" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><rect x="46" y="14" width="28" height="18" rx="2"/><rect x="54" y="32" width="12" height="9"/><rect x="26" y="41" width="68" height="94" rx="9"/><rect x="38" y="62" width="44" height="40" rx="2" opacity=".55"/><path d="M26 118h68" opacity=".55"/></g></svg>
    <span class="ph-note">Foto próximamente</span></div>`;
}

function productImg(p, { eager = false, sizes = '(min-width:1200px) 290px,(min-width:900px) 31vw,48vw' } = {}) {
  if (p.photoPending) return placeholder(p);
  const alt = `${p.fullName} — perfume ${p.genderSeo} ${p.brand}`;
  return `<img src="/img/products/${p.image}-sm.webp" srcset="/img/products/${p.image}-sm.webp 560w, /img/products/${p.image}.webp 1200w" sizes="${sizes}" width="560" height="560" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

/* ───────── Tarjeta de producto ───────── */
function badges(p) {
  const out = [];
  if (p.discount) out.push(`<span class="badge badge-sale">-${p.discount}%</span>`);
  if (p.isPack) out.push('<span class="badge badge-pack">Pack</span>');
  if (p.isBest) out.push('<span class="badge badge-best">Más vendido</span>');
  if (p.isNew) out.push('<span class="badge badge-new">Nuevo</span>');
  return out.length ? `<span class="pcard-badges">${out.join('')}</span>` : '';
}

function priceBlock(p, big = false) {
  return `<p class="price${big ? ' price-lg' : ''}"><span class="price-now">${fmt(p.price)}</span>${p.oldPrice ? `<s class="price-old" aria-label="Precio anterior">${fmt(p.oldPrice)}</s>` : ''}</p>`;
}

function card(p, { variant = '', eager = false, reveal = true } = {}) {
  const meta = [p.concentration, p.ml ? `${p.ml} ml` : '', p.genderLabel].filter(Boolean).join(' · ');
  return `<article class="pcard${variant ? ' pcard-' + variant : ''}${reveal ? ' reveal' : ''}" data-id="${p.id}" data-gender="${p.gender}" data-tags="${esc(p.tags.join(' '))}" data-brand="${p.brandSlug}" data-price="${p.price}" data-priority="${p.priority + (p.photoPending ? 1000 : 0)}" data-name="${esc(p.fullName.toLowerCase())}" data-best="${p.isBest ? 1 : 0}" data-new="${p.isNew ? 1 : 0}">
  <a class="pcard-media" href="${p.url}" tabindex="-1" aria-hidden="true">${productImg(p, { eager })}${p.gallery[0] ? `<img class="alt" src="/img/products/${p.gallery[0]}-sm.webp" alt="" width="560" height="560" loading="lazy" decoding="async">` : ''}${badges(p)}</a>
  <div class="pcard-body">
    <p class="pcard-brand">${esc(p.brand)}</p>
    <h3 class="pcard-name"><a href="${p.url}">${esc(p.name)}</a></h3>
    <p class="pcard-meta">${esc(meta)}</p>
    <p class="pcard-family">${esc(p.family)}</p>
    ${priceBlock(p)}
    ${variant === 'offer' && p.oldPrice ? `<p class="pcard-save">Ahorrás ${fmt(p.saving)}</p>` : ''}
    <div class="pcard-actions">
      <a class="btn btn-ghost btn-sm" href="${p.url}">VER PRODUCTO</a>
      <button class="btn btn-gold btn-sm" type="button" data-add="${p.id}">AGREGAR AL CARRITO</button>
    </div>
  </div>
</article>`;
}

/* ───────── Layout general ───────── */
const NAV = [
  ['INICIO', '/'],
  ['PERFUMES', '/#perfumes'],
  ['MARCAS', '/#marcas'],
  ['OFERTAS', '/#ofertas'],
  ['NOSOTROS', '/#nosotros'],
  ['CONTACTO', '/#contacto'],
];

function header(ctx, current) {
  const { config } = ctx;
  const links = NAV.map(([t, h]) => `<a href="${h}"${h === current ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  return `<div class="announce"><p><span>Originales y sellados</span><i aria-hidden="true"></i><span>Envíos a todo Uruguay por DAC</span><i aria-hidden="true"></i><span>Entrega en ${esc((config.shipping.methods[0] || {}).eta || '2 a 3 días hábiles')}</span></p></div>
<header class="site-header" id="top">
  <div class="container header-in">
    <a class="brand" href="/" aria-label="${esc(config.site.name)} — inicio">
      <img src="/img/logo-emblem.png" width="44" height="44" alt="" class="brand-emblem">
      <span class="brand-text"><span class="brand-top">PERFUMERÍA</span><span class="brand-main">CENTURIÓN</span></span>
    </a>
    <nav class="nav-desktop" aria-label="Principal">${links}</nav>
    <div class="header-actions">
      <button class="cart-btn" type="button" data-open-cart aria-label="Abrir carrito"><span class="cart-btn-label">CARRITO</span>${icon('cart')}<span class="cart-count" data-cart-count hidden>0</span></button>
      <button class="menu-btn" type="button" data-open-menu aria-label="Abrir menú" aria-expanded="false" aria-controls="mobile-menu">${icon('menu')}</button>
    </div>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" hidden>
  <div class="mobile-menu-in">
    <button class="icon-btn mobile-menu-close" type="button" data-close-menu aria-label="Cerrar menú">${icon('close')}</button>
    <nav aria-label="Menú móvil">${links}<button type="button" class="mm-cart" data-open-cart>${icon('cart')} CARRITO <span class="cart-count" data-cart-count hidden>0</span></button></nav>
    <div class="mobile-menu-foot">
      <a class="btn btn-wa btn-block" href="${waLink(config, 'Hola, quiero consultar por un perfume.')}" target="_blank" rel="noopener">${icon('whatsapp')} ESCRIBINOS POR WHATSAPP</a>
      <a class="btn btn-ghost btn-block" href="https://instagram.com/${config.contact.instagram}" target="_blank" rel="noopener">${icon('instagram')} @${esc(config.contact.instagram)}</a>
    </div>
  </div>
</div>`;
}

function cartDrawer(ctx) {
  return `<div class="overlay" data-overlay hidden></div>
<aside class="drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" aria-hidden="true" tabindex="-1">
  <div class="drawer-head"><h2 id="cart-title">TU CARRITO</h2><button class="icon-btn" type="button" data-close-cart aria-label="Cerrar carrito">${icon('close')}</button></div>
  <div class="drawer-body" data-cart-items></div>
  <div class="drawer-foot" data-cart-foot hidden>
    <dl class="totals">
      <div><dt>Subtotal</dt><dd data-cart-subtotal>$ 0</dd></div>
      <div><dt>Envío</dt><dd data-cart-shipping>A pagar en destino</dd></div>
      <div class="totals-final"><dt>Total productos</dt><dd data-cart-total>$ 0</dd></div>
    </dl>
    <a class="btn btn-gold btn-lg btn-block" href="/checkout/">FINALIZAR COMPRA</a>
    <button class="btn btn-link btn-block" type="button" data-close-cart>Seguir comprando</button>
  </div>
</aside>
<div class="toast" data-toast role="status" aria-live="polite" hidden></div>`;
}

function footer(ctx) {
  const { config, products } = ctx;
  const c = config.contact;
  const brands = config.brands.filter((b) => products.some((p) => p.brandSlug === b.slug));
  return `<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <a class="brand" href="/"><img src="/img/logo-emblem.png" width="56" height="56" alt="" class="brand-emblem"><span class="brand-text"><span class="brand-top">PERFUMERÍA</span><span class="brand-main">CENTURIÓN</span></span></a>
      <p>${esc(config.site.tagline)}. ${esc(config.policies.originals)}</p>
    </div>
    <div><h3>Tienda</h3><ul><li><a href="/#perfumes">Perfumes</a></li><li><a href="/#ofertas">Ofertas</a></li><li><a href="/#marcas">Marcas</a></li><li><a href="/#envios">Envíos</a></li><li><a href="/#preguntas">Preguntas frecuentes</a></li></ul></div>
    <div><h3>Marcas</h3><ul>${brands.slice(0, 6).map((b) => `<li><a href="/marcas/${b.slug}/">${esc(b.name)}</a></li>`).join('')}</ul></div>
    <div><h3>Contacto</h3><ul>
      <li><a href="${waLink(config)}" target="_blank" rel="noopener">WhatsApp ${esc(c.whatsappDisplay)}</a></li>
      <li><a href="https://instagram.com/${c.instagram}" target="_blank" rel="noopener">Instagram @${esc(c.instagram)}</a></li>
      <li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li></ul></div>
  </div>
  <div class="container footer-bottom"><p>© ${new Date().getFullYear()} ${esc(config.site.name)}. Montevideo, Uruguay.</p><p>Los precios están expresados en pesos uruguayos ($U).</p></div>
</footer>
<a class="wa-float" href="${waLink(config, 'Hola, quiero consultar por un perfume.')}" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp" data-wa-float>${icon('whatsapp')}<span class="wa-float-label">WhatsApp</span></a>`;
}

/**
 * Esqueleto HTML común a todas las páginas.
 */
function layout(ctx, o) {
  const { config, products, ver } = ctx;
  const site = config.site;
  const url = site.url.replace(/\/$/, '');
  const canonical = url + (o.path || '/');
  const ogImage = o.ogImage ? (o.ogImage.startsWith('http') ? o.ogImage : url + o.ogImage) : url + '/img/og-image.jpg';
  const bf = config.instagram.beholdFeedId;
  const csp = [
    "default-src 'self'",
    `script-src 'self'${bf ? ' https://w.behold.so' : ''}`,
    "style-src 'self'",
    "font-src 'self'",
    `img-src 'self' data:${bf ? ' https://*.behold.so https://*.cdninstagram.com https://*.fbcdn.net' : ''}`,
    `connect-src 'self'${bf ? ' https://feeds.behold.so' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  // Datos mínimos para el carrito (los precios SIEMPRE se leen del catálogo, nunca del navegador)
  const catalog = products.map((p) => ({ id: p.id, n: p.fullName, b: p.brand, p: p.price, o: p.oldPrice || 0, i: p.photoPending ? '' : `/img/products/${p.image}-sm.webp`, u: p.url }));
  const pub = {
    wa: config.contact.whatsapp,
    site: site.name,
    shipping: config.shipping.methods.map(({ id, label, description, costLabel, eta }) => ({ id, label, description, costLabel, eta })),
    payments: config.payments.methods.filter((m) => m.enabled).map((m) => ({ id: m.id, type: m.type, label: m.label, description: m.description, ...(o.withAccount && m.account ? { account: m.account } : {}) })),
    departamentos: config.departamentos,
  };
  const jsonScript = (id, data) => `<script type="application/json" id="${id}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

  return `<!doctype html>
<html lang="${site.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${o.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="theme-color" content="#ffffff">
<meta name="color-scheme" content="light">
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="es_UY">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32.png">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preload" href="/fonts/InstrumentSans-600-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/InstrumentSans-400-latin.woff2" as="font" type="font/woff2" crossorigin>
${o.preload || ''}
<link rel="stylesheet" href="/css/styles.css?v=${ver}">
<script src="/js/boot.js?v=${ver}"></script>
${(o.ld || []).map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body class="${o.bodyClass || ''}">
<a class="skip-link" href="#main">Saltar al contenido</a>
${header(ctx, o.nav)}
<main id="main">
${o.body}
</main>
${footer(ctx)}
${cartDrawer(ctx)}
${sprite()}
${jsonScript('catalog-data', catalog)}
${jsonScript('site-config', pub)}
${bf ? '<script src="https://w.behold.so/widget.js" type="module" async></script>' : ''}
<script src="/js/app.js?v=${ver}" defer></script>
${o.scripts || ''}
</body>
</html>`;
}

module.exports = { icon, card, productImg, priceBlock, badges, layout, placeholder };
