// Genera el HTML de cada página del sitio.
const { esc, fmt, waLink, waProductMsg, GENDER } = require('./model');
const { icon, card, productImg, priceBlock, badges, layout } = require('./ui');

const FILTERS = [
  ['todos', 'Todos'], ['masculino', 'Masculinos'], ['femenino', 'Femeninos'], ['unisex', 'Unisex'],
  ['dulce', 'Dulces'], ['fresco', 'Frescos'], ['amaderado', 'Amaderados'], ['especiado', 'Especiados'],
  ['best', 'Más vendidos'], ['new', 'Nuevos ingresos'],
];

const sectionHead = (eyebrow, title, lead, { center = true, tag = 'h2' } = {}) =>
  `<div class="section-head${center ? ' center' : ''} reveal"><p class="eyebrow">${esc(eyebrow)}</p><${tag} class="section-title">${title}</${tag}><span class="orn" aria-hidden="true"><i></i><b></b><i></i></span>${lead ? `<p class="section-lead">${lead}</p>` : ''}</div>`;

function pages(ctx) {
  const { config, products } = ctx;
  const site = config.site;
  const url = site.url.replace(/\/$/, '');
  const ig = `https://instagram.com/${config.contact.instagram}`;
  const out = {};

  const best = products.filter((p) => p.isBest && !p.isPack);
  const offers = products.filter((p) => p.oldPrice);
  const brands = config.brands
    .map((b) => ({ ...b, items: products.filter((p) => p.brandSlug === b.slug) }))
    .filter((b) => b.items.length);
  // Marcas presentes en productos pero no declaradas en config (se agregan solas)
  const known = new Set(config.brands.map((b) => b.slug));
  products.forEach((p) => {
    if (!known.has(p.brandSlug)) {
      known.add(p.brandSlug);
      brands.push({ name: p.brand, slug: p.brandSlug, origin: '', blurb: '', items: products.filter((x) => x.brandSlug === p.brandSlug) });
    }
  });

  const eta = config.shipping.methods[0]?.eta || '2 a 3 días hábiles';
  const enabledPayments = config.payments.methods.filter((m) => m.enabled);
  const orgLD = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url,
    logo: `${url}/img/icon-512.png`,
    email: config.contact.email,
    telephone: `+${config.contact.whatsapp}`,
    areaServed: 'UY',
    sameAs: [ig],
  };

  /* ───────────────────────── HOME ───────────────────────── */
  const faqs = [
    ['¿Los perfumes son originales?', `Sí. ${config.policies.originals}`],
    ['¿Cómo hago mi pedido?', 'Agregás los perfumes al carrito, completás tus datos y finalizás la compra en la web. Si preferís, también podés enviar el pedido directamente por WhatsApp.'],
    ['¿Qué medios de pago aceptan?', `${enabledPayments.map((m) => m.label).join(', ')}. Al finalizar tu pedido te mostramos los datos de pago y nos enviás el comprobante por WhatsApp.`],
    ['¿Cómo y cuándo llega mi pedido?', `Enviamos a todo Uruguay por DAC. El costo del envío lo pagás vos en destino, al recibirlo. El tiempo de entrega es de ${eta}. En Montevideo también podemos coordinar la entrega.`],
    ['¿Puedo reservar un perfume?', `${config.policies.reservations} Escribinos por WhatsApp y te ayudamos.`],
    ['¿Hacen precios por cantidad o para reventa?', 'Sí. Consultanos por precios especiales por cantidad o reventa.'],
    ['¿Cómo confirmo la disponibilidad?', 'Si querés confirmar disponibilidad antes de pagar, escribinos por WhatsApp y te respondemos enseguida.'],
  ];

  const heroImg = '/img/hero.webp';
  const byId = (id) => products.find((x) => x.id === id);
  const featured = byId(config.featured) || best[0] || products[0];
  const tickerBrands = brands.map((b) => esc(b.name.toUpperCase()));
  const tickerRow = tickerBrands.map((n) => `<span>${n}</span><i aria-hidden="true">✦</i>`).join('') + ['ORIGINALES Y SELLADOS', 'ENVÍOS A TODO URUGUAY'].map((n) => `<span>${n}</span><i aria-hidden="true">✦</i>`).join('');
  const orn = '<span class="orn" aria-hidden="true"><i></i><b></b><i></i></span>';
  const head = (eyebrow, title, lead, o = {}) => `<div class="section-head${o.left ? '' : ' center'} reveal"><p class="eyebrow">${esc(eyebrow)}</p><${o.tag || 'h2'} class="section-title">${title}</${o.tag || 'h2'}>${orn}${lead ? `<p class="section-lead">${lead}</p>` : ''}</div>`;
  const aromaTiles = (config.aromas || []).map((a) => { const pr = byId(a.product); return pr && !pr.photoPending ? `<a class="aroma reveal" href="/?filtro=${a.key}#perfumes"><span class="aroma-arch"><img src="/img/products/${pr.image}-sm.webp" alt="" width="560" height="560" loading="lazy" decoding="async"></span><span class="aroma-label">${esc(a.label)}</span><span class="aroma-text">${esc(a.text)}</span><span class="aroma-go">Explorar ${icon('arrow')}</span></a>` : ''; }).join('');
  const featStages = [['top', 'Salida'], ['heart', 'Corazón'], ['base', 'Fondo']].filter(([k]) => featured.notes[k] && featured.notes[k].length);

  const home = `
<section class="hero" id="inicio">
  <div class="hero-media" aria-hidden="true"><img src="${heroImg}" alt="" width="972" height="972" fetchpriority="high"></div>
  <div class="hero-shade" aria-hidden="true"></div>
  <div class="hero-pattern" aria-hidden="true"></div>
  <div class="hero-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="container hero-in">
    <p class="hero-kicker"><span>Perfumes árabes originales</span><i aria-hidden="true">✦</i><span>Uruguay</span></p>
    <h1 class="hero-title"><span class="hero-t1">PERFUMERÍA</span><span class="hero-t2">CENTURIÓN</span></h1>
    ${orn}
    <p class="hero-text">“${esc(site.heroText)}”</p>
    <div class="hero-cta">
      <a class="btn btn-gold btn-lg" href="#perfumes">VER PERFUMES</a>
      <a class="btn btn-ghost btn-lg" href="#mas-vendidos">COMPRAR AHORA</a>
    </div>
  </div>
  <a class="scroll-hint" href="#confianza" aria-label="Bajar"><span></span></a>
</section>

<div class="ticker" aria-hidden="true"><div class="ticker-track">${tickerRow}${tickerRow}${tickerRow}${tickerRow}</div></div>

<section class="strip" id="confianza" aria-label="Por qué comprar">
  <ul class="container strip-in">
    <li>${icon('shield')}<span><b>Originales y sellados</b>Cada frasco, cerrado</span></li>
    <li>${icon('truck')}<span><b>Envíos a todo Uruguay</b>Por DAC · ${esc(eta)}</span></li>
    <li>${icon('chat')}<span><b>Atención personalizada</b>Por WhatsApp e Instagram</span></li>
    <li>${icon('lock')}<span><b>Compra simple y segura</b>Confirmamos cada pedido</span></li>
  </ul>
</section>

${aromaTiles ? `<section class="section section-pattern" id="aromas">
  <div class="container">
    ${head('Elegí tu estilo', 'EXPLORÁ POR AROMA', 'Cada familia olfativa cuenta una historia distinta. ¿Cuál es la tuya?')}
    <div class="aroma-grid">${aromaTiles}</div>
  </div>
</section>` : ''}

${best.length ? `<section class="section" id="mas-vendidos">
  <div class="container">
    ${head('Favoritos de nuestros clientes', 'LOS MÁS ELEGIDOS', 'Los perfumes que más piden. Una buena forma de empezar.')}
  </div>
  <div class="hscroll-wrap"><div class="hscroll" tabindex="0" aria-label="Perfumes más vendidos">${best.slice(0, 9).map((p) => card(p, { variant: 'slide', reveal: false })).join('')}</div></div>
</section>` : ''}

<section class="section feature" id="destacado">
  <div class="container feature-in">
    <a class="feature-media reveal" href="${featured.url}" aria-label="Ver ${esc(featured.fullName)}"><span class="feature-arch">${productImg(featured, { sizes: '(min-width:900px) 40vw, 90vw' })}</span><span class="feature-seal">Selección<br>Centurión</span></a>
    <div class="feature-text reveal">
      <p class="eyebrow">Perfume destacado</p>
      <h2 class="feature-title">${esc(featured.brand)}<br>${esc(featured.name)}</h2>
      ${orn.replace('class="orn"', 'class="orn orn-left"')}
      <p class="feature-desc">${esc(featured.description)}</p>
      ${featStages.length ? `<dl class="feature-notes">${featStages.map(([k, l]) => `<div><dt>${l}</dt><dd>${featured.notes[k].slice(0, 3).map(esc).join(' · ')}</dd></div>`).join('')}</dl>` : ''}
      <p class="feature-price">${fmt(featured.price)}</p>
      <div class="feature-cta"><button class="btn btn-gold btn-lg" type="button" data-add="${featured.id}">AGREGAR AL CARRITO</button><a class="btn btn-ghost btn-lg" href="${featured.url}">VER PRODUCTO</a></div>
    </div>
  </div>
</section>

<section class="section section-alt" id="perfumes">
  <div class="container">
    ${head('Catálogo', 'NUESTROS PERFUMES', `${products.length} fragancias árabes originales y selladas. Filtrá por género o familia olfativa y encontrá la tuya.`)}
    <div class="toolbar reveal">
      <div class="chips" role="group" aria-label="Filtrar perfumes" data-filters>
        ${FILTERS.map(([k, l], i) => `<button type="button" class="chip${i === 0 ? ' is-active' : ''}" data-filter="${k}" aria-pressed="${i === 0}">${l}</button>`).join('')}
      </div>
      <div class="toolbar-row">
        <label class="search"><span class="sr-only">Buscar perfume</span>${icon('search')}<input type="search" placeholder="Buscar por nombre o marca" data-search autocomplete="off"></label>
        <label class="select"><span class="sr-only">Marca</span><select data-brand-filter><option value="">Todas las marcas</option>${brands.map((b) => `<option value="${b.slug}">${esc(b.name)} (${b.items.length})</option>`).join('')}</select></label>
        <label class="select"><span class="sr-only">Ordenar</span><select data-sort><option value="priority">Destacados</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="name">Nombre (A-Z)</option></select></label>
      </div>
      <p class="result-count" data-count aria-live="polite">Mostrando ${products.length} perfumes</p>
    </div>
    <div class="grid-products" data-grid>${products.map((p) => card(p)).join('')}</div>
    <div class="empty" data-empty hidden><p>No encontramos perfumes con esos filtros.</p><button class="btn btn-ghost" type="button" data-reset>VER TODOS</button><a class="btn btn-wa" href="${waLink(config, 'Hola, estoy buscando un perfume que no encuentro en la web.')}" target="_blank" rel="noopener">CONSULTAR POR WHATSAPP</a></div>
  </div>
</section>

${offers.length ? `<section class="section section-offers" id="ofertas">
  <div class="container">
    ${head('Precios especiales', 'OFERTAS Y OPORTUNIDADES', 'Descuentos y packs seleccionados. Mirá el precio anterior y cuánto ahorrás.')}
    <div class="grid-products grid-offers">${offers.map((p) => card(p, { variant: 'offer' })).join('')}</div>
  </div>
</section>` : ''}

<section class="section" id="marcas">
  <div class="container">
    ${head('Casas perfumistas', 'NUESTRAS MARCAS', 'Las casas árabes más buscadas, siempre con producto original.')}
    <div class="brand-grid">${brands.map((b) => `<a class="brand-card reveal" href="/marcas/${b.slug}/"><span class="brand-card-name">${esc(b.name.toUpperCase())}</span>${b.origin ? `<span class="brand-card-origin">${esc(b.origin)}</span>` : ''}<span class="brand-card-count">${b.items.length} ${b.items.length === 1 ? 'perfume' : 'perfumes'} ${icon('arrow')}</span></a>`).join('')}</div>
  </div>
</section>

<section class="section section-cream" id="porque">
  <div class="container">
    ${head('Confianza', '¿POR QUÉ CENTURIÓN?', 'Una perfumería seria, cercana y pensada para que comprar sea fácil.')}
    <div class="why-grid">${config.trust.map((t) => `<div class="why-item reveal"><span class="why-icon">${icon(t.icon)}</span><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></div>`).join('')}</div>
  </div>
</section>

<section class="section section-pattern" id="como-comprar">
  <div class="container">
    ${head('Simple y rápido', 'ASÍ DE FÁCIL', 'Tu perfume en tres pasos.')}
    <ol class="steps">
      <li class="reveal"><span class="step-n">I</span><h3>Elegí tu perfume</h3><p>Explorá el catálogo, filtrá por aroma y agregalo al carrito.</p></li>
      <li class="reveal"><span class="step-n">II</span><h3>Hacé tu pedido</h3><p>Completá tus datos en la web o enviá el pedido directo por WhatsApp.</p></li>
      <li class="reveal"><span class="step-n">III</span><h3>Recibilo en todo Uruguay</h3><p>Pagás por transferencia y te lo enviamos por DAC en ${esc(eta)}.</p></li>
    </ol>
  </div>
</section>

<section class="section" id="nosotros">
  <div class="container about">
    <div class="about-media reveal"><span class="about-arch"><img src="/img/products/${(byId('club-de-nuit-oud') || featured).image}.webp" width="1024" height="1280" alt="Perfume árabe en su estuche" loading="lazy" decoding="async"></span></div>
    <div class="about-text reveal">
      <p class="eyebrow">Nosotros</p>
      <h2 class="section-title">UNA PERFUMERÍA QUE CUIDA CADA DETALLE</h2>
      ${orn.replace('class="orn"', 'class="orn orn-left"')}
      <p>Perfumería Centurión es un emprendimiento uruguayo especializado en perfumes árabes originales e importados. Seleccionamos cada fragancia por su calidad, su fijación y su proyección, para que lleves un perfume que se note y que dure.</p>
      <p>Como el centurión del escudo, cuidamos cada detalle: productos originales y sellados, atención directa y un proceso de compra simple, desde que elegís hasta que el pedido llega a tus manos.</p>
      <ul class="about-list">
        <li>${icon('check')} Atención personalizada por WhatsApp e Instagram</li>
        <li>${icon('check')} ${esc(config.policies.reservations.replace(/\.$/, ''))}</li>
        <li>${icon('check')} Precios especiales por cantidad o reventa</li>
      </ul>
      <a class="btn btn-ghost" href="#contacto">HABLÁ CON NOSOTROS</a>
    </div>
  </div>
</section>

<section class="section section-alt" id="envios">
  <div class="container">
    ${head('Logística', config.shipping.title.toUpperCase(), esc(config.shipping.intro))}
    <div class="info-grid">${config.shipping.methods.map((m) => `<article class="info-card reveal"><span class="info-icon">${icon('truck')}</span><h3>${esc(m.label)}</h3><p>${esc(m.description)}</p><dl><div><dt>Costo</dt><dd>${esc(m.costLabel)}</dd></div><div><dt>Quién lo paga</dt><dd>${esc(m.who)}</dd></div><div><dt>Tiempo</dt><dd>${esc(m.eta)}</dd></div></dl></article>`).join('')}</div>
    <ul class="notes reveal">${config.shipping.notes.map((n) => `<li>${icon('check')}${esc(n)}</li>`).join('')}</ul>
  </div>
</section>

<section class="section" id="pagos">
  <div class="container">
    ${head('Pagá a tu manera', config.payments.title.toUpperCase(), esc(config.payments.intro.replace(' Podés agregar o quitar métodos editando esta lista.', '')))}
    <div class="info-grid info-grid-sm">${enabledPayments.map((m) => `<article class="info-card reveal"><span class="info-icon">${icon(m.icon || 'card')}</span><h3>${esc(m.label)}</h3><p>${esc(m.description)}</p></article>`).join('')}</div>
  </div>
</section>

<section class="section section-ig" id="instagram">
  <div class="container ig">
    <div class="ig-text reveal">
      <p class="eyebrow">@${esc(config.contact.instagram)}</p>
      <h2 class="section-title">SEGUINOS EN INSTAGRAM</h2>
      ${orn.replace('class="orn"', 'class="orn orn-left"')}
      <p>Descubrí nuevos ingresos, promociones y recomendaciones de fragancias.</p>
      <a class="btn btn-gold btn-lg" href="${ig}" target="_blank" rel="noopener">${icon('instagram')} IR A INSTAGRAM</a>
    </div>
    <div class="ig-grid reveal">${config.instagram.beholdFeedId ? `<behold-widget feed-id="${esc(config.instagram.beholdFeedId)}"></behold-widget>` : products.filter((p) => !p.photoPending && !p.isPack).slice(0, 6).map((p) => `<a href="${ig}" target="_blank" rel="noopener" aria-label="Ver ${esc(p.fullName)} en Instagram"><img src="/img/products/${p.image}-sm.webp" width="560" height="560" alt="${esc(p.fullName)}" loading="lazy" decoding="async"></a>`).join('')}</div>
  </div>
</section>

<section class="section" id="preguntas">
  <div class="container narrow">
    ${head('Ayuda', 'PREGUNTAS FRECUENTES', '')}
    <div class="faq">${faqs.map(([q, a]) => `<details class="reveal"><summary>${esc(q)}${icon('plus', 'faq-i')}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </div>
</section>

<section class="section section-cta" id="contacto">
  <div class="container">
    ${head('Contacto', 'HABLEMOS', '¿Dudas sobre un perfume, disponibilidad o precios por cantidad? Escribinos, te respondemos personalmente.')}
    <div class="contact-grid">
      <a class="contact-card reveal" href="${waLink(config, 'Hola, quiero consultar por un perfume.')}" target="_blank" rel="noopener"><span class="info-icon wa">${icon('whatsapp')}</span><h3>WhatsApp</h3><p>${esc(config.contact.whatsappDisplay)}</p><span class="contact-go">Escribir ${icon('arrow')}</span></a>
      <a class="contact-card reveal" href="${ig}" target="_blank" rel="noopener"><span class="info-icon">${icon('instagram')}</span><h3>Instagram</h3><p>@${esc(config.contact.instagram)}</p><span class="contact-go">Ver perfil ${icon('arrow')}</span></a>
      <a class="contact-card reveal" href="mailto:${esc(config.contact.email)}"><span class="info-icon">${icon('mail')}</span><h3>Email</h3><p>${esc(config.contact.email)}</p><span class="contact-go">Enviar ${icon('arrow')}</span></a>
    </div>
    <p class="fineprint">${esc(config.policies.wholesale)} ${esc(config.policies.availability)}</p>
  </div>
</section>`;

  out['index.html'] = layout(ctx, {
    title: 'Perfumes árabes originales en Uruguay | Perfumería Centurión',
    description: 'Perfumería online en Uruguay: perfumes árabes originales e importados Lattafa, Afnan, Armaf y más. Envíos a todo el país por DAC. Comprá por la web o por WhatsApp.',
    path: '/',
    nav: '/',
    preload: `<link rel="preload" as="image" href="${heroImg}" fetchpriority="high">`,
    ld: [
      orgLD,
      { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url, inLanguage: 'es-UY' },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
    body: home,
    bodyClass: 'page-home',
  });

  /* ───────────────────── PÁGINAS DE PRODUCTO ───────────────────── */
  for (const p of products) {
    const related = products
      .filter((x) => x.id !== p.id && !x.isPack)
      .map((x) => ({ x, s: x.tags.filter((t) => p.tags.includes(t)).length * 2 + (x.gender === p.gender ? 2 : 0) + (x.brandSlug === p.brandSlug ? 1 : 0) }))
      .sort((a, b) => b.s - a.s || a.x.priority - b.x.priority).slice(0, 4).map((r) => r.x);
    const stages = [['top', 'Notas de salida'], ['heart', 'Notas de corazón'], ['base', 'Notas de fondo']].filter(([k]) => p.notes[k] && p.notes[k].length);
    const hasAllStages = stages.length === 3;
    const meta = [p.concentration, p.ml ? `${p.ml} ml` : '', p.genderLabel].filter(Boolean).join(' · ');
    const specs = [
      ['Marca', `<a href="/marcas/${p.brandSlug}/">${esc(p.brand)}</a>`],
      ['Género', esc(p.genderLabel)],
      ['Tamaño', p.ml ? `${p.ml} ml` : '—'],
      ['Concentración', esc(p.concentration || '—')],
      ['Familia olfativa', esc(p.family)],
      ['Duración aproximada', esc(p.longevity || '—')],
      ['Proyección', esc(p.projection || '—')],
      ['Temporada', esc(p.season || '—')],
    ];
    const packItems = (p.pack || []).map((id) => products.find((x) => x.id === id)).filter(Boolean);
    const imgBig = p.photoPending ? productImg(p, { eager: true }) : `<img src="/img/products/${p.image}.webp" srcset="/img/products/${p.image}-sm.webp 560w, /img/products/${p.image}.webp 1200w" sizes="(min-width:900px) 50vw, 100vw" width="1200" height="1200" alt="${esc(`${p.fullName} — perfume ${p.genderSeo} ${p.brand}`)}" fetchpriority="high" decoding="async">`;
    const body = `
<div class="container crumbs-wrap"><nav class="crumbs" aria-label="Migas de pan"><a href="/">Inicio</a><span>›</span><a href="/#perfumes">Perfumes</a><span>›</span><a href="/marcas/${p.brandSlug}/">${esc(p.brand)}</a><span>›</span><span aria-current="page">${esc(p.name)}</span></nav></div>
<section class="container product" data-product="${p.id}">
  <div class="pgallery">
    <${p.photoPending ? 'div' : 'button type="button" data-zoom="/img/products/' + p.image + '.webp" aria-label="Ampliar foto"'} class="pgallery-main">${imgBig}${badges(p)}</${p.photoPending ? 'div' : 'button'}>
  </div>
  <div class="pinfo">
    <a class="pinfo-brand" href="/marcas/${p.brandSlug}/">${esc(p.brand)}</a>
    <h1 class="pinfo-title">${esc(p.name)}</h1>
    <p class="pinfo-meta">${esc(meta)}</p>
    ${priceBlock(p, true)}
    ${p.oldPrice ? `<p class="pcard-save">Ahorrás ${fmt(p.saving)} (${p.discount}% OFF)</p>` : ''}
    <p class="stock"><span class="dot" aria-hidden="true"></span>${p.stock === false ? 'Consultar disponibilidad' : 'Disponible'}</p>
    <p class="pinfo-short">${esc(p.short || '')}</p>
    <div class="buy">
      <div class="qty" role="group" aria-label="Cantidad"><button type="button" data-qty-minus aria-label="Menos">${icon('minus')}</button><output data-qty-value>1</output><button type="button" data-qty-plus aria-label="Más">${icon('plus')}</button></div>
      <button class="btn btn-gold btn-lg btn-grow" type="button" data-add="${p.id}" data-add-qty>AGREGAR AL CARRITO</button>
    </div>
    <a class="btn btn-wa btn-lg btn-block" href="${waLink(config, waProductMsg(p))}" data-wa-product="${esc(p.fullName)}" target="_blank" rel="noopener">${icon('whatsapp')} COMPRAR POR WHATSAPP</a>
    <ul class="mini-trust">
      <li>${icon('shield')} Original y sellado</li>
      <li>${icon('truck')} Envío a todo Uruguay por DAC · ${esc(eta)}</li>
      <li>${icon('lock')} Pago por transferencia · pedido confirmado personalmente</li>
    </ul>
  </div>
</section>

<section class="container pdetails">
  <div class="pdetails-main">
    <h2 class="h-sm">Sobre este perfume</h2>
    <p class="lead">${esc(p.description)}</p>
    ${packItems.length ? `<h3 class="h-xs">Este pack incluye</h3><ul class="pack-list">${packItems.map((x) => `<li><a href="${x.url}">${productImg(x)}<span><b>${esc(x.fullName)}</b>${fmt(x.price)}</span></a></li>`).join('')}</ul>` : ''}
    ${stages.length ? `<h3 class="h-xs">Pirámide olfativa</h3><div class="pyramid">${stages.map(([k, l]) => `<div class="pyr-step"><span class="pyr-n">${{ top: 'I', heart: 'II', base: 'III' }[k]}</span><h4>${l}</h4><ul>${p.notes[k].map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>`).join('')}</div>` : ''}
    ${!hasAllStages && p.keyNotes.length ? `<h3 class="h-xs">Notas destacadas</h3><ul class="tags">${p.keyNotes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
    ${p.occasion.length ? `<h3 class="h-xs">Para qué ocasión lo recomiendo</h3><ul class="tags tags-gold">${p.occasion.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
  </div>
  <aside class="pdetails-side">
    <h2 class="h-sm">Ficha técnica</h2>
    <dl class="specs">${specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    <p class="fineprint">Duración y proyección son aproximadas y varían según la piel, el clima y la cantidad aplicada.</p>
  </aside>
</section>

<section class="section section-alt">
  <div class="container">
    ${sectionHead('Seguí explorando', 'TAMBIÉN TE PUEDE GUSTAR', '', { tag: 'h2' })}
    <div class="grid-products">${related.map((x) => card(x)).join('')}</div>
  </div>
</section>

<div class="buybar" data-buybar><div class="buybar-price"><span>${p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : ''}${fmt(p.price)}</span><small>${esc(p.name)}</small></div><button class="btn btn-gold" type="button" data-add="${p.id}">AGREGAR AL CARRITO</button></div>`;

    const desc = `${p.short ? p.short + ' ' : ''}Perfume ${p.genderSeo} ${p.brand} original en Uruguay. ${fmt(p.price)}. Envíos a todo el país.`.replace(/\s+/g, ' ');
    const imgAbs = p.photoPending ? `${url}/img/og-image.jpg` : `${url}/img/products/${p.image}.webp`;
    out[`perfumes/${p.id}/index.html`] = layout(ctx, {
      title: `${p.fullName} | Perfume ${p.brand} Uruguay`,
      description: desc.length > 158 ? desc.slice(0, 155) + '…' : desc,
      path: p.url,
      ogType: 'product',
      ogImage: imgAbs,
      nav: '/#perfumes',
      body,
      bodyClass: 'page-product',
      ld: [
        {
          '@context': 'https://schema.org', '@type': 'Product',
          name: p.fullName, image: imgAbs, description: p.description, sku: p.id,
          brand: { '@type': 'Brand', name: p.brand },
          category: 'Perfumes',
          offers: { '@type': 'Offer', url: url + p.url, priceCurrency: site.currency, price: String(p.price), availability: p.stock === false ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition', seller: { '@type': 'Organization', name: site.name } },
        },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Inicio', '/'], ['Perfumes', '/#perfumes'], [p.brand, `/marcas/${p.brandSlug}/`], [p.name, p.url]].map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: url + u })) },
      ],
    });
  }

  /* ───────────────────── PÁGINAS DE MARCA ───────────────────── */
  for (const b of brands) {
    const body = `
<div class="container crumbs-wrap"><nav class="crumbs" aria-label="Migas de pan"><a href="/">Inicio</a><span>›</span><a href="/#marcas">Marcas</a><span>›</span><span aria-current="page">${esc(b.name)}</span></nav></div>
<section class="section section-tight"><div class="container">
  ${sectionHead(b.origin || 'Marca', `PERFUMES ${esc(b.name.toUpperCase())} EN URUGUAY`, esc(b.blurb || `Perfumes ${b.name} originales y sellados, con envíos a todo Uruguay.`), { tag: 'h1' })}
  <div class="grid-products">${b.items.map((p) => card(p)).join('')}</div>
  <p class="fineprint center">${esc(config.policies.originals)} Envíos a todo Uruguay por DAC.</p>
</div></section>`;
    out[`marcas/${b.slug}/index.html`] = layout(ctx, {
      title: `Perfumes ${b.name} en Uruguay | Originales | ${site.shortName}`,
      description: `Comprá perfumes ${b.name} originales en Uruguay: ${b.items.slice(0, 3).map((p) => p.name).join(', ')} y más. Envíos a todo el país.`.slice(0, 158),
      path: `/marcas/${b.slug}/`,
      nav: '/#marcas',
      body,
      ld: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Perfumes ${b.name}`, url: `${url}/marcas/${b.slug}/` }],
    });
  }

  /* ───────────────────── CHECKOUT ───────────────────── */
  const checkoutBody = `
<section class="container checkout-wrap">
  <div class="section-head center"><p class="eyebrow">Último paso</p><h1 class="section-title">FINALIZAR COMPRA</h1><span class="orn" aria-hidden="true"><i></i><b></b><i></i></span></div>

  <div class="empty" data-checkout-empty hidden><p>Tu carrito está vacío.</p><a class="btn btn-gold" href="/#perfumes">VER PERFUMES</a></div>

  <div class="checkout" data-checkout hidden>
    <form id="order-form" class="form" name="pedido" method="POST" action="/checkout/" data-netlify="true" netlify-honeypot="bot-field" novalidate>
      <input type="hidden" name="form-name" value="pedido">
      <p class="hp" aria-hidden="true"><label>No completar este campo <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <input type="hidden" name="pedido_id" data-f-id>
      <input type="hidden" name="productos" data-f-items>
      <input type="hidden" name="subtotal" data-f-subtotal>

      <fieldset>
        <legend><span class="step">1</span> Tus datos</legend>
        <div class="field-row">
          <label class="field"><span>Nombre</span><input name="nombre" required autocomplete="given-name" maxlength="60"></label>
          <label class="field"><span>Apellido</span><input name="apellido" required autocomplete="family-name" maxlength="60"></label>
        </div>
        <label class="field"><span>Teléfono / WhatsApp</span><input name="telefono" type="tel" inputmode="tel" required autocomplete="tel" placeholder="09X XXX XXX" maxlength="20"></label>
      </fieldset>

      <fieldset>
        <legend><span class="step">2</span> Entrega</legend>
        <div class="field-row">
          <label class="field"><span>Departamento</span><select name="departamento" required data-departamentos autocomplete="address-level1"><option value="">Elegí tu departamento</option></select></label>
          <label class="field"><span>Localidad / barrio</span><input name="localidad" autocomplete="address-level2" maxlength="80"></label>
        </div>
        <label class="field"><span>Dirección</span><input name="direccion" required autocomplete="street-address" placeholder="Calle, número, apto. (o sucursal DAC donde querés retirarlo)" maxlength="160"></label>
        <label class="field"><span>Observaciones <em>(opcional)</em></span><textarea name="observaciones" rows="2" maxlength="300"></textarea></label>
      </fieldset>

      <fieldset>
        <legend><span class="step">3</span> Método de envío</legend>
        <div class="options" data-shipping-options></div>
      </fieldset>

      <fieldset>
        <legend><span class="step">4</span> Método de pago</legend>
        <div class="options" data-payment-options></div>
      </fieldset>

      <p class="form-error" data-form-error role="alert" hidden></p>
      <button class="btn btn-gold btn-lg btn-block" type="submit" data-submit>CONFIRMAR PEDIDO</button>
      <div class="or"><span>o</span></div>
      <button class="btn btn-wa btn-lg btn-block" type="button" data-order-wa>${icon('whatsapp')} FINALIZAR POR WHATSAPP</button>
      <p class="fineprint">Usamos tus datos únicamente para gestionar tu pedido y coordinar la entrega.</p>
    </form>

    <aside class="summary" aria-label="Resumen del pedido">
      <h2 class="h-sm">Resumen</h2>
      <div data-summary-items></div>
      <dl class="totals">
        <div><dt>Subtotal</dt><dd data-summary-subtotal></dd></div>
        <div><dt>Envío</dt><dd data-summary-shipping>A pagar en destino</dd></div>
        <div class="totals-final"><dt>Total productos</dt><dd data-summary-total></dd></div>
      </dl>
      <p class="fineprint">El costo del envío por DAC se abona en destino y no está incluido en el total.</p>
      <a class="btn btn-link btn-block" href="/#perfumes">← Seguir comprando</a>
    </aside>
  </div>

  <div class="confirmation" data-confirmation hidden>
    <span class="confirm-icon">${icon('check')}</span>
    <p class="eyebrow">Pedido <b data-conf-id></b></p>
    <h2 class="section-title">¡GRACIAS POR TU COMPRA!</h2>
    <span class="orn" aria-hidden="true"><i></i><b></b><i></i></span>
    <p class="section-lead">Para dejar tu pedido registrado, <b>envialo por WhatsApp</b> con el botón de abajo. Así lo confirmamos personalmente y coordinamos la entrega.</p>
    <div class="conf-grid">
      <div class="conf-box"><h3>Tu pedido</h3><div data-conf-items></div><dl class="totals"><div class="totals-final"><dt>Total productos</dt><dd data-conf-total></dd></div></dl><p class="fineprint" data-conf-ship></p></div>
      <div class="conf-box" data-conf-pay></div>
    </div>
    <a class="btn btn-wa btn-lg" data-conf-wa href="#" target="_blank" rel="noopener">${icon('whatsapp')} ENVIAR PEDIDO POR WHATSAPP</a>
    <a class="btn btn-link" href="/">Volver a la tienda</a>
  </div>
</section>`;
  out['checkout/index.html'] = layout(ctx, {
    title: `Finalizar compra | ${site.name}`,
    description: 'Completá tus datos y finalizá tu pedido de perfumes originales.',
    path: '/checkout/',
    noindex: true,
    withAccount: true,
    nav: '',
    body: checkoutBody,
    bodyClass: 'page-checkout',
    scripts: `<script src="/js/checkout.js?v=${ctx.ver}" defer></script>`,
  });

  /* ───────────────────── 404 ───────────────────── */
  out['404.html'] = layout(ctx, {
    title: `Página no encontrada | ${site.name}`,
    description: 'La página que buscás no existe.',
    path: '/404.html',
    noindex: true,
    nav: '',
    bodyClass: 'page-404',
    body: `<section class="notfound"><div class="container">
      <img src="/img/logo-emblem.png" width="110" height="110" alt="" class="nf-emblem">
      <p class="eyebrow">Error 404</p>
      <h1 class="nf-title">ESTA FRAGANCIA SE EVAPORÓ</h1>
      <span class="orn" aria-hidden="true"><i></i><b></b><i></i></span>
      <p class="section-lead">La página que buscás no existe o cambió de lugar. Volvé al catálogo y encontrá tu próximo perfume.</p>
      <div class="hero-cta"><a class="btn btn-gold btn-lg" href="/">VOLVER AL INICIO</a><a class="btn btn-ghost btn-lg" href="/#perfumes">VER PERFUMES</a></div>
      <div class="grid-products nf-grid">${best.slice(0, 4).map((p) => card(p, { reveal: false })).join('')}</div>
    </div></section>`,
  });

  /* ───────────────────── SEO técnico ───────────────────── */
  const urls = ['/', ...brands.map((b) => `/marcas/${b.slug}/`), ...products.map((p) => p.url)];
  const today = new Date().toISOString().slice(0, 10);
  out['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${url}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  out['robots.txt'] = `User-agent: *\nAllow: /\nDisallow: /checkout/\nDisallow: /admin/\n\nSitemap: ${url}/sitemap.xml\n`;
  out['manifest.webmanifest'] = JSON.stringify({ name: site.name, short_name: site.shortName, start_url: '/', display: 'standalone', background_color: '#0b0a09', theme_color: '#0b0a09', lang: 'es', icons: [{ src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2);

  return out;
}

module.exports = { pages };
