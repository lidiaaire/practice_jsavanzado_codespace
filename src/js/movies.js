// ============================
// movies.js  (versión final)
// ============================

// 👉 Token TMDB (el tuyo)
const VIEW_KEY = "a3ed14ba060cd8298f2fc74bd40f9f06";
const TMDB_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhM2VkMTRiYTA2MGNkODI5OGYyZmM3NGJkNDBmOWYwNiIsIm5iZiI6MTc1NzI2Nzc3OC4wODQsInN1YiI6IjY4YmRjNzQyM2MyYjE2MmJhMjFmNTFkYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.AesW6OqgZVdnnpqq7E3JMsOi0JAGTHdIoNoryV8Ameo";

let currentView = localStorage.getItem(VIEW_KEY) || "grid";
let currentCategory = "Populares";

// Catálogo actual
export let movies = [];

// ============================
// Llamada a la API TMDB (enriquecida)
// ============================
export async function hydrateFromTMDB() {
  try {
    const headers = {
      accept: "application/json",
      Authorization: `Bearer ${TMDB_TOKEN}`,
    };

    // Config imágenes
    const cfg = await fetch("https://api.themoviedb.org/3/configuration", {
      headers,
    }).then((r) => r.json());

    const base =
      (cfg.images && (cfg.images.secure_base_url || cfg.images.base_url)) ||
      "https://image.tmdb.org/t/p/";
    const size = "w342";

    // Descubrimiento (varias páginas)
    const pages = [1, 2, 3];
    const all = [];
    for (const p of pages) {
      const res = await fetch(
        `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&include_adult=false&language=es-ES&page=${p}`,
        { headers }
      );
      if (!res.ok) throw new Error(`TMDB ${res.status}`);
      const { results } = await res.json();
      all.push(
        ...results.map((m) => ({
          id: m.id,
          title: m.title,
          year: (m.release_date || "").slice(0, 4),
          rating: (m.vote_average ?? 0).toFixed(1),
          poster: m.poster_path ? `${base}${size}${m.poster_path}` : "",
          genre_ids: m.genre_ids || [],
        }))
      );
    }

    // Mapa de géneros
    const genreList = await fetch(
      "https://api.themoviedb.org/3/genre/movie/list?language=es-ES",
      { headers }
    ).then((r) => r.json());
    const GENRES = Object.fromEntries(
      (genreList.genres || []).map((g) => [g.id, g.name])
    );

    // Enriquecer detalles + créditos para los primeros N (optimiza peticiones)
    const ENRICH_COUNT = Math.min(40, all.length);
    const detailResults = await Promise.allSettled(
      all
        .slice(0, ENRICH_COUNT)
        .map((m) =>
          fetch(
            `https://api.themoviedb.org/3/movie/${m.id}?language=es-ES&append_to_response=credits`,
            { headers }
          ).then((r) => r.json())
        )
    );

    const extraById = {};
    detailResults.forEach((res) => {
      if (res.status !== "fulfilled") return;
      const d = res.value || {};
      const director =
        (d.credits?.crew || []).find((c) => c.job === "Director")?.name || "";
      const actors = (d.credits?.cast || [])
        .slice(0, 3)
        .map((c) => c.name)
        .join(", ");
      const categories = (d.genres || []).map((g) => g.name).join(", ");
      extraById[d.id] = {
        summary: d.overview || "",
        director,
        actors,
        category: categories,
      };
    });

    // Fusiona base + extras (resto sin extras usa géneros por id)
    movies = all.map((m) => {
      const ex = extraById[m.id] || {};
      return {
        id: m.id,
        title: m.title,
        year: m.year,
        rating: m.rating,
        poster: m.poster,
        summary: ex.summary || "",
        director: ex.director || "",
        actors: ex.actors || "",
        category:
          ex.category ||
          (m.genre_ids || [])
            .map((id) => GENRES[id])
            .filter(Boolean)
            .join(", "),
      };
    });

    // Persistimos vista actual
    localStorage.setItem(VIEW_KEY, currentView);
    console.log("Películas cargadas:", movies.length);
  } catch (e) {
    console.warn("⚠️ No se pudo cargar TMDB, catálogo vacío.", e.message || e);
  }
}

// ============================
// Toolbar (UI superior)
// ============================
function toolbarHTML() {
  return `
    <div class="catalog-toolbar">
      <div class="catalog-toolbar__title">
        Seleccione una categoría: <span class="category">${currentCategory}</span>
      </div>
      <div class="catalog-toolbar__controls">
        <button class="viewbtn ${
          currentView === "grid" ? "is-active" : ""
        }" data-view="grid" aria-pressed="${
    currentView === "grid"
  }" title="Cuadrícula">
          <i class="icon-grid"></i>
        </button>
        <button class="viewbtn ${
          currentView === "list" ? "is-active" : ""
        }" data-view="list" aria-pressed="${
    currentView === "list"
  }" title="Lista">
          <i class="icon-list"></i>
        </button>
      </div>
    </div>
  `;
}

// ============================
// Render de Cards (con summary, director, actors y categoría)
// ============================
function cardHTML(m) {
  return `
    <article class="movie" data-id="${m.id}">
      <img class="movie__poster" src="${m.poster}" alt="${m.title}">
      <div class="movie__body">
        <h3 class="movie__title">${m.title}</h3>
        <p class="movie__meta"><strong>Rating:</strong> ${m.rating} · ${
    m.year
  }</p>

        <p class="movie__summary">
          <strong class="movie__label">Summary</strong><br>
          ${m.summary || "Sin sinopsis disponible."}
        </p>

        <p class="movie__line"><strong class="movie__label">Director:</strong> ${
          m.director || "-"
        }</p>
        <p class="movie__line"><strong class="movie__label">Actors:</strong> ${
          m.actors || "-"
        }</p>
        <p class="movie__genre">${m.category || "-"}</p>
      </div>
    </article>
  `;
}

// ============================
// Render completo del Catálogo (usa .catalog grid/list)
// ============================
export function renderCatalog(root) {
  root.classList.toggle("grid", currentView === "grid");
  root.classList.toggle("list", currentView === "list");
  root.innerHTML = movies.map(cardHTML).join("");
}
// Bind de los botones que ya existen en el HTML
export function bindViewControls() {
  const root = document.getElementById("root");
  const btnGrid = document.getElementById("btn-grid");
  const btnList = document.getElementById("btn-list");

  const sync = () => {
    btnGrid.setAttribute("aria-pressed", String(currentView === "grid"));
    btnList.setAttribute("aria-pressed", String(currentView === "list"));
    root.classList.toggle("grid", currentView === "grid");
    root.classList.toggle("list", currentView === "list");
    localStorage.setItem(VIEW_KEY, currentView);
  };

  btnGrid.addEventListener("click", () => {
    currentView = "grid";
    sync();
  });
  btnList.addEventListener("click", () => {
    currentView = "list";
    sync();
  });

  sync(); // estado inicial
}

// ============================
// Eventos de la Toolbar (toggle grid/list)
// ============================
function attachToolbarEvents(rootEl) {
  const buttons = rootEl.querySelectorAll(".viewbtn");
  const catalog = rootEl.querySelector(".catalog");

  const syncButtons = () => {
    buttons.forEach((b) => {
      const pressed = b.dataset.view === currentView;
      b.classList.toggle("is-active", pressed);
      b.setAttribute("aria-pressed", String(pressed));
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentView = btn.dataset.view;
      localStorage.setItem(VIEW_KEY, currentView);
      catalog.classList.toggle("grid", currentView === "grid");
      catalog.classList.toggle("list", currentView === "list");
      syncButtons();
    });
  });

  // estado inicial del contenedor
  catalog.classList.toggle("grid", currentView === "grid");
  catalog.classList.toggle("list", currentView === "list");
  syncButtons();
}

// ============================
// Cambiar categoría (si usas filtros luego)
// ============================
export function setCatalogCategory(name) {
  currentCategory = name || currentCategory;
}
