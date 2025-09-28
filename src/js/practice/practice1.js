// src/js/practice/practice1.js
console.log("[BOOT] TMDB_TOKEN set?", !!process.env.TMDB_TOKEN);
console.log("[BOOT] TMDB_API_KEY set?", !!process.env.TMDB_API_KEY);

const API_TOKEN = process.env.TMDB_TOKEN;
const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

let movies = [];
let genres = [];
let currentView = "grid";

const catalogEl = document.getElementById("catalog");
const genreSelect = document.getElementById("genre-select");
const btnGrid = document.getElementById("btn-grid");
const btnList = document.getElementById("btn-list");

// Render de películas
function renderMovies(list) {
  if (!catalogEl) return;
  catalogEl.innerHTML = "";
  list.forEach((m) => {
    const card = document.createElement("div");
    card.className = "movie";

    const img = document.createElement("img");
    img.src = m.poster_path || "https://via.placeholder.com/300x450";
    img.alt = m.title;
    img.className = "movie__poster";

    const body = document.createElement("div");
    body.className = "movie__body";

    const h3 = document.createElement("h3");
    h3.className = "movie__title";
    h3.innerHTML = `${m.title} <span class="movie__meta">(${m.year}) ★ ${m.rating}</span>`;

    const summary = document.createElement("p");
    summary.className = "movie__summary";
    summary.textContent = m.overview || "Sinopsis no disponible.";

    const info = document.createElement("div");
    info.className = "movie__info";
    info.innerHTML = `
      <p><strong>Director:</strong> ${m.director || "—"}</p>
      <p><strong>Actors:</strong> ${m.actors || "—"}</p>
      <p><strong>Género:</strong> ${m.genre_names?.join(", ") || "—"}</p>
    `;

    body.appendChild(h3);
    body.appendChild(summary);
    body.appendChild(info);

    card.appendChild(img);
    card.appendChild(body);
    catalogEl.appendChild(card);
  });
}

// Filtro
function getFiltered() {
  const g = genreSelect.value;
  if (g === "all") return movies;
  return movies.filter((m) => m.genre_ids?.includes(parseInt(g)));
}

// Aplicar vista
function applyView() {
  if (!catalogEl) return;
  catalogEl.className = `catalog ${currentView}`;
  renderMovies(getFiltered());
}

// Handlers botones
btnGrid?.addEventListener("click", () => {
  currentView = "grid";
  btnGrid.setAttribute("aria-pressed", "true");
  btnList.setAttribute("aria-pressed", "false");
  applyView();
});
btnList?.addEventListener("click", () => {
  currentView = "list";
  btnList.setAttribute("aria-pressed", "true");
  btnGrid.setAttribute("aria-pressed", "false");
  applyView();
});
genreSelect?.addEventListener("change", applyView);

// Cargar de TMDB
async function hydrateFromTMDB() {
  console.log("[TMDB] iniciando fetch…");
  try {
    const conf = await fetch(`${BASE_URL}/configuration`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    console.log("[TMDB] /configuration status:", conf.status);

    const genreRes = await fetch(
      `${BASE_URL}/genre/movie/list?language=es-ES`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );
    console.log("[TMDB] /genre status:", genreRes.status);
    genres = (await genreRes.json()).genres || [];

    genreSelect.innerHTML =
      `<option value="all">Todas</option>` +
      genres.map((g) => `<option value="${g.id}">${g.name}</option>`).join("");

    const promises = [1, 2, 3].map((page) =>
      fetch(`${BASE_URL}/discover/movie?language=es-ES&page=${page}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }).then((r) => r.json())
    );

    const results = await Promise.all(promises);
    movies = results.flatMap((r) =>
      r.results.map((m) => ({
        id: m.id,
        title: m.title,
        poster_path: `https://image.tmdb.org/t/p/w300${m.poster_path}`,
        overview: m.overview,
        rating: m.vote_average.toFixed(1),
        year: (m.release_date || "").slice(0, 4),
        genre_ids: m.genre_ids,
        genre_names: m.genre_ids
          ?.map((id) => genres.find((g) => g.id === id)?.name)
          .filter(Boolean),
      }))
    );
    console.log("[TMDB] total películas cargadas:", movies.length);

    applyView();
  } catch (e) {
    console.warn("No se pudo cargar TMDB. Uso catálogo estático.", e);
  }
}

document.addEventListener("DOMContentLoaded", hydrateFromTMDB);
