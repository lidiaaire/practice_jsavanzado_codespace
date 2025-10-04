# 🎬 FILMAX — Catálogo de Películas (JS Avanzado)

Proyecto del módulo de **JavaScript Avanzado de CodeSpace**. Muestra un **catálogo dinámico** usando la **API de TMDB**, con:

- Filtro por **categorías (géneros)** desde el propio texto de la barra (“Populares”).
- Alternancia de **vista**: cuadrícula ↔ lista (persistente en `localStorage`).
- Tarjetas con **título, rating, sinopsis, director, actores y género(s)**.
- **HTML / JS / SCSS separados** (sin estilos en JS/HTML).

Tal y como nos retaban para poder pasar de nivel y dar por terminado el bloque de JS.

---

Esta estructurado de la siguiente forma:
src/
├─ asset/
│ └─ images/
│ └─ logo-1x.png(ya lo teniamos anteriormente en el proyecto de Filmax)
├─ js/
│ ├─ main.js # Punto de entrada: arranque de UI y eventos
│ └─ movies.js # Lógica: API TMDB, render, vista, categorías
└─ scss/
├─ base.scss # Variables, colores, resets y helpers
├─ HeaderFooter.scss
├─ movie.scss # Hero, barra, grid/list, tarjetas
└─ style.scss # (agregador si lo usas)
index.html # Estructura HTML (sin estilos ni lógica)
webpack.config.js # Bundler (dev server, loaders)
package.json # Scripts y dependencias

🧠 Flujo general

¿Cual ha sido el objetivo de cada archivo?

index.html: Define la **estructura semántica**:

- **Header:** logo, menú, iconos sociales.
- **Hero:** banda superior (visual, sin eventos).
- **Barra de catálogo:** contiene el label de categoría (rojo) y los botones de vista.
- `<div id="root" class="catalog grid">` → donde se inyectan las tarjetas.

HTML solo estructura.  
Todos los eventos y datos dinámicos los maneja JS.

---

main.js arranca la web:
Responsable del **arranque de la web**:

- Importa los estilos SCSS.
- Importa las funciones de `movies.js`.
- Llama a:
  - `hydrateFromTMDB()` → Según categoría.
  - `renderCatalog(#root)` → pinta las tarjetas en el DOM.
  - `bindViewControls()` → activa los botones cuadrícula/lista.
  - `bindCategoryTrigger()` → permite filtrar al hacer click en el texto rojo “por categoria”.

---

movies.js :
**núcleo de la lógica**:

1. **Estado**

- `currentView` → grid / list (en `localStorage` con `VIEW_KEY`).
- `currentGenreId` → id del género actual (`null` = Populares).
- `GENRES_MAP` → diccionario (id → nombre de género).
- `movies` → array de películas en memoria.

2. **Carga de Datos (TMDB)**

- Obtiene `configuration` → base URL de imágenes.
- Obtiene `discover/movie` → 3 páginas, filtradas por género cuando se selecciona uno.
- Enriquecido (solo las primeras `ENRICH_COUNT = 40` películas) usando `append_to_response=credits`:
  - `overview` → summary.
  - `crew.job === "Director"` → director.
  - `cast[0..2]` → actores principales.
  - `genres` → category (texto).

3. **Renderizado**

- `renderCatalog(root)` → añade clase `grid` o `list` a `.catalog` y vuelca `movies.map(cardHTML).join("")`.

4. **Vista**

- `bindViewControls()` → alterna cuadrícula ↔ lista; actualiza `aria-pressed` y guarda preferencia en `localStorage`.

5. **Categorías**

- `bindCategoryTrigger()`:
  - Al hacer click en el texto rojo “Populares”, abre con un click todos los géneros.
  - Al seleccionar un género:
    - Filtra.
    - Llama de nuevo a `hydrateFromTMDB()` con `with_genres`.
    - Renderiza de nuevo con `renderCatalog()`.

---

SCSS (estilos):

- `base.scss` → variables globales, resets, helpers.
- `HeaderFooter.scss` → estilos del header, nav, iconos.
- `movie.scss` → estilos de Hero, barra, catálogo grid/list, tarjetas, imágenes, tipografía.

---
