import {
  hydrateFromTMDB,
  renderCatalog,
  bindViewControls,
  bindCategoryTrigger,
} from "./movies.js";

import logoUrl from "../asset/images/logo-1x.png";

import "../scss/base.scss";
import "../scss/HeaderFooter.scss";
import "../scss/movie.scss";
import "../scss/style.scss";

// Motor de arranque

document.addEventListener("DOMContentLoaded", async () => {
  const logoImg = document.querySelector(".logo img");
  if (logoImg) logoImg.src = logoUrl;

  await hydrateFromTMDB();
  const root = document.getElementById("root");
  renderCatalog(root);
  bindViewControls();
  bindCategoryTrigger();
});

// Maneja el subrayado visual del enlace activo en el menú de navegacion.

document.querySelectorAll(".main-nav .nav-link").forEach((a) => {
  a.addEventListener("click", (e) => {
    document
      .querySelectorAll(".main-nav .nav-link")
      .forEach((x) => x.classList.remove("active"));
    e.currentTarget.classList.add("active");
  });
});
