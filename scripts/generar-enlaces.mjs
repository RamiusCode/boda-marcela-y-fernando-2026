// scripts/generar-enlaces.mjs
// Genera enlaces-invitados.txt con la lista completa de invitados y su link.
//
//   npm run enlaces                        -> links de localhost
//   npm run enlaces -- https://mi.web.com  -> links del dominio real
//
// Usa el mismo lista-invitados.txt que las páginas, así que nunca se desfasa.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const ENTRADA = path.join(RAIZ, "lista-invitados.txt");
const SALIDA = path.join(RAIZ, "enlaces-invitados.txt");

// Dominio: el que pasen por consola, o localhost por defecto (sin barra final)
const BASE = (process.argv[2] || "http://localhost:4321").replace(/\/+$/, "");

function generarSlug(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

if (!fs.existsSync(ENTRADA)) {
  console.error("No se encontró lista-invitados.txt en la raíz del proyecto.");
  process.exit(1);
}

const invitados = [];
const slugsUsados = new Set();

fs.readFileSync(ENTRADA, "utf8")
  .split(/\r?\n/)
  .forEach((linea, indice) => {
    const limpia = linea.trim();
    if (limpia === "" || limpia.startsWith("#")) return;

    const [colNombre = "", colPases = "", colSlug = ""] = limpia.split("|");
    const nombre = colNombre.trim();

    if (nombre === "") {
      console.error(`lista-invitados.txt, línea ${indice + 1}: falta el nombre.`);
      process.exit(1);
    }

    const pasesTexto = colPases.trim();
    const pases = pasesTexto === "" ? 1 : Number.parseInt(pasesTexto, 10);
    if (!Number.isFinite(pases) || pases < 1) {
      console.error(
        `lista-invitados.txt, línea ${indice + 1}: "${pasesTexto}" no es una cantidad de pases válida.`,
      );
      process.exit(1);
    }

    let slug = colSlug.trim() !== "" ? generarSlug(colSlug) : generarSlug(nombre);
    if (slugsUsados.has(slug)) {
      let n = 2;
      while (slugsUsados.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    slugsUsados.add(slug);

    invitados.push({ nombre, pases, slug });
  });

const totalPases = invitados.reduce((suma, inv) => suma + inv.pases, 0);
const anchoNombre = Math.max(8, ...invitados.map((inv) => inv.nombre.length));

const linea = "═".repeat(63);
const guion = "─".repeat(63);

const contenido = [
  linea,
  "  LISTA DE INVITADOS — Marcela & Fernando",
  `  ${BASE}`,
  `  ${invitados.length} ${invitados.length === 1 ? "invitación" : "invitaciones"} · ${totalPases} ${totalPases === 1 ? "pase" : "pases"} en total`,
  linea,
  "",
  `${"INVITADO".padEnd(anchoNombre)}  PASES  LINK`,
  `${"-".repeat(anchoNombre)}  -----  ${"-".repeat(4)}`,
  ...invitados.map(
    (inv) =>
      `${inv.nombre.padEnd(anchoNombre)}  ${String(inv.pases).padStart(5)}  ${BASE}/${inv.slug}/`,
  ),
  "",
  guion,
  "GENÉRICA (sin nombre, 1 pase)",
  `  ${BASE}/`,
  "",
  "PANEL DE ENLACES (uso interno, con botón de copiar)",
  `  ${BASE}/enlaces/`,
  guion,
  "",
].join("\n");

fs.writeFileSync(SALIDA, contenido, "utf8");
console.log(contenido);
console.log(`Guardado en: ${path.relative(RAIZ, SALIDA)}`);
