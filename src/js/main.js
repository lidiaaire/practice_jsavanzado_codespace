// src/js/main.js
import { hydrateFromTMDB, renderCatalog, bindViewControls } from "./movies.js";
import logoUrl from "../asset/images/logo-1x.png";

import "./utils/dom.js";

import "../scss/base.scss";
import "../scss/HeaderFooter.scss";
import "../scss/movie.scss";
import "../scss/style.scss";

document.addEventListener("DOMContentLoaded", async () => {
  const logoImg = document.querySelector(".logo img");
  if (logoImg) logoImg.src = logoUrl;

  await hydrateFromTMDB();
  const root = document.getElementById("root");
  renderCatalog(root);
  bindViewControls();
});

// activar item de navegación
document.querySelectorAll(".main-nav .nav-link").forEach((a) => {
  a.addEventListener("click", (e) => {
    document
      .querySelectorAll(".main-nav .nav-link")
      .forEach((x) => x.classList.remove("active"));
    e.currentTarget.classList.add("active");
  });
});
