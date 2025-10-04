// ============================
// movies.js  (versión final)
// ============================

// 👉 Token TMDB (el tuyo)
const VIEW_KEY = "a3ed14ba060cd8298f2fc74bd40f9f06";
const TMDB_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhM2VkMTRiYTA2MGNkODI5OGYyZmM3NGJkNDBmOWYwNiIsIm5iZiI6MTc1NzI2Nzc3OC4wODQsInN1YiI6IjY4YmRjNzQyM2MyYjE2MmJhMjFmNTFkYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.AesW6OqgZVdnnpqq7E3JMsOi0JAGTHdIoNoryV8Ameo";

let currentView = localStorage.getItem(VIEW_KEY) || "grid";
let currentGenreId = null; // null = Populares
let GENRES_MAP = {}; // id -> nombre

export let movies = []; // catálogo actual

function getHeaders() {
  return {
    accept: "application/json",
    Authorization: `Bearer ${TMDB_TOKEN}`,
  };
}

// ============================
// Carga géneros y construye el popover del trigger
// (el HTML tiene: #category-trigger y #category-popover)
// ============================
async function loadGenres(headers) {
  const res = await fetch(
    "https://api.themoviedb.org/3/genre/movie/list?language=es-ES",
    { headers }
  );
  const json = await res.json();
  GENRES_MAP = Object.fromEntries(
    (json.genres || []).map((g) => [g.id, g.name])
  );
}

function setCategoryLabel() {
  const trigger = document.getElementById("category-trigger");
  if (!trigger) return;
  trigger.textContent = currentGenreId
    ? GENRES_MAP[currentGenreId] || "Género"
    : "Populares";
}

async function buildCategoryPopover() {
  const pop = document.getElementById("category-popover");
  if (!pop) return;

  const options = [
    { id: null, name: "Populares" },
    ...Object.entries(GENRES_MAP).map(([id, name]) => ({
      id: Number(id),
      name,
    })),
  ];

  pop.innerHTML = options
    .map(
      (opt) => `
    <button class="category-option ${
      String(opt.id) === String(currentGenreId) ? "is-active" : ""
    }"
            role="option" data-id="${opt.id ?? ""}">
      ${opt.name}
    </button>
  `
    )
    .join("");
}

// ============================
// Llamada a la API TMDB (con enriquecido básico)
// ============================
export async function hydrateFromTMDB() {
  try {
    const headers = getHeaders();

    // Config imágenes
    const cfg = await fetch("https://api.themoviedb.org/3/configuration", {
      headers,
    }).then((r) => r.json());
    const base =
      (cfg.images && (cfg.images.secure_base_url || cfg.images.base_url)) ||
      "https://image.tmdb.org/t/p/";
    const size = "w342";

    // Cargar géneros si aún no están y preparar UI
    if (!Object.keys(GENRES_MAP).length) await loadGenres(headers);
    setCategoryLabel();
    await buildCategoryPopover();

    // Discover (con o sin género)
    const baseUrl = new URL("https://api.themoviedb.org/3/discover/movie");
    baseUrl.searchParams.set("include_adult", "false");
    baseUrl.searchParams.set("language", "es-ES");
    baseUrl.searchParams.set("sort_by", "popularity.desc");
    if (currentGenreId)
      baseUrl.searchParams.set("with_genres", String(currentGenreId));

    const pages = [1, 2, 3];
    const baseList = [];
    for (const p of pages) {
      baseUrl.searchParams.set("page", String(p));
      const res = await fetch(baseUrl.toString(), { headers });
      if (!res.ok) throw new Error(`TMDB ${res.status}`);
      const { results } = await res.json();
      baseList.push(
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

    // Enriquecido (overview, director, actores, géneros) para un lote moderado
    const ENRICH_COUNT = Math.min(40, baseList.length);
    const detailResults = await Promise.allSettled(
      baseList
        .slice(0, ENRICH_COUNT)
        .map((m) =>
          fetch(
            `https://api.themoviedb.org/3/movie/${m.id}?language=es-ES&append_to_response=credits`,
            { headers }
          ).then((r) => r.json())
        )
    );

    const extraById = {};
    for (const dr of detailResults) {
      if (dr.status !== "fulfilled") continue;
      const d = dr.value || {};
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
    }

    movies = baseList.map((m) => {
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
            .map((id) => GENRES_MAP[id])
            .filter(Boolean)
            .join(", "),
      };
    });
  } catch (e) {
    console.warn("TMDB falló:", e);
    movies = [];
  }
}

// ============================
// Tarjeta (usa las clases de tu SCSS)
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
// Render (solo dentro de #root, que ya es .catalog)
// ============================
export function renderCatalog(root) {
  root.classList.toggle("grid", currentView === "grid");
  root.classList.toggle("list", currentView === "list");
  root.innerHTML = movies.map(cardHTML).join("");
}

// ============================
// Botones de vista (ya en HTML)
// ============================
export function bindViewControls() {
  const root = document.getElementById("root");
  const btnG = document.getElementById("btn-grid");
  const btnL = document.getElementById("btn-list");
  if (!root || !btnG || !btnL) return;

  const sync = () => {
    btnG.setAttribute("aria-pressed", String(currentView === "grid"));
    btnL.setAttribute("aria-pressed", String(currentView === "list"));
    root.classList.toggle("grid", currentView === "grid");
    root.classList.toggle("list", currentView === "list");
    localStorage.setItem(VIEW_KEY, currentView);
  };

  btnG.addEventListener("click", () => {
    currentView = "grid";
    sync();
  });
  btnL.addEventListener("click", () => {
    currentView = "list";
    sync();
  });
  sync();
}

// ============================
// Trigger de categoría (clic en el texto rojo)
// ============================
export function bindCategoryTrigger() {
  const trigger = document.getElementById("category-trigger");
  const pop = document.getElementById("category-popover");
  if (!trigger || !pop) return;

  const open = async () => {
    await buildCategoryPopover(); // asegura opciones frescas
    trigger.setAttribute("aria-expanded", "true");
    pop.hidden = false;
  };
  const close = () => {
    trigger.setAttribute("aria-expanded", "false");
    pop.hidden = true;
  };

  trigger.addEventListener("click", () => (pop.hidden ? open() : close()));

  document.addEventListener("click", (e) => {
    if (!pop.hidden && !pop.contains(e.target) && e.target !== trigger) close();
  });

  pop.addEventListener("click", async (e) => {
    const btn = e.target.closest(".category-option");
    if (!btn) return;

    const idAttr = btn.dataset.id;
    currentGenreId = idAttr === "" ? null : Number(idAttr);

    setCategoryLabel();
    close();

    await hydrateFromTMDB();
    renderCatalog(document.getElementById("root"));
  });

  // label inicial
  setCategoryLabel();
}

// ============================
// (opcional) cambiar categoría programáticamente
// ============================
export function setCatalogCategoryById(genreIdOrNull) {
  currentGenreId = genreIdOrNull == null ? null : Number(genreIdOrNull);
  setCategoryLabel();
}
