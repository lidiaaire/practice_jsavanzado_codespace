const { JSDOM } = require("jsdom");
const fs = require("fs");

// Leer tu HTML principal de la práctica

const html = fs.readFileSync("index.html", "utf-8");

const dom = new JSDOM(html);
const document = dom.window.document;

console.log(
  "Películas encontradas:",
  document.querySelectorAll(".movie").length
);
