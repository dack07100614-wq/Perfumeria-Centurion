// Modelo de datos y utilidades compartidas por las plantillas.
const fs = require('fs');
const path = require('path');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const GENDER = {
  masculino: { label: 'Masculino', plural: 'Masculinos', seo: 'hombre' },
  femenino: { label: 'Femenino', plural: 'Femeninos', seo: 'mujer' },
  unisex: { label: 'Unisex', plural: 'Unisex', seo: 'unisex' },
};

const IMG_DIR = path.join(__dirname, '..', 'src', 'img', 'products');
function findPhoto(id) {
  for (const ext of ['webp', 'jpg', 'jpeg', 'png', 'avif']) if (fs.existsSync(path.join(IMG_DIR, `${id}.${ext}`))) return id;
  return '';
}

function findGallery(id) {
  const out = [];
  for (const n of [2, 3, 4]) for (const ext of ['webp', 'jpg', 'jpeg', 'png']) if (fs.existsSync(path.join(IMG_DIR, `${id}-${n}.${ext}`))) { out.push(`${id}-${n}`); break; }
  return out;
}

function normalizeProducts(list, config) {
  const brandBySlug = Object.fromEntries(config.brands.map((b) => [b.slug, b]));
  const items = list
    .filter((p) => p.published !== false)
    .map((p) => {
      const gender = GENDER[p.gender] ? p.gender : 'unisex';
      const brandSlug = slugify(p.brand);
      const oldPrice = p.oldPrice && p.oldPrice > p.price ? Number(p.oldPrice) : null;
      const given = p.image ? String(p.image).split('/').pop().replace(/\.[^.]+$/, '') : '';
      const image = given && fs.existsSync(path.join(IMG_DIR, String(p.image).split('/').pop())) ? given : findPhoto(p.id);
      const fullName = [p.brand, p.name, p.concentration, p.ml ? `${p.ml} ml` : ''].filter(Boolean).join(' ');
      return {
        ...p,
        gender,
        genderLabel: GENDER[gender].label,
        genderSeo: GENDER[gender].seo,
        brandSlug,
        brandKnown: !!brandBySlug[brandSlug],
        price: Number(p.price),
        oldPrice,
        discount: oldPrice ? Math.round(((oldPrice - p.price) / oldPrice) * 100) : 0,
        saving: oldPrice ? oldPrice - p.price : 0,
        image,
        photoPending: !image,
        gallery: image ? findGallery(p.id) : [],
        fullName,
        url: `/perfumes/${p.id}/`,
        badges: p.badges || [],
        tags: p.tags || [],
        isBest: (p.badges || []).includes('bestseller'),
        isNew: (p.badges || []).includes('new'),
        isPack: Array.isArray(p.pack) && p.pack.length > 0,
        notes: p.notes || {},
        keyNotes: p.keyNotes || [],
        occasion: p.occasion || [],
        priority: p.priority ?? 999,
      };
    })
    .filter((p) => !(config.catalog && config.catalog.hideProductsWithoutPhoto && p.photoPending))
    .sort((a, b) => (a.priority + (a.photoPending ? 1000 : 0)) - (b.priority + (b.photoPending ? 1000 : 0)));

  // Validaciones tempranas para evitar errores al publicar
  const ids = new Set();
  for (const p of items) {
    if (!/^[a-z0-9-]+$/.test(p.id)) throw new Error(`Producto con id inválido: "${p.id}" (usá minúsculas, números y guiones)`);
    if (ids.has(p.id)) throw new Error(`Id de producto repetido: ${p.id}`);
    ids.add(p.id);
    if (!(p.price > 0)) throw new Error(`Producto ${p.id}: falta el precio`);
  }
  return items;
}

const waLink = (config, text) => `https://wa.me/${config.contact.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
const waProductMsg = (p) => `Hola, estoy interesado/a en ${p.fullName}. ¿Sigue disponible?`;

module.exports = { esc, fmt, slugify, GENDER, normalizeProducts, waLink, waProductMsg };
