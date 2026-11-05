# Cómo editar los textos del Acto I

Todos los textos del Acto I están en `src/content/acto1.json`. No hace falta tocar TypeScript.

- **Secciones:** `interfaz` (menús, HUD, intro, final), `voz_de_isi` (pensamientos sueltos), `memorias` (título y texto de cada objeto), `ocultos` (título y texto de los objetos ocultos del paseo libre; todavía no aparecen en el juego, llegan con ENG-13) y `capitulos` (pista a los 45 s y pensamientos al terminar cada capítulo).
- **Qué se edita:** solo lo que está entre comillas, a la derecha de los dos puntos. No cambies los nombres de la izquierda (`fire`, `capitulo1`, `titulo`...): son los ids que usa el juego.
- **Listas:** lo que va entre `[ ... ]` son varios textos separados por coma; cada uno es una tarjeta o línea.
- **Contador:** `"{n} de {total} mirados de frente"` debe conservar `{n}` y `{total}`; el juego los reemplaza por números.
- **Comillas dentro de un texto:** usa « » (como ya está). Si necesitas una comilla `"`, escríbela como `\"`.
- **Para comprobar:** `npm test`. Si falta o sobra un id, un texto está vacío o hay una coma mal puesta, el test dice cuál (por ejemplo: `Falta "helmet" en "memorias"`).
- **Probar en el juego:** `npm run dev` y abre el Acto I con `#debug` para saltar a un ítem.
