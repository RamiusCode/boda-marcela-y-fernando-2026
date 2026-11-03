// src/data/invitados.ts
// Lee lista-invitados.txt (en la raíz del proyecto) y lo convierte en la lista
// de invitados que usan las páginas. Se ejecuta SOLO en tiempo de build.

import fs from "node:fs";
import { fileURLToPath } from "node:url";

export interface Invitado {
  /** Nombre tal cual se muestra en la invitación. */
  nombre: string;
  /** Cantidad de pases asignados. */
  pases: number;
  /** Parte final del link: /familia-antelo-sosa/ */
  slug: string;
}

/** Rutas que ya usa el sitio y que por lo tanto no puede tomar un invitado. */
const SLUGS_RESERVADOS = new Set(["enlaces", "index"]);

const ARCHIVO = fileURLToPath(new URL("../../lista-invitados.txt", import.meta.url));

/**
 * Convierte un nombre en un slug limpio para la URL.
 * "Familia Antelo Sosa" -> "familia-antelo-sosa"
 * "Ñandú Muñoz"         -> "nandu-munoz"
 */
export function generarSlug(texto: string): string {
  return texto
    .normalize("NFD")            // separa las letras de sus tildes
    .replace(/[\u0300-\u036f]/g, "")  // borra las tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // todo lo que no sea letra/número -> guion
    .replace(/^-+|-+$/g, "");    // sin guiones al principio ni al final
}

/**
 * Lee y parsea lista-invitados.txt.
 * Formato por línea:  Nombre | pases | slug (los dos últimos opcionales)
 */
export function getInvitados(): Invitado[] {
  if (!fs.existsSync(ARCHIVO)) {
    throw new Error(
      `No se encontró lista-invitados.txt en la raíz del proyecto (${ARCHIVO}).`,
    );
  }

  const lineas = fs.readFileSync(ARCHIVO, "utf8").split(/\r?\n/);
  const invitados: Invitado[] = [];
  const slugsUsados = new Set<string>();

  lineas.forEach((linea, indice) => {
    const limpia = linea.trim();

    // Ignorar líneas vacías y comentarios
    if (limpia === "" || limpia.startsWith("#")) return;

    const [colNombre = "", colPases = "", colSlug = ""] = limpia.split("|");

    const nombre = colNombre.trim();
    if (nombre === "") {
      throw new Error(
        `lista-invitados.txt, línea ${indice + 1}: falta el nombre del invitado.`,
      );
    }

    // Pases: si está vacío o no es un número válido, se asume 1
    const pasesTexto = colPases.trim();
    const pases = pasesTexto === "" ? 1 : Number.parseInt(pasesTexto, 10);
    if (!Number.isFinite(pases) || pases < 1) {
      throw new Error(
        `lista-invitados.txt, línea ${indice + 1}: "${pasesTexto}" no es una cantidad de pases válida (debe ser un número mayor o igual a 1).`,
      );
    }

    // Slug: el de la tercera columna, o uno generado desde el nombre
    let slug = colSlug.trim() !== "" ? generarSlug(colSlug) : generarSlug(nombre);
    if (slug === "") {
      throw new Error(
        `lista-invitados.txt, línea ${indice + 1}: no se pudo generar un link para "${nombre}". Agregá un slug manual en la tercera columna.`,
      );
    }

    // Si dos invitados generan el mismo link, se numera el segundo
    if (slugsUsados.has(slug)) {
      let n = 2;
      while (slugsUsados.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    if (SLUGS_RESERVADOS.has(slug)) {
      throw new Error(
        `lista-invitados.txt, línea ${indice + 1}: el link "${slug}" está reservado por el sitio. Ponele un slug distinto en la tercera columna.`,
      );
    }

    slugsUsados.add(slug);

    invitados.push({ nombre, pases, slug });
  });

  return invitados;
}
