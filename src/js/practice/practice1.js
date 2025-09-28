// Catálogo con dos vistas + filtro por género + detalles (TMDB v4 con fallback a api_key v3)
// -----------------------------------------------------------------------------------------

import { movies } from "../movies.js"; // fallback estático
import "../../scss/movie.scss"; // estilos del catálogo

// DOM
var root = document.getElementById("root");
var btnGrid = document.getElementById("btn-grid");
var btnList = document.getElementById("btn-list");
var genreSelect = document.getElementById("genre-select");
var genreLabel = document.getElementById("genre-label");

// Persistencia
var VIEW_KEY = "catalog:view";
var GENRE_KEY = "catalog:genre";

// Estado
var genreMap = new Map(); // id -> nombre
var all = []; // SIEMPRE renderizamos desde aquí
var currentGenre = localStorage.getItem(GENRE_KEY) || "0"; // "0" = Todas

console.log("[BOOT] TMDB_TOKEN set?", !!process.env.TMDB_TOKEN);
console.log("[BOOT] TMDB_API_KEY set?", !!process.env.TMDB_API_KEY);

// ---------- Helper: fetch con Bearer v4 y, si 401, reintenta con api_key v3 ----------
async function fetchTMDBJson(pathAndQuery, headers) {
  // intento 1: Bearer v4
  let res = await fetch("https://api.themoviedb.org/3/" + pathAndQuery, {
    headers: headers,
  });
  if (res.status === 401 && process.env.TMDB_API_KEY) {
    // intento 2: api_key v3 por query
    const sep = pathAndQuery.indexOf("?") >= 0 ? "&" : "?";
    const url =
      "https://api.themoviedb.org/3/" +
      pathAndQuery +
      sep +
      "api_key=" +
      encodeURIComponent(process.env.TMDB_API_KEY);
    res = await fetch(url);
  }
  return res;
}

// ==================== TMDB: hidrata ====================
async function hydrateFromTMDB() {
  try {
    if (!process.env.TMDB_TOKEN && !process.env.TMDB_API_KEY) {
      throw new Error("No hay credenciales TMDB (TMDB_TOKEN o TMDB_API_KEY).");
    }
    console.log("[TMDB] iniciando fetch…");

    var headers = {
      accept: "application/json",
      // si hay token v4, lo incluimos; si no, irá por api_key en el helper
      Authorization: process.env.TMDB_TOKEN
        ? "Bearer " + process.env.TMDB_TOKEN
        : undefined,
    };

    // 1) Config de imágenes (no necesita auth, pero mantenemos helper por consistencia)
    var cfgRes = await fetchTMDBJson("configuration", headers);
    console.log("[TMDB] /configuration status:", cfgRes.status);
    if (!cfgRes.ok) throw new Error("TMDB " + cfgRes.status);
    var cfg = await cfgRes.json();
    var base =
      (cfg.images && (cfg.images.secure_base_url || cfg.images.base_url)) ||
      "https://image.tmdb.org/t/p/";
    var sizePoster = "w342";

    // 2) Géneros
    var gRes = await fetchTMDBJson("genre/movie/list?language=es-ES", headers);
    console.log("[TMDB] /genre status:", gRes.status);
    if (!gRes.ok) throw new Error("TMDB " + gRes.status);
    var gjson = await gRes.json();
    genreMap = new Map(
      gjson.genres.map(function (g) {
        return [String(g.id), g.name];
      })
    );

    // 3) Películas (varias páginas)
    var pages = [1, 2, 3];
    var raw = [];
    for (var i = 0; i < pages.length; i++) {
      var p = pages[i];
      var res = await fetchTMDBJson(
        "discover/movie?sort_by=popularity.desc&include_adult=false&language=es-ES&page=" +
          p,
        headers
      );
      console.log("[TMDB] /discover page", p, "status:", res.status);
      if (!res.ok) throw new Error("TMDB " + res.status);
      var json = await res.json();
      raw = raw.concat(json.results);
    }

    // 4) Créditos (director + 3 actores) para primeras N (evita saturar la API)
    var N = 40;
    var subset = raw.slice(0, N);
    var creditsArr = [];
    for (var j = 0; j < subset.length; j++) {
      var m = subset[j];
      try {
        var cRes = await fetchTMDBJson(
          "movie/" + m.id + "/credits?language=es-ES",
          headers
        );
        var cJson = cRes.ok ? await cRes.json() : { cast: [], crew: [] };
        creditsArr.push(cJson);
      } catch (err) {
        creditsArr.push({ cast: [], crew: [] });
      }
    }
    var creditsById = new Map();
    for (var k = 0; k < subset.length; k++) {
      var mm = subset[k];
      var cc = creditsArr[k] || { cast: [], crew: [] };

      var director = "—";
      var crewArr = cc.crew || [];
      for (var c1 = 0; c1 < crewArr.length; c1++) {
        var person = crewArr[c1];
        if (person && person.job === "Director") {
          director = person.name || "—";
          break;
        }
      }

      var actorsList = [];
      var castArr = cc.cast || [];
      for (var c2 = 0; c2 < castArr.length && actorsList.length < 3; c2++) {
        if (castArr[c2] && castArr[c2].name) actorsList.push(castArr[c2].name);
      }
      var actors = actorsList.length ? actorsList.join(", ") : "—";

      creditsById.set(mm.id, { director: director, actors: actors });
    }

    // 5) Normaliza
    all = raw.map(function (m2) {
      var gnames = [];
      var ids = m2.genre_ids || [];
      for (var gi = 0; gi < ids.length; gi++) {
        var gname = genreMap.get(String(ids[gi]));
        if (gname) gnames.push(gname);
      }
      var credit = creditsById.get(m2.id) || { director: "—", actors: "—" };
      var ratingNum = m2.vote_average != null ? Number(m2.vote_average) : 0;
      return {
        id: m2.id,
        title: m2.title,
        year: (m2.release_date || "").slice(0, 4),
        rating: ratingNum.toFixed(1),
        poster: m2.poster_path ? base + sizePoster + m2.poster_path : "",
        overview: m2.overview || "",
        genres: gnames,
        director: credit.director,
        actors: credit.actors,
        genre_ids: m2.genre_ids || [],
      };
    });

    // Mantén 'movies' sincronizado por compatibilidad
    movies.length = 0;
    for (var z = 0; z < all.length; z++) movies.push(all[z]);

    console.log("[TMDB] total películas cargadas:", all.length);
    renderGenreSelect();
  } catch (e) {
    console.warn("No se pudo cargar TMDB. Uso catálogo estático.", e);
    // Fallback: adapta tu array estático a 'all'
    all = movies.map(function (m3) {
      var ratingNum = m3.rating != null ? Number(m3.rating) : 0;
      return {
        id: m3.id,
        title: m3.title,
        year: m3.year || "",
        rating: ratingNum.toFixed
          ? ratingNum.toFixed(1)
          : Number(ratingNum || 0).toFixed(1),
        poster: m3.poster || "",
        overview: m3.overview || "",
        genres: m3.genres || [],
        director: m3.director || "—",
        actors: m3.actors || "—",
        genre_ids: m3.genre_ids || [],
      };
    });
    renderGenreSelect();
  }
}

// ==================== UI Géneros ====================
function renderGenreSelect() {
  if (!genreSelect) return;
  var html = '<option value="0">Todas</option>';
  genreMap.forEach(function (name, id) {
    html += '<option value="' + id + '">' + name + "</option>";
  });
  genreSelect.innerHTML = html;

  if (!(genreMap.has(currentGenre) || currentGenre === "0")) currentGenre = "0";
  genreSelect.value = currentGenre;
  if (genreLabel)
    genreLabel.textContent =
      currentGenre === "0" ? "Todas" : genreMap.get(currentGenre) || "Todas";

  genreSelect.addEventListener("change", function () {
    currentGenre = genreSelect.value;
    localStorage.setItem(GENRE_KEY, currentGenre);
    if (genreLabel)
      genreLabel.textContent =
        currentGenre === "0" ? "Todas" : genreMap.get(currentGenre) || "Todas";
    applyView(localStorage.getItem(VIEW_KEY) || "grid");
  });
}

function getFiltered() {
  if (currentGenre === "0") return all;
  var gid = Number(currentGenre);
  return all.filter(function (m) {
    var ids = m.genre_ids || [];
    for (var i = 0; i < ids.length; i++) if (ids[i] === gid) return true;
    return false;
  });
}

// ==================== Vista y render ====================
function applyView(view) {
  root.classList.toggle("grid", view === "grid");
  root.classList.toggle("list", view === "list");
  localStorage.setItem(VIEW_KEY, view);
  renderMovies(getFiltered(), view);
}

function renderMovies(list, view) {
  if (view == null) view = "grid";
  root.innerHTML = "";
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    var article = document.createElement("article");
    article.className = "movie";
    article.dataset.id = m.id;

    article.innerHTML =
      '<img class="movie__poster" src="' +
      m.poster +
      '" alt="Poster de ' +
      m.title +
      '" loading="lazy" onerror="this.onerror=null; this.src=\'https://via.placeholder.com/780x1170?text=No+image\';">' +
      '<div class="movie__body">' +
      '  <h3 class="movie__title">' +
      m.title +
      "</h3>" +
      '  <p class="movie__meta"><strong>Rating:</strong> ' +
      m.rating +
      " · " +
      (m.year || "—") +
      "</p>" +
      '  <p class="movie__line"><strong>Summary</strong><br><em>' +
      (m.overview ? m.overview : "—") +
      "</em></p>" +
      '  <p class="movie__line"><strong>Director:</strong> <em>' +
      m.director +
      "</em></p>" +
      '  <p class="movie__line"><strong>Actors:</strong> <em>' +
      m.actors +
      "</em></p>" +
      '  <p class="movie__line"><strong>Género:</strong> <em>' +
      (m.genres && m.genres.length ? m.genres.join(", ") : "—") +
      "</em></p>" +
      "</div>";
    root.appendChild(article);
  }
}

// ==================== Listeners ====================
if (btnGrid) {
  btnGrid.addEventListener("click", function () {
    btnGrid.setAttribute("aria-pressed", "true");
    if (btnList) btnList.setAttribute("aria-pressed", "false");
    applyView("grid");
  });
}
if (btnList) {
  btnList.addEventListener("click", function () {
    if (btnGrid) btnGrid.setAttribute("aria-pressed", "false");
    btnList.setAttribute("aria-pressed", "true");
    applyView("list");
  });
}

// ==================== Bootstrap ====================
(async function boot() {
  try {
    await hydrateFromTMDB();
  } catch (err) {
    console.warn("hydrateFromTMDB() falló:", err);
  }
  applyView(localStorage.getItem(VIEW_KEY) || "grid");
})();
