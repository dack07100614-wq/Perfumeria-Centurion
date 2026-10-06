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
- Sin foto todavía: dejá `image` vacío (se muestra "Foto próximamente"). Para ocultar esos perfumes: `catalog.hideProductsWithoutPhoto: true` en `config.json`.
- **Ofertas:** poné `oldPrice` (precio anterior) y `price` (precio actual); el % se calcula solo.
- **Más vendidos / Nuevos:** `badges: ["bestseller"]` / `["new"]`. **Nueva marca:** se agrega sola; para su texto y país, sumala a `brands` en `config.json`.

## Cobro online (Mercado Pago)
Ya está programado, pero apagado. Para activarlo: cuenta de Mercado Pago Uruguay → copiá el *Access Token* → Netlify → *Environment variables* → `MP_ACCESS_TOKEN` → en `config.json` poné `"enabled": true` en `mercadopago`. Los precios se validan en el servidor (`netlify/functions/mp-checkout.js`). Probalo en modo prueba de Mercado Pago antes de usarlo.

## Instagram
Para mostrar el feed real: creá un widget en behold.so y pegá el ID en `instagram.beholdFeedId`. Mientras tanto se muestra una grilla de tus perfumes.

## Seguridad
CSP estricta, sin scripts inline, cabeceras en `static/_headers`, honeypot anti-spam, precios del carrito siempre tomados del catálogo (nunca del navegador) y datos de pago visibles solo tras confirmar el pedido.
