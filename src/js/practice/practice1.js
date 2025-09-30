// Practica 1: Catálogo de películas con dos vistas (grid y list)
// ------------------------------------------

// Importamos los datos (películas estáticas) y los estilos SCSS.
// -------------------------------------------------------------

import { movies } from "../movies.js";
import "../../scss/movie.scss";

// Seleccionamos el DOM
// - root → contenedor donde se renderizan las películas
// - btnGrid y btnList → botones para alternar la vista

// DOM
const root = document.getElementById("root");
const btnGrid = document.getElementById("btn-grid");
const btnList = document.getElementById("btn-list");

// Constante con el nombre de la clave de localStorage
// Esto nos permite guardar cuál fue la última vista seleccionada
// y recuperarla al volver a cargar la página.

// Clave vista
const VIEW_KEY = "a3ed14ba060cd8298f2fc74bd40f9f06";
const TMDB_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhM2VkMTRiYTA2MGNkODI5OGYyZmM3NGJkNDBmOWYwNiIsIm5iZiI6MTc1NzI2Nzc3OC4wODQsInN1YiI6IjY4YmRjNzQyM2MyYjE2MmJhMjFmNTFkYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.AesW6OqgZVdnnpqq7E3JMsOi0JAGTHdIoNoryV8Ameo";
// Funcion que se encarga de:
// Cambiar la clase del contenedor
// Guardar la vista de localStorage
// Llamar a renderMovies para que pinte las peliculas
// ------------------ TMDB: hidrata el catálogo ------------------
async function hydrateFromTMDB() {
  try {
    if (!TMDB_TOKEN) throw new Error("TMDB token no configurado");

    const headers = {
      accept: "application/json",
      Authorization: `Bearer ${TMDB_TOKEN}`,
    };

    // configuración de imágenes
    const cfg = await fetch("https://api.themoviedb.org/3/configuration", {
      headers,
    }).then((r) => r.json());

    const base =
      (cfg.images && (cfg.images.secure_base_url || cfg.images.base_url)) ||
      "https://image.tmdb.org/t/p/";
    const size = "w342";

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
  // Si la vista es "grid" → añade la clase grid y quita list.
  // Si la vista es "list" → hace lo contrario.

  root.classList.toggle("grid", view === "grid");
  root.classList.toggle("list", view === "list");

  // Guardamos la vista actual en localStorage para recordarla al recargar

  localStorage.setItem(VIEW_KEY, view);

  // es la función que realmente pinta las películas
  // en el contenedor, una por una, con el layout que le indiquemos (grid o list).

  renderMovies(movies, view);
}

// Una vez que tenemos applyView (view)
// Creamos renderMovies en una funcion para:
// Construir las tarjetas de las peliculas y borra lo que hubiera antes

function renderMovies(list, view = "grid") {
  root.innerHTML = "";

  list.forEach((m) => {
    const article = document.createElement("article");
    article.className = "movie";
    article.dataset.id = m.id;

    // Plantilla HTML de cada tarjeta

    article.innerHTML = `
      <img class="movie__poster"
           src="${m.poster}"
@@ -66,19 +96,17 @@ function renderMovies(list, view = "grid") {
        <p class="movie__meta"><strong>Rating:</strong> ${m.rating} · ${m.year}</p>
      </div>
    `;

    root.appendChild(article);
  });
}

// listeners

// ------------------ Listeners ------------------
btnGrid.addEventListener("click", () => applyView("grid"));
btnList.addEventListener("click", () => applyView("list"));

// inicial: desde localStorage o grid

applyView(localStorage.getItem(VIEW_KEY) || "grid");

// En resumen:
// applyView --> Decide la vista y ordena el trabajo
// RenderMovies --> Ejecuta el trabajo pintando las peliculas
// ------------------ Bootstrap ------------------
(async function boot() {
  await hydrateFromTMDB(); // si falla, se queda el estático
  applyView(localStorage.getItem(VIEW_KEY) || "grid");
})();
