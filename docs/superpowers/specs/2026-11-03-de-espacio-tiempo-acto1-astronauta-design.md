# Brief narrativo — "De Espacio-Tiempo", Acto I ("Astronauta")

## Historial

- **2026-11-03:** versión original. Premisa de duda sin amnesia, sin vínculos humanos y cierre en quietud junto al fuego.
- **2026-11-05: cambio de canon decidido por el autor**, al reescribir los textos (DIS-02). Cambian las decisiones 2, 4, 5, 7 y 8, el mapeo de objetos y los textos de dirección. Lo que el autor ya escribió está en `src/content/acto1.json`, que ahora es la referencia del copy; este brief fija el canon que esos textos establecen.
- **2026-11-05: revisión de objetos (DIS-03), aprobada por el autor.** La estructura (5 capítulos, 10 ids, mismas posiciones) no cambia. Cambia la forma de cinco objetos para que correspondan a sus textos: `thermos`, `photo`, `seeds`, `recorder` y `beacon`. Los modelos se construyen en ART-07.
- **2026-11-05: objetos ocultos (DIS-04).** Cinco guiños a Tiann en el paseo libre (guitarra, lápiz de insulina, foto del campanil, arete de hoja y carta en el mirador); Isi no los reconoce. Ver "Objetos ocultos".

## Contexto

Lumen Vale — Remember funciona como MVP: la atmósfera y la jugabilidad ya son las
que el autor busca.

El proyecto es la adaptación jugable de un álbum en curso, **"despacio-tiempo"**.
Cada acto del juego corresponde a una canción del álbum, en el mismo orden del
tracklist. Este documento es el brief del **Acto I**, anclado a la canción
**"Astronauta"** (#1).

El juego se llama **"De Espacio-Tiempo"** (juego de palabras: "despacio" +
"espacio-tiempo"). En pantalla el autor lo escribe "De espacio-tiempo".

Este documento **no propone cambios de motor/mecánica**. La estructura de
capítulos por radio creciente, la mecánica de sostener la mirada y el sistema de
`Narrative`/`gameStore` se conservan tal cual.

## Canción ancla: "Astronauta" (letra completa, para referencia directa)

```
// A1
Llevas años preparando tu equipaje
El polvo de la duda se acumula
en el motor al despegar
Con tu traje y tu casco vas ligero
Tu estela no es lo único que deja atrás
tu traje espacial

// B1
Astronauta, atravesando el silencio
Cálido es el sol que te acompaña en tu fría soledad
Astronauta, tan pequeño y tan distante
Sabes bien que nadie puede ser
Astronauta con los pies en la Tierra

// A2.1
Te comprendo, tú también te sientes solo
Tus mensajes a la Luna ya no llegan
y se pierden en el mar
De galaxias, nebulosas y estrellas
Te recuerdan que ante la inmensidad
eres arena en el salar

// A2.2
Pero a veces recobras la esperanza
De que en algún rincón del universo
Tu voz alguien la escuche

// B2 (repite B1)

// C1
En la Tierra mirabas al cielo para olvidar
Que la vida es tan solo un instante de ingravidad
Y frente al vacío de sueños perdidos
El horizonte de eventos promete algo más

// B3 (repite, cierra en "Astronauta con los pies en la Tierra")
```

**Frase central (se cita textual en el cierre del acto):**
"Nadie puede ser astronauta con los pies en la Tierra."

**Idea central de la canción:** alguien que vive mirando el espacio desde
tierra firme, consciente de su anhelo, paralizado por la incertidumbre. La
canción crece desde la quietud hasta un clímax emocional: el momento en que el
miedo ya no puede más contra el deseo, y el despegue se vuelve inevitable.

**Canción #2, "Despacio" (siguiente acto, solo como referencia; NO resolver nada
de esto en el Acto I):** la contemplación de la vida, darse cuenta de que todos
batallan sus propias luchas contra un mundo que no para, y la necesidad de
refugio y resistencia en símbolos, lugares y personas que devuelven la capacidad
de frenar. Saberse rebelde lo es todo. Congelar el tiempo en una imagen de
ternura lo es todo.

## Decisiones de diseño

1. **Idioma del juego: español.**

2. **Escenario (revisado 2026-11-05):** se mantiene el valle alienígena actual,
   con su terreno, cielo, nave y sistema de chunks. Es **un planeta desconocido**
   para Isi: no era su destino. Iba camino a otro lugar (la estrella) y cayó
   aquí.

3. **Protagonista:** se llama **Isi**. Su nombre aparece en una etiqueta dentro
   del casco.

4. **Dispositivo narrativo (revisado 2026-11-05): Isi despierta sin recordar.**
   Despierta junto a un fuego, sin saber dónde está ni cómo llegó. Mirar los
   objetos le devuelve la memoria, pieza por pieza: el gesto de sostener la
   mirada es **recuperar un recuerdo**. El radio que crece sigue siendo miedo,
   no solo memoria: en el borde, Isi "no se atreve a mirar más allá todavía" y
   "el miedo pesa más que la curiosidad". Recordar y atreverse avanzan juntos.

5. **Vínculo humano (revisado 2026-11-05):** Isi tiene **familia**. Aparece en
   una foto (personas graciosas y un gato), sin nombres y sin nadie esperándola
   de forma explícita. Las transmisiones siguen sin respuesta ("¿Habrá alguien
   que me escuche?"): a quién le habla Isi cuando transmite sigue siendo un
   hilo reservado para un acto futuro. La familia no se desarrolla en este acto.

6. **La causa de la caída:** no hay avería externa dramática ni villano. Isi
   salió con miedo ("¿por qué salí afuera? Estaba tan segura en casa…") y, casi
   llegando a su destino, **dudó**. Eso bastó para caer. Es la frase central
   hecha literal: un pie todavía en la Tierra cuando ya estaba en el aire. El
   misterio del acto es reconstruir esa caída hasta llegar a la palabra "dudé".

7. **Cierre del Acto I (revisado 2026-11-05):** la duda se admite al terminar
   el capítulo 4 (la nave). El último recuerdo (`star`, mirando al cielo) es
   **el destino**: la estrella a la que iba, y la misión que quiere completar
   aunque le asuste. El acto cierra con Isi sabiendo lo que sigue: arreglar la
   nave es lo fácil; lo difícil es **atreverse a salir**. La frase central
   llega como algo que Isi escuchó una vez en una canción. El cierre tiene dos
   mitades, y las dos deben estar: **todavía duele** (el miedo no se fue) y
   **está bien atreverse**, aunque la incertidumbre siga presente. No muestra el
   despegue ni la reparación.

8. **Encaje con el arco del álbum (revisado 2026-11-05):** el Acto I planta la
   herida (por qué cayó) y deja claro el deseo de volver a volar. Lo que queda
   abierto es **si se atreve**. El despegue en sí (subir a la nave y salir)
   sigue reservado para el Acto 6 ("el regreso"). Los actos intermedios
   (incluido "Despacio", sobre refugio y pausa) no la hacen despegar. Acto I =
   la caída y el deseo. Acto 6 = el ascenso. Todo lo del medio es el "despacio"
   entre ambos.

## Mapeo de objetos/recuerdos (10 ítems, 5 capítulos, radio creciente)

Se conservan los `id` técnicos (son claves internas y de `localStorage`). El
copy final vive en `src/content/acto1.json`; aquí va el eje de cada objeto.

### Tabla de objetos (DIS-03, aprobada 2026-11-05)

| Capítulo | id | Qué se ve | Qué recuerdo recupera Isi |
|---|---|---|---|
| 0 · despertar | `fire` | igual que hoy | no sabe si hizo el fuego ella misma |
| 0 | `helmet` | igual que hoy | su nombre, «ISI» |
| 0 | `thermos` | **set de mate**: termo, mate de madera y bombilla | un olor familiar, de casa |
| 1 · antes de partir | `patch` | igual que hoy (cohete y planeta) | tenía una misión |
| 1 | `photo` | **foto donde se distinguen Isi joven, la familia y el gato**, pequeños y pixelados | su familia; empieza a recordar de verdad |
| 1 | `seeds` | **walkie-talkie** con antena | más de 100 mensajes sin respuesta |
| 2 · el miedo | `recorder` | **cuaderno negro de tapa dura**, con el cohete y el planeta de la insignia en la tapa | el miedo que escribió durante el vuelo |
| 2 | `beacon` | **rejilla del motor con polvo acumulado**; mantiene la luz roja que parpadea, eco de la nave | reconoce una pieza de su nave |
| 3 · la nave | `ship` | igual que hoy | quería volar; dudó |
| 4 · el destino | `star` | igual que hoy | la estrella a la que iba |

Criterios para el arte (ART-07): mismo estilo low-poly y Lambert flat del
juego; la foto es la única excepción, con una imagen pixelada muy pequeña.
Cada objeto conserva aproximadamente su tamaño y posición actuales para que la
mecánica de mirar no cambie. El dibujo de la tapa del cuaderno es el mismo
emblema de la insignia (`patch`).

### Capítulo 0 — despertar junto al fuego
- **`fire`**: el fuego. Isi no sabe si lo hizo ella misma.
- **`helmet`**: el casco de astronauta, maltratado, con la etiqueta «ISI»
  adentro. Es el primer dato de quién es.
- **`thermos`**: un set de mate (termo, mate de madera, bombilla). El olor le
  resulta familiar. *Modelo pendiente (ART-07): hoy la escena solo tiene un
  termo.*

### Capítulo 1 — quién era antes de partir
- **`patch`**: la insignia de la misión (cohete y planeta). Isi recuerda que
  tenía una misión.
- **`photo`**: Isi joven con su familia y un gato, que se distinguen aunque
  sean pequeños y pixelados. Aquí empieza a recordar de verdad. *Modelo
  pendiente (ART-07): hoy la foto es un rectángulo de color.*
- **`seeds`** (transmisor): un walkie-talkie con antena. Más de cien mensajes
  al espacio, sin respuesta. *Modelo pendiente (ART-07): hoy es un frasco de
  semillas.*

### Capítulo 2 — el miedo del viaje
- **`recorder`**: un cuaderno negro de tapa dura con el emblema de la misión
  (cohete y planeta). Adentro, un mensaje que Isi misma escribió durante el
  vuelo: tenía miedo y extrañaba la seguridad de casa. *Modelo pendiente
  (ART-07): hoy es una caja naranja.*
- **`beacon`**: una rejilla del motor con polvo acumulado y la luz roja que
  parpadea; la reconoce como parte de su nave. Eco de "el polvo de la duda se
  acumula en el motor". *Modelo pendiente (ART-07): hoy es un poste con un
  plato (la baliza del original).*

### Capítulo 3 — la nave
- **`ship`**: siempre quiso volar entre las estrellas, y ahora le duele mirar
  la nave. Al terminar el capítulo admite la causa: dudó.

### Capítulo 4 — el destino
- **`star`** (gatillo: mirar al cielo): la estrella lejana a la que iba. Debe
  completar la misión, aunque le asuste.
- Beat final (`al_terminar` del capítulo 5 en el JSON): lo fácil y lo difícil,
  y la frase central como algo escuchado en una canción.

## Objetos ocultos (DIS-04)

### La idea

Todo lo que Isi encuentra durante el acto es suyo y le devuelve un recuerdo.
Los ocultos son lo contrario: **Isi no los reconoce**. Esa es la sorpresa del
paseo libre: **alguien estuvo en este planeta antes que ella**. Nunca se dice
quién. Cada objeto es un guiño a Tiann (el autor del álbum) que reconoce quien
lo conoce; para el resto es un misterio con sentido propio.

Lo que el jugador debe sentir al encontrar uno: **sorpresa, como una
revelación**.

### Reglas

- Solo existen en el **paseo libre** (después del cierre). No cuentan en el
  contador.
- Se activan igual que un recuerdo: sostener la mirada (quieta, 1,7 s). Dan una
  tarjeta (título y texto) y un sonido.
- Se guardan en `lvr-a1-hidden-<seed>`, según el ADR 0001.
- **Nunca explícitos:** ningún texto dice quién estuvo aquí, ni nombra a Tiann,
  ni explica el guiño.
- **Hilos reservados:** ningún oculto insinúa el despegue (Acto 6). La carta
  no está dirigida a Isi ni es de ella, así que no responde a quién le habla
  Isi cuando transmite.
- Los textos los escribe el autor. Van en `acto1.json`, en una sección propia
  de ocultos.

### Los cinco (aprobados por el autor el 2026-11-05)

| id (propuesto) | Qué se ve | El guiño (para el equipo, no aparece en el juego) | Dónde |
|---|---|---|---|
| `guitar` | Guitarra clásica de madera, apoyada sola contra una roca | La Manuel Rodríguez de Tiann: su manera de comunicarse con la gente, y la guitarra con la que compuso "Astronauta". Es el origen de la canción que se acaba de jugar | Lejos, en una dirección que nada del acto señala |
| `insulin` | Lápiz de insulina, pequeño, fácil de pasar por alto | Tiann tiene diabetes tipo 1 desde los 11 años; es parte de su identidad. Eco de "con tu traje y tu casco vas ligero": lo que alguien lleva siempre encima | Entre cristales |
| `campanil` | Foto del campanil de Concepción | "Astronauta" se escribió mirando esa estructura, y el campanil aparece en la portada del álbum, que diseñó la esposa de Tiann | Orientada de modo que, al mirarla, el jugador quede de frente a la estrella de Isi (`sky.shipStar`): la foto mira hacia donde mira la canción |
| `earring` | Arete alargado con forma de hoja, de cobre rojizo | El pendiente que Tiann usa en muchas de sus presentaciones. Una hoja de otoño en un planeta sin otoños | Entre la vegetación alienígena (tallos con bulbos) |
| `letter` | Una carta | Una reflexión del que pasó por aquí, contemplando el paisaje. Tono de referencia del autor: «Si encontraste esto, eres afortunado. Y no me refiero a la carta» | **En el mirador** (DIS-05). El mirador es solo un lugar; la carta es la recompensa de llegar |

### Dificultad: desafiante, no imposible

- **Repartidos:** cada oculto en una dirección distinta desde el fuego, entre
  **220 y 380 m** (la historia llega a 150 m y el paseo libre a 400 m). No se
  encuentran siguiendo una sola ruta.
- **Fuera de los caminos conocidos:** ninguno en la dirección de la nave ni en
  la de la estrella.
- **Escondidos por el entorno:** desde lejos no se ven, solo al llegar cerca.
- **Señal de cercanía:** un destello leve, como algo que refleja la luz, visible
  a unos 30 m. No se ve desde lejos; cuando aparece, el jugador sabe que
  encontró algo. Sin pistas de texto.
- El mirador es la excepción: es un lugar y se descubre como lo defina DIS-05.

### Decisiones de Claude (revisables)

- **Escondite propio.** Como el terreno cambia con la semilla, una loma no
  está garantizada. Cada oculto trae su propio escondite (un nido de rocas o de
  vegetación construido junto con el objeto), así queda oculto en cualquier
  semilla.
- **Determinismo.** La posición de cada oculto se fija por ángulo y distancia
  desde el fuego. Si cae en agua o dentro de un collider, se corre al punto
  seco más cercano. Cualquier aleatoriedad usa un generador propio derivado de
  la semilla, nunca el `rng()` de `chunks.ts`, `storyWorld.ts` ni `sky.ts`.
- **Diario.** Los ocultos no aparecen en el diario por ahora; si se muestran, y
  cómo, se decide con la UI (UI-02).
- **Sonido.** Los ocultos usan el mismo sonido de recuerdo de siempre, salvo la
  guitarra (abajo).

### Sonido de la guitarra (decisión del autor)

Al encontrar la guitarra suena este arpegio, barrido de la 1.ª a la 6.ª cuerda
(de la nota más aguda a la más grave), en afinación estándar:

| Cuerda | Traste | Nota |
|---|---|---|
| 1.ª (Mi4) | 3 | Sol4 |
| 2.ª (Si3) | 3 | Re4 |
| 3.ª (Sol3) | 3 | La#3 |
| 4.ª (Re3) | 5 | Sol3 |
| 5.ª (La2) | 6 | Re#3 |
| 6.ª (Mi2) | 6 | La#2 |

Las notas forman un Mib maj7 con La# (Sib) en el bajo. Reemplaza el sonido de
recuerdo de siempre solo para este oculto; el timbre y la velocidad del barrido
los propone audio y los aprueba el autor.
- **Modelos.** Son cinco modelos nuevos con las mismas reglas de ART-07 (low-poly,
  Lambert flat, presupuesto de `models.test.ts`). La foto del campanil puede ser
  una imagen pixelada pequeña, como la `photo` del capítulo 1.

## Notas de implementación

- **No tocar** el orden de capítulos por radio, la mecánica de sostener la
  mirada (quieta, 1,7 s), `Narrative`, `gameStore`, ni el orden de llamadas a
  `rng()` en `chunks.ts`/`storyWorld.ts`/`sky.ts`.
- No cambiar las claves de `localStorage`.
- **El cielo no amanece** (`PRE_DAWN` en `Game.ts`): el amanecer sigue
  reservado para el Acto 6, aunque el cierre ahora mire hacia adelante.
- El final ofrece seguir explorando, en línea con los objetos ocultos (DIS-04).

## Verificación

Antes de dar por terminado un cambio de texto:
`npm run lint && npm run typecheck && npm test && npm run build`.
