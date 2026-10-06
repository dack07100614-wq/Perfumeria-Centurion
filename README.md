# Perfumería Centurión — tienda online

Sitio estático (HTML/CSS/JS, sin servidor). Se genera desde dos archivos de datos:

- `data/products.json` → todos los perfumes (precio, fotos, notas, ofertas, etiquetas).
- `data/config.json` → WhatsApp, Instagram, envíos, medios de pago, marcas, textos de confianza.

`node build.js` genera la carpeta **`public/`**, lista para publicar (también queda subida al repo).

## Publicar (recomendado: Netlify, plan gratuito)
1. Netlify → *Add new site → Import from GitHub* → elegí este repositorio. Ya está configurado en `netlify.toml`.
2. Cada cambio en el repo regenera y publica el sitio solo.
3. *Domain management* → agregá tu dominio y actualizá `site.url` en `data/config.json` (se usa para SEO y sitemap).
4. **Pedidos por email:** en Netlify → *Forms → Form notifications* → agregá `infoperfumeriacenturion@gmail.com`. Cada pedido de la web llega ahí, además del mensaje de WhatsApp.

## Agregar o editar perfumes
- **Panel visual** (`tusitio.com/admin/`): editá `static/admin/config.yml` si cambia el repo/rama, y en Netlify activá *Site configuration → Access & security → OAuth → GitHub*. Entrá con tu usuario de GitHub.
- **A mano:** copiá un bloque de `data/products.json`, cambiá `id` y datos, y poné la foto en `src/img/products/` (nombre en `image`). Las fotos se optimizan solas al generar el sitio.
- **Fotos oficiales:** las fotos se tomaron de las tiendas oficiales de Lattafa, Armaf, Afnan y French Avenue. Para Al Haramain, Rasasi y Maison Alhambra, y para Asad Bourbon y Mayar, no hay tienda oficial con fotos accesibles: esos perfumes quedan ocultos hasta que agregues la foto.
- **Fotos:** guardá la imagen en `src/img/products/` con el **mismo nombre que el `id`** (ej. `eclaire.jpg`). Se detecta sola y se optimiza (hasta 1800 px). Un perfume sin foto queda oculto mientras `catalog.hideProductsWithoutPhoto` sea `true` en `config.json`. Recomendado: fotos cuadradas o 4:5, fondo limpio, mínimo 1200 px.
- **Ofertas:** poné `oldPrice` (precio anterior) y `price` (precio actual); el % se calcula solo.
- **Más vendidos / Nuevos:** `badges: ["bestseller"]` / `["new"]`. **Nueva marca:** se agrega sola; para su texto y país, sumala a `brands` en `config.json`.

## Cobro online (Mercado Pago)
Ya está programado, pero apagado. Para activarlo: cuenta de Mercado Pago Uruguay → copiá el *Access Token* → Netlify → *Environment variables* → `MP_ACCESS_TOKEN` → en `config.json` poné `"enabled": true` en `mercadopago`. Los precios se validan en el servidor (`netlify/functions/mp-checkout.js`). Probalo en modo prueba de Mercado Pago antes de usarlo.

## Instagram
Para mostrar el feed real: creá un widget en behold.so y pegá el ID en `instagram.beholdFeedId`. Mientras tanto se muestra una grilla de tus perfumes.

## Seguridad
CSP estricta, sin scripts inline, cabeceras en `static/_headers`, honeypot anti-spam, precios del carrito siempre tomados del catálogo (nunca del navegador) y datos de pago visibles solo tras confirmar el pedido.
