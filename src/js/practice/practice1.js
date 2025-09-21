// Practica 1: Catálogo de películas con dos vistas (grid y list)
// ------------------------------------------

// Importamos los datos (películas estáticas) y los estilos SCSS.

import { movies } from "../movies.js";
import "../../scss/movie.scss";

// Seleccionamos el DOM
// - root → contenedor donde se renderizan las películas
// - btnGrid y btnList → botones para alternar la vista

const root = document.getElementById("root");
const btnGrid = document.getElementById("btn-grid");
const btnList = document.getElementById("btn-list");

// Constante con el nombre de la clave de localStorage
// Esto nos permite guardar cuál fue la última vista seleccionada
// y recuperarla al volver a cargar la página.

const VIEW_KEY = "catalog:view";

// Funcion que se encarga de:
// Cambiar la clase del contenedor
// Guardar la vista de localStorage
// Llamar a renderMovies para que pinte las peliculas

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

// listeners

btnGrid.addEventListener("click", () => applyView("grid"));
btnList.addEventListener("click", () => applyView("list"));

// inicial: desde localStorage o grid

applyView(localStorage.getItem(VIEW_KEY) || "grid");

// En resumen:
// applyView --> Decide la vista y ordena el trabajo
// RenderMovies --> Ejecuta el trabajo pintando las peliculas
