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
