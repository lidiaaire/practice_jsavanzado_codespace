// Catalogo Basico + Cambio grid/list

// helpers sencillos tipo ejemplo
const el = (tag, className, text) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text) n.textContent = text;
  return n;
};

const header = document.getElementById("app-header");
const root = document.getElementById("root");

// crea botones
const btnGrid = el("button", "", "Cuadrícula");
btnGrid.id = "btnGrid";
btnGrid.setAttribute("aria-pressed", "true");

const btnList = el("button", "", "Lista");
btnList.id = "btnList";
btnList.setAttribute("aria-pressed", "false");

// pinta en header
header.append(btnGrid, btnList);

// utilidad para marcar el botón activo
function setButtons(layout) {
  btnGrid.setAttribute("aria-pressed", String(layout === "grid"));
  btnList.setAttribute("aria-pressed", String(layout === "list"));
}

function poster(src) {
  const i = document.createElement("img");
  i.src = src;
  return i;
}
function title(t) {
  return el("div", "movie-title", t);
}
function data(r, y) {
  return el("div", "movie-data", `Rating: ${r} | ${y}`);
}

function Card(m) {
  const a = el("article", "movie-card");
  a.append(poster(m.poster), title(m.title), data(m.rating, m.year));
  return a;
}
function Row(m) {
  const a = el("article", "movie-row");
  const box = el("div");
  box.append(title(m.title), data(m.rating, m.year));
  a.append(poster(m.poster), box);
  return a;
}

const movies = [
  {
    title: "The Dark Knight",
    year: 2008,
    rating: 9,
    poster: "http://image.tmdb.org/t/p/w500//qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  },
  {
    title: "Inception",
    year: 2010,
    rating: 8.8,
    poster: "http://image.tmdb.org/t/p/w500//edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
  },
  {
    title: "Interstellar",
    year: 2014,
    rating: 8.6,
    poster: "http://image.tmdb.org/t/p/w500//rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
  },
  {
    title: "Mad Max: Fury Road",
    year: 2015,
    rating: 8.1,
    poster: "http://image.tmdb.org/t/p/w500//8tZYtuWezp8JbcsvHYO0O46tFbo.jpg",
  },
];

function render(layout = "grid") {
  root.classList.toggle("grid", layout === "grid");
  root.classList.toggle("list", layout === "list");
  root.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (const m of movies) frag.append(layout === "grid" ? Card(m) : Row(m));
  root.append(frag);
}

btnGrid.addEventListener("click", () => {
  render("grid");
  setButtons("grid");
});
btnList.addEventListener("click", () => {
  render("list");
  setButtons("list");
});

// inicio
render("grid");
setButtons("grid");
