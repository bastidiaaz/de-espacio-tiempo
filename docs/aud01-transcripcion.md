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

## Armonía para el piano (propuesta, a validar)

Pedido del autor tras la primera prueba: "Agrega un piano de fondo arpegiando los acordes."

**De dónde salen los acordes:** la partitura trae solo la voz principal: no tiene cifrado, ni parte
de piano o guitarra, ni bajo. **Todos los acordes de abajo son una propuesta de Claude**, deducida
de la melodía (qué notas caen en los tiempos fuertes de cada compás) con un criterio simple: un
acorde por compás, todos diatónicos de Mi♭ mayor, progresiones de pop. Ninguno está confirmado:
el autor tiene que reemplazarlos por los acordes reales de la canción.

Están en el tono escrito (Mi♭ mayor), en `"acordes"` de cada compás del JSON.

| Compás | Letra | Acorde | Por qué (propuesta, a validar) |
|---|---|---|---|
| 17 | (…-al) As-tro-na- | **Bb** | La estrofa termina en Fa (5ª de Si♭); dominante que prepara la entrada del coro. |
| 18 | -au-ta, a-tra- | **Eb** | "ta" cae en Sol (3ª) y el compás cierra en Mi♭: tónica. |
| 19 | ve-san-do el si-le- | **Cm** | Si♭ y Sol en los tiempos 1 y 3 (7ª y 5ª de Do menor). Alternativa: Eb. |
| 20 | -en-cio | **Ab** | Fa → Mi♭ (6ª → 5ª). Alternativa: Bb. |
| 21 | cá-li-do es el so- | **Fm** | La♭ y Fa en los tiempos 1 y 3. Alternativa: Ab. |
| 22 | -ol que te a-com-pa- | **Bb** | Fa y Re son notas del acorde; el Mi♭ funciona como retardo. |
| 23 | -a-ña e-en tu | **Cm** | Mi♭ y Do; baja a Si♭. Alternativas: Bb (seguir en la dominante) o Gm. |
| 24 | frí-a so-le-da- | **Ab** | Parte en La♭. |
| 25 | -ad, As-tro-na- | **Bb** | Igual que el 17: Fa largo, dominante que vuelve a "Astronauta". |
| 26 | -au-ta, tan pe- | **Eb** | Igual que el 18. |
| 27 | que-ño y tan dis-ta- | **Cm** | Igual que el 19. |
| 28 | -an-te | **Ab** | Igual que el 20. |
| 29 | sa-bes bien que na- | **Fm** | La♭ y Fa en los tiempos fuertes. Alternativa: Ab. |
| 30 | -a-die pue-e-de se- | **Bb7** | La♭ largo (la 7ª) que baja a Sol y Fa. Alternativa: Fm. |
| 31 | -er, As-tro- | **Eb** | "ser" cae en Mi♭: reposo. Alternativa: Cm (cadencia rota). |
| 32 | nau-ta con los | **Ab** | La♭ en el primer tiempo. |
| 33 | pies en la tie- | **Bb** | Fa (5ª): dominante antes del final. |
| 34 | -e-rra | **Eb** | Fa → Mi♭: cierre en la tónica. |

En resumen: `Bb | Eb | Cm | Ab | Fm | Bb | Cm | Ab | Bb | Eb | Cm | Ab | Fm | Bb7 | Eb | Ab | Bb | Eb`.

**Cómo corregir un acorde:** en el JSON, `"acordes": [{ "acorde": "Bb", "pulsos": 4 }]`. Se aceptan
mayores (`Eb`), menores (`Cm`), séptimas (`Bb7`, `Fm7`, `Abmaj7`). Para dos acordes en un compás:
`[{ "acorde": "Eb", "pulsos": 2 }, { "acorde": "Bb", "pulsos": 2 }]`; tienen que sumar 4 pulsos.
Todavía no se pueden escribir inversiones ni bajos (`Eb/G`) ni suspendidos.

**Cómo toca el piano (decisiones revisables):**

- **Figura:** corcheas, una por medio pulso: fundamental, 5ª, octava, 3ª, 5ª, 3ª, octava, 5ª
  (sube y vuelve). Si el acorde tiene 7ª, reemplaza a la octava de vuelta. La figura parte de
  nuevo en la fundamental en cada cambio de acorde (`src/game/systems/arpeggio.ts`).
- **Con pedal:** cada nota queda sonando hasta el cambio de acorde.
- **Último compás:** solo sube (fundamental, 5ª, octava, 3ª) y se deja resonar.
- **Empieza con el coro:** en el compás 17 el piano suena solo dos pulsos (Si♭) antes de que entre
  "As-". Si se prefiere que entren juntos, hay que quitar el silencio inicial (duda 3).
- **Registro:** el bajo de cada acorde cae entre Fa2 y Mi3 (escrito) y la figura llega hasta una
  12ª más arriba; nunca pasa por encima de la melodía. El piano sigue `arreglo.transponer` (el
  mismo tono que la melodía) pero **no** `arreglo.octava`: esa octava es solo de la cajita.
- **Timbre:** piano suave sintetizado, sin samples (un oscilador por nota con seis armónicos,
  golpe de martillo corto y filtro que le quita brillo; `src/game/systems/pianoVoice.ts`). Va sin
  eco, para que las corcheas no se empasten.
- **Volumen:** menos de la mitad de la melodía (`PEAK` 0,045 contra 0,1), para que la cajita quede
  claramente delante. Sale por el mismo bus de la canción: respeta el sonido, el silencio y el
  borde igual que la melodía.

**Qué escuchar al validar:** (1) si algún compás "suena a otra canción", ese acorde está mal: los
más dudosos son 19–21, 23 y 29–31; (2) si el piano tapa o no a la cajita; (3) si la figura en
corcheas va con el carácter de la canción o conviene algo más lento (negras) o más abierto.

## Decisiones de arreglo (revisables, en el JSON o en `chorusVoice.ts`)

- **Timbre: cajita musical** (seno con dos parciales agudos, ataque seco y cola larga con un eco
  corto), coherente con las campanitas que ya existen. Una sola voz; debajo va el piano (ver arriba).
- **Sube una octava** (`arreglo.octava: 1`): escrita va de Si♭3 a Si♭4; en la cajita suena entre
  ~490 y ~990 Hz, que es donde suenan las campanitas y se oye bien en parlantes de teléfono.
- **Sube un semitono** (`arreglo.transponer: 1`, de Mi♭ a Mi mayor). El pad del ambiente es un
  acorde de La mayor (La–Mi–Sol♯–Do♯). En Mi♭ la melodía choca con él (Mi♭ contra Mi, Re contra
  Do♯); en Mi mayor todas las notas del pad pertenecen a la escala de la melodía. El oído no
  nota un semitono de diferencia al reconocer la canción. Si el autor prefiere el tono original,
  basta poner `"transponer": 0` (el ambiente igual baja mientras suena).
- **El ambiente baja al 30 %** en 1,5 s cuando entra el coro y vuelve en 4 s cuando se apaga la
  última nota (`CHORUS_DUCK` en `src/game/systems/audio.ts`). Baja todo lo demás: pad, fuego,
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
