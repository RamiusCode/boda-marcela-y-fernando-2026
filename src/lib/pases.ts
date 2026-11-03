// src/lib/pases.ts
// Palabra que acompaña al número de pases. La usan el servidor (al armar la
// tarjeta) y el script (cuando los pases llegan por la URL), así no difieren.
export function etiquetaPases(pases: number | string): string {
  return Number(pases) === 1 ? "pase" : "pases";
}
