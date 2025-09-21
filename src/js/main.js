// Punto de entrada de Webpack. Aquí importas los estilos y “enciendes” la práctica que estés trabajando
import { movies } from "./movies.js";
console.log(movies);

import "./practice/practice1.js";
import { renderMovies, setGridView, setListView } from "./practice/practice1";
import "./practice/practice2.js";
import "./practice/practice3.js";
import "./utils/dom.js";

import "../scss/base.scss";
import "../scss/HeaderFooter.scss";
import "../scss/movie.scss";
import "../scss/style.scss";
