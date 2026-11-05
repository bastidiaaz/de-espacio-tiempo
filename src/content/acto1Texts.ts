/**
 * Carga y validación de los textos del Acto I (`acto1.json`).
 * Aquí solo vive la *forma* esperada; el contenido lo edita el autor en el JSON.
 * Los mensajes de error están escritos para quien edita el JSON, no para programadores.
 */
import raw from './acto1.json';

/** Ids que el código espera encontrar en el JSON. Se derivan de la estructura en story.ts. */
export interface ExpectedIds {
  memorias: readonly string[];
  /** Objetos ocultos del paseo libre (DIS-04, DIS-12). Mismo formato que las memorias. */
  ocultos: readonly string[];
  capitulos: readonly string[];
}

export type Acto1Json = typeof raw;

const UI_KEYS: Record<string, readonly string[]> = {
  '': ['titulo', 'acto', 'etiqueta_del_lienzo', 'intro', 'hud', 'tarjeta', 'diario', 'final'],
  intro: [
    'primera_vez', 'retomando', 'completo', 'como_jugar_tactil', 'como_jugar_teclado',
    'como_jugar_final', 'boton_empezar',
  ],
  hud: ['nada_mirado', 'contador', 'diario'],
  tarjeta: ['continuar_tactil', 'continuar_teclado', 'etiqueta_boton'],
  diario: ['titulo', 'desconocido', 'volver', 'reiniciar'],
  final: ['titulo', 'cuerpo', 'seguir_caminando', 'reiniciar'],
};
const VOICE_KEYS = ['al_despertar', 'al_llegar_al_borde', 'quedarse_quieta'] as const;
const MEMORY_KEYS = ['titulo', 'texto'] as const;
const CHAPTER_KEYS = ['pista', 'al_terminar'] as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function checkText(v: unknown, path: string, out: string[]): void {
  if (typeof v !== 'string') out.push(`"${path}" debe ser un texto entre comillas.`);
  else if (v.trim() === '') out.push(`"${path}" está vacío.`);
}

function checkList(v: unknown, path: string, out: string[], allowEmpty = false): void {
  if (!Array.isArray(v)) {
    out.push(`"${path}" debe ser una lista [ ... ]${allowEmpty ? '' : ' con al menos un texto'}.`);
    return;
  }
  if (v.length === 0 && !allowEmpty) {
    out.push(`"${path}" debe ser una lista [ ... ] con al menos un texto.`);
    return;
  }
  v.forEach((item, i) => checkText(item, `${path}[${i + 1}]`, out));
}

/** Compara las claves de `obj` con las esperadas y avisa de las que faltan o sobran. */
function checkKeys(obj: unknown, expected: readonly string[], path: string, out: string[]): obj is Obj {
  if (!isObj(obj)) {
    out.push(`Falta la sección "${path}" (o no es un bloque { ... }).`);
    return false;
  }
  const where = path ? `en "${path}"` : 'en la raíz del archivo';
  for (const k of expected) if (!(k in obj)) out.push(`Falta "${k}" ${where}.`);
  for (const k of Object.keys(obj)) {
    if (!expected.includes(k)) out.push(`Sobra "${k}" ${where}: el juego no sabe dónde usarlo.`);
  }
  return true;
}

/** Devuelve la lista de problemas del JSON (vacía si todo está bien). */
export function validateActo1(data: unknown, ids: ExpectedIds): string[] {
  const out: string[] = [];
  if (!checkKeys(data, ['interfaz', 'voz_de_isi', 'memorias', 'ocultos', 'capitulos'], '', out)) return out;

  // Interfaz
  const ui = data.interfaz;
  if (checkKeys(ui, UI_KEYS[''], 'interfaz', out)) {
    for (const k of UI_KEYS['']) {
      const sub = UI_KEYS[k];
      if (!sub) {
        checkText(ui[k], `interfaz.${k}`, out);
      } else if (checkKeys(ui[k], sub, `interfaz.${k}`, out)) {
        const block = ui[k] as Obj;
        for (const kk of sub) checkText(block[kk], `interfaz.${k}.${kk}`, out);
      }
    }
    const counter = isObj(ui.hud) ? ui.hud.contador : undefined;
    if (typeof counter === 'string' && (!counter.includes('{n}') || !counter.includes('{total}'))) {
      out.push('"interfaz.hud.contador" debe conservar {n} y {total}: el juego los reemplaza por números.');
    }
  }

  // Voz de Isi
  const voice = data.voz_de_isi;
  if (checkKeys(voice, VOICE_KEYS, 'voz_de_isi', out)) {
    checkList(voice.al_despertar, 'voz_de_isi.al_despertar', out);
    checkList(voice.al_llegar_al_borde, 'voz_de_isi.al_llegar_al_borde', out);
    checkText(voice.quedarse_quieta, 'voz_de_isi.quedarse_quieta', out);
  }

  // Memorias, ocultos y capítulos: mismos ids que el código
  for (const section of ['memorias', 'ocultos'] as const) {
    const items = data[section];
    if (!checkKeys(items, ids[section], section, out)) continue;
    for (const id of ids[section]) {
      const m = items[id];
      if (m === undefined) continue; // ya avisado arriba como "Falta"
      if (!checkKeys(m, MEMORY_KEYS, `${section}.${id}`, out)) continue;
      checkText(m.titulo, `${section}.${id}.titulo`, out);
      checkText(m.texto, `${section}.${id}.texto`, out);
    }
  }
  const chs = data.capitulos;
  if (checkKeys(chs, ids.capitulos, 'capitulos', out)) {
    for (const id of ids.capitulos) {
      const c = chs[id];
      if (c === undefined) continue;
      if (!checkKeys(c, CHAPTER_KEYS, `capitulos.${id}`, out)) continue;
      checkText(c.pista, `capitulos.${id}.pista`, out);
      // Un capítulo puede terminar sin pensamientos (DIS-07: la fogata).
      checkList(c.al_terminar, `capitulos.${id}.al_terminar`, out, true);
    }
  }
  return out;
}

/** Valida y devuelve el JSON tipado; si hay problemas, lanza un error legible. */
export function loadActo1(ids: ExpectedIds): Acto1Json {
  const problems = validateActo1(raw, ids);
  if (problems.length) {
    throw new Error(`Hay problemas en src/content/acto1.json:\n- ${problems.join('\n- ')}`);
  }
  return raw;
}

export const acto1Raw = raw;
