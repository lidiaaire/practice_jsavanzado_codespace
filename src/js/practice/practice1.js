// Practica 1: Catálogo de películas con dos vistas (grid y list)
// -------------------------------------------------------------

import { movies } from "../movies.js";
import "../../scss/movie.scss";

// DOM
const root = document.getElementById("root");
const btnGrid = document.getElementById("btn-grid");
const btnList = document.getElementById("btn-list");

// Clave vista
const VIEW_KEY = "catalog:view";

// ------------------ TMDB: hidrata el catálogo ------------------
async function hydrateFromTMDB() {
  try {
    if (!process.env.TMDB_TOKEN) {
      throw new Error("TMDB token no configurado");
    }

    const headers = {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
    };

    // configuración de imágenes
    const cfg = await fetch("https://api.themoviedb.org/3/configuration", {
      headers,
    }).then((r) => r.json());

    const base =
      (cfg.images && (cfg.images.secure_base_url || cfg.images.base_url)) ||
      "https://image.tmdb.org/t/p/";
    const size = "w342";

    // páginas a cargar (más = más resultados)
    const pages = [1, 2, 3, 4, 5];
    const all = [];

    for (const p of pages) {
      const res = await fetch(
        `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&include_adult=false&language=es-ES&page=${p}`,
        { headers }
      );
      if (!res.ok) throw new Error(`TMDB ${res.status}`);
      const json = await res.json();

      all.push(
        ...json.results.map((m) => ({
          id: m.id,
          title: m.title,
          year: (m.release_date || "").slice(0, 4),
          rating: (m.vote_average ?? 0).toFixed(1),
          poster: m.poster_path ? `${base}${size}${m.poster_path}` : "",
        }))
      );
    }

    movies.length = 0;
    movies.push(...all);

    console.log("Películas cargadas desde TMDB:", movies.length);
  } catch (e) {
    console.warn(
      "No se pudo cargar TMDB, se usará el catálogo estático.",
      e.message || e
    );
  }
}

// ------------------ Vista y render ------------------
function applyView(view) {
  root.classList.toggle("grid", view === "grid");
  root.classList.toggle("list", view === "list");
  localStorage.setItem(VIEW_KEY, view);
  renderMovies(movies, view);
}

function renderMovies(list, view = "grid") {
  root.innerHTML = "";

  list.forEach((m) => {
    const article = document.createElement("article");
    article.className = "movie";
    article.dataset.id = m.id;

    article.innerHTML = `
      <img class="movie__poster"
           src="${m.poster}"
           alt="Poster de ${m.title}"
           loading="lazy"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/780x1170?text=No+image';">
      <div class="movie__body">
        <h3 class="movie__title">${m.title}</h3>
        <p class="movie__meta"><strong>Rating:</strong> ${m.rating} · ${m.year}</p>
      </div>
    `;

    root.appendChild(article);
  });
}

// ------------------ Listeners ------------------
btnGrid.addEventListener("click", () => applyView("grid"));
btnList.addEventListener("click", () => applyView("list"));

// ------------------ Bootstrap ------------------
(async function boot() {
  await hydrateFromTMDB(); // si falla, se queda el estático
  applyView(localStorage.getItem(VIEW_KEY) || "grid");
})();
