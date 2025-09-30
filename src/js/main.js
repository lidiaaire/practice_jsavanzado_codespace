// Punto de entrada de Webpack. Aquí importas los estilos y “enciendes” la práctica que estés trabajando
// Importaciones de módulos y archivos SCSS

import { movies } from "./movies.js";
console.log(movies);
import logoUrl from "../asset/images/logo-1x.png";
document.querySelector(".logo img").src = logoUrl;

import "./practice/practice1.js";
import "./utils/dom.js";

import "../scss/base.scss";
import "../scss/HeaderFooter.scss";
import "../scss/movie.scss";
import "../scss/style.scss";

// en tu main.js si quieres marcar activo dinámicamente
document.querySelectorAll(".main-nav .nav-link").forEach((a) => {
  a.addEventListener("click", (e) => {
    document
      .querySelectorAll(".main-nav .nav-link")
      .forEach((x) => x.classList.remove("active"));
    e.currentTarget.classList.add("active");
  });
});
