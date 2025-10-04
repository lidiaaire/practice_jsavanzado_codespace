// ESTADOS Y CONSTANTES
// Añadir de themovie.db (https://www.themoviedb.org/) para que funcione la API

const VIEW_KEY = "a3ed14ba060cd8298f2fc74bd40f9f06";
const TMDB_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhM2VkMTRiYTA2MGNkODI5OGYyZmM3NGJkNDBmOWYwNiIsIm5iZiI6MTc1NzI2Nzc3OC4wODQsInN1YiI6IjY4YmRjNzQyM2MyYjE2MmJhMjFmNTFkYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.AesW6OqgZVdnnpqq7E3JMsOi0JAGTHdIoNoryV8Ameo";

let currentView = localStorage.getItem(VIEW_KEY) || "grid";
let currentGenreId = null;
let GENRES_MAP = {};

export let movies = [];

// UI/header
// centra el Header y pone en rojo la categoria
function getHeaders() {
  return {
    accept: "application/json",
    Authorization: `Bearer ${TMDB_TOKEN}`,
  };
}

function setCategoryLabel() {
  const trigger = document.getElementById("category-trigger");
  if (!trigger) return;
  trigger.textContent = currentGenreId
    ? GENRES_MAP[currentGenreId] || "Género"
    : "Populares";
}

// CARGA GENEROS Y LOS GUARDA EN GENRES_MAP
// 1. Hace la llamada a TMDB para obtener los generos
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

//2. Pinta el menu desplegable con los generos establecidos
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

// IMPORTANTE: Se llama antes de renderrizar para que el menu este listo cuando el usuario lo pulse

// CARGA PELICULAS DE LA TMDB (api.themoviedb.org)
export async function hydrateFromTMDB() {
  try {
    const headers = getHeaders();

    // 1. Configura la imagen
    const cfg = await fetch("https://api.themoviedb.org/3/configuration", {
      headers,
    }).then((r) => r.json());
    const base =
      (cfg.images && (cfg.images.secure_base_url || cfg.images.base_url)) ||
      "https://image.tmdb.org/t/p/";
    const size = "w342";

    // 2. Carga generos
    if (!Object.keys(GENRES_MAP).length) await loadGenres(headers); // rellena GENRES_MAP
    setCategoryLabel(); // Pone el texto en rojo de la categoria
    await buildCategoryPopover(); // Crea el menu de las opciones

    // 3. Discover (con o sin género) usa las URL + parámetros adecuados
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

      // 4. Mapea la informacion basica de cada película
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

    // 5. Detalla (resumen, director, actores, categorias)
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

    // 6. Construye el array final de movies
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

    // 7. Mezcla la info básica y la extra
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

// PLANTILLA DE CADA TARJETA

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

// RENDER DEL CATALOGO.
// Aplica grid o list en el #root y vuelca todas las tarjetas dentro
export function renderCatalog(root) {
  root.classList.toggle("grid", currentView === "grid");
  root.classList.toggle("list", currentView === "list");
  root.innerHTML = movies.map(cardHTML).join("");
}

// BOTONES DE VISTA DE GRID O LIST

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

// CLICK EN EL TEXTO ROJO DE CATEGORIA
// Muestra el popover, permite elegir categoria y recarga el catalogo
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
