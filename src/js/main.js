// Punto de entrada de Webpack. Aquí importas los estilos y “enciendes” la práctica que estés trabajando

import "../../scss/style.scss";
import "./utils/dom.js";
const PRACTICE_BY_HASH = {
  1: () => import("./practice/practice1.js"),
  2: () => import("./practice/practice2.js"),
  3: () => import("./practice/practice3.js"),
};
