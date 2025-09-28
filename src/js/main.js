// src/js/main.js

// 1) Estilos (primero catálogo, luego header para que tenga prioridad)
import "../scss/style.scss";

// Si de verdad los usas, importa estos después; si no, quítalos para evitar pisar estilos.
// import "../scss/base.scss";
// import "../scss/style.scss";

// 2) Lógica de la práctica (una sola vez)
import "./practice/practice1.js"; // NO hagas imports nombrados si no exportas nada

// 3) (Opcional) Ver el catálogo estático si quieres depurar
// import { movies } from "./movies.js";
// console.log("Películas estáticas:", movies);

// 4) Logo: que Webpack resuelva la ruta del asset
import logoUrl from "../asset/images/logo-1x.png";
window.addEventListener("DOMContentLoaded", () => {
  const logoEl = document.querySelector("img.logo");
  if (logoEl) logoEl.src = logoUrl;
});
