# AUD-01 · Transcripción del coro de "Astronauta"

Este documento es para que el autor valide la transcripción antes de dar por buena la tarea
AUD-01. Los datos están en `src/content/astronauta-coro.json` y se pueden corregir ahí mismo.

## Qué se transcribió

- **Fuente:** `reference/partitura-astronauta.pdf` (voz principal, transcr. L.CH.A.S.), página 1
  desde la letra **B CORO** y las dos primeras líneas de la página 2.
- **Sección:** el coro B1 completo, **compases 17 a 34**: desde "As-tro-na-au-ta" (que entra en
  el tercer pulso del compás 17) hasta "en la tie-e-rra" (compás 34). La casilla 1 (compás 35,
  un silencio) y la casilla 2 ("pies. En la…") no se usan.
- **Tonalidad escrita:** tres bemoles (Mi♭ mayor). **Compás:** 4/4.
- **Cómo se leyó:** el PDF es vectorial, así que las alturas no se leyeron "a ojo": se sacó la
  posición exacta de cada cabeza de nota respecto del pentagrama. Las figuras (corchea, negra,
  blanca), los silencios y las ligaduras se leyeron de la imagen y se comprobó que cada compás
  suma 4 pulsos.

## La melodía, compás por compás

Negra = 1 pulso. `~` es una ligadura de prolongación (la nota sigue sonando, no se vuelve a
atacar). `(sil)` es silencio.

| Compás | Notas (altura · pulsos · sílaba) |
|---|---|
| 17 | (sil) 2 · Mi♭4 1 "As-" · Fa4 ½ "tro-" · Fa4 ½ "na-" ~ |
| 18 | ~ Fa4 ½ "-au-" · Sol4 1 "ta" · (sil) 1½ · Mi♭4 ½ "a-" · Mi♭4 ½ "tra-" |
| 19 | Si♭4 1 "ve-" · La♭4 1 "san-" · Sol4 1 "do el" · Fa4 ½ "si-" · Fa4 ½ "le-" ~ |
| 20 | ~ Fa4 ½ "-en-" · Mi♭4 1 "cio" · (sil) 2½ |
| 21 | La♭4 1 "cá-" · Sol4 1 "li-" · Fa4 1 "do es" · Mi♭4 ½ "el" · Fa4 ½ "so-" ~ |
| 22 | ~ Fa4 1 "-ol" · Re4 ½ "que" · Mi♭4 ½ "te a-" ~ Mi♭4 ½ "-a-" · Re4 1 "com-" · Mi♭4 ½ "pa-" ~ |
| 23 | ~ Mi♭4 ½ "-a-" · Re4 1 "ña" · Do4 ½ "e-" · Si♭3 1 "-en" · (sil) ½ · Mi♭4 ½ "tu" |
| 24 | La♭4 1 "frí-" · Sol4 1 "a" · Fa4 ½ "so-" · Mi♭4 1 "le-" · Fa4 ½ "da-" ~ |
| 25 | ~ Fa4 1 "-ad" · (sil) 1 · Mi♭4 1 "As-" · Fa4 ½ "tro-" · Fa4 ½ "na-" ~ |
| 26 | ~ Fa4 ½ "-au-" · Sol4 1 "ta" · (sil) 1½ · Mi♭4 ½ "tan" · Mi♭4 ½ "pe-" |
| 27 | Si♭4 1 "que-" · La♭4 1 "ño y" · Sol4 1 "tan" · Fa4 ½ "dis-" · Fa4 ½ "ta-" ~ |
| 28 | ~ Fa4 ½ "-an-" · Mi♭4 1 "te" · (sil) 2½ |
| 29 | La♭4 1 "sa-" · Sol4 1 "bes" · Fa4 1 "bien" · Mi♭4 ½ "que" · La♭4 ½ "na-" ~ |
| 30 | ~ La♭4 1 "-a-" · Sol4 ½ "die" · Fa4 ½ "pue-" ~ Fa4 1 "-e-" · Mi♭4 ½ "de" · Mi♭4 ½ "se-" ~ |
| 31 | ~ Mi♭4 1 "-er" · (sil) 2 · Mi♭4 ½ "As-" · Mi♭4 ½ "tro-" |
| 32 | La♭4 1 "nau-" · Sol4 1 "ta" · Fa4 1 "con" · Mi♭4 1 "los" |
| 33 | Fa4 1 "pies" · (sil) 1 · Sol4 1 "en" · Fa4 ½ "la" · Fa4 ½ "tie-" ~ |
| 34 | ~ Fa4 1 "-e-" · Mi♭4 2 "rra" · (sil) 1 |

## Dudas (lo que el autor tiene que confirmar)

Las alturas salen de la geometría del PDF y no tienen duda de lectura. Lo que sigue son
decisiones de interpretación o cosas que la partitura no dice.

1. **Tempo.** La partitura no trae indicación metronómica. Se puso **96 negras por minuto**
   (el coro dura unos 44 s). Es una suposición: hay que cambiarla por el tempo real de la
   canción, o por el que el autor prefiera para la versión cajita (`"tempo"` en el JSON).
2. **Compás 23, "e-en" (Do4 → Si♭3).** Leído: una corchea en Do4 unida por un arco a una negra
   en Si♭3. Como son alturas distintas, se interpretó como **ligadura de expresión** (dos notas,
   la sílaba baja de Do a Si♭) y suenan las dos. Alternativa: que el transcriptor haya querido
   una sola nota larga (Do4 de 1½ pulsos), como en los demás "e-e" / "a-a" del coro, que son
   todas notas ligadas de la misma altura.
3. **Compás 17, primeros dos pulsos.** En la partitura hay un Fa4 negra ("-al", el final de
   "espacial", ligado desde el compás 16) y un silencio de negra. Esa nota es de la estrofa, así
   que **se reemplazó por silencio**: el coro del juego parte con dos pulsos de silencio
   (≈1,25 s, en los que baja el ambiente) y entra en "As-". Alternativa: quitar ese silencio para
   que la primera nota suene apenas arranca la cámara.
4. **Compás 34, final.** Se usó la terminación con letra "tie-e-rra" (Fa4 negra ligada desde el
   compás 33, Mi♭4 blanca). La partitura no escribe nada más largo; en la cajita la última nota
   queda resonando ~3 s. Alternativa: alargarla a redonda si en la canción se sostiene más.
5. **Ritmo "cuadrado".** La partitura anota la voz con corcheas y negras rectas. Si en la
   grabación el fraseo va más sincopado o con swing, la cajita va a sonar más rígida que la
   canción; se corrige editando `"pulsos"` (valen fracciones, por ejemplo 0.75 + 0.25).
6. **Tonalidad real.** Se asume que la partitura está en el tono de la grabación (Mi♭ mayor).
   Ver la decisión de transposición más abajo.

## Decisiones de arreglo (revisables, todas en el JSON o en `chorusVoice.ts`)

- **Timbre: cajita musical** (seno con dos parciales agudos, ataque seco y cola larga con un eco
  corto), coherente con las campanitas que ya existen. Una sola voz, sin acompañamiento.
- **Sube una octava** (`arreglo.octava: 1`): escrita va de Si♭3 a Si♭4; en la cajita suena entre
  ~490 y ~990 Hz, que es donde suenan las campanitas y se oye bien en parlantes de teléfono.
- **Sube un semitono** (`arreglo.transponer: 1`, de Mi♭ a Mi mayor). El pad del ambiente es un
  acorde de La mayor (La–Mi–Sol♯–Do♯). En Mi♭ la melodía choca con él (Mi♭ contra Mi, Re contra
  Do♯); en Mi mayor todas las notas del pad pertenecen a la escala de la melodía. El oído no
  nota un semitono de diferencia al reconocer la canción. Si el autor prefiere el tono original,
  basta poner `"transponer": 0` (el ambiente igual baja mientras suena).
- **El ambiente baja al 30 %** en 1,5 s cuando entra el coro y vuelve en 4 s cuando se apaga la
  última nota (`DUCK` en `src/game/systems/chorusVoice.ts`). Baja todo lo demás: pad, fuego,
  campanitas y arpegio de los ocultos.
- **Acentos:** el primer pulso de cada compás suena un poco más fuerte; las corcheas a
  contratiempo, un poco menos.

## Cómo escucharlo

1. `npm run dev` y abrir la URL con `#debug` (por ejemplo `http://localhost:5173/#debug`).
2. Menú → Seleccionar acto → Acto I. Con el sonido activado.
3. Abrir el panel **debug** (arriba) y apretar **"Escuchar el coro (AUD-01)"**, al final del
   panel. Suena desde el principio cada vez que se aprieta (también en la pantalla de intro).
4. Para oírlo en su lugar: **"Marcar todo → final"**, cerrar las tarjetas hasta la cita, y el
   coro entra junto con la vuelta de la cámara.

## Cómo corregir una nota

En `src/content/astronauta-coro.json`, cada nota es
`{ "nota": "Eb4", "pulsos": 1, "silaba": "As-" }`:

- `nota`: letra (C D E F G A B = do re mi fa sol la si), `b` o `#` si corresponde, y la octava
  (C4 es el do central). Las alteraciones de la armadura se escriben siempre (`Eb4`, no `E4`).
  `null` es un silencio.
- `pulsos`: duración en negras (corchea 0.5, negra 1, blanca 2).
- `ligada: true`: la nota se une a la siguiente, que debe tener la misma altura.
- `silaba`: solo sirve para ubicarse; no afecta el sonido.

`npm test` avisa, en español y con el número de compás, si un compás no suma 4 pulsos o si una
nota está mal escrita.
