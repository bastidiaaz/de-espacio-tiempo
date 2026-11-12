# Brief narrativo — "De Espacio-Tiempo", Acto I ("Astronauta")

## Historial

- **2026-11-03:** versión original. Premisa de duda sin amnesia, sin vínculos humanos y cierre en quietud junto al fuego.
- **2026-11-05: cambio de canon decidido por el autor**, al reescribir los textos (DIS-02). Cambian las decisiones 2, 4, 5, 7 y 8, el mapeo de objetos y los textos de dirección. Lo que el autor ya escribió está en `src/content/acto1.json`, que ahora es la referencia del copy; este brief fija el canon que esos textos establecen.
- **2026-11-05: revisión de objetos (DIS-03), aprobada por el autor.** La estructura (5 capítulos, 10 ids, mismas posiciones) no cambia. Cambia la forma de cinco objetos para que correspondan a sus textos: `thermos`, `photo`, `seeds`, `recorder` y `beacon`. Los modelos se construyen en ART-07.
- **2026-11-05: objetos ocultos (DIS-04).** Cinco guiños a Tiann en el paseo libre (guitarra, lápiz de insulina, foto del campanil, arete de hoja y carta en el mirador); Isi no los reconoce. Ver "Objetos ocultos".
- **2026-11-05: mirador (DIS-05).** Una cordillera en el borde del mundo que, al escalarla, revela un cielo que solo existe ahí: un planeta anillado gigante y una galaxia. La carta está en la cima. El planeta del cielo normal se achica. Ver "Mirador".
- **2026-11-05: decisiones del autor para los textos de los ocultos (DIS-12).** Títulos con artículo indefinido, el reverso de la foto del campanil, la voz de la carta y un dato de canon nuevo: Isi vive mucho después de 2025. Ver "Textos: decisiones del autor".
- **2026-11-05: borde (DIS-06).** Antes del tope, el mundo se apaga: se oscurece, la música se desvanece, crece el viento e Isi camina más lento, como empujada. El paseo libre tiene el mismo borde a los 400 m, salvo en el mirador, y una frase propia. Ver "Borde".
- **2026-11-05: cierre (DIS-07).** Capítulo nuevo entre la nave y la estrella: Isi vuelve a la fogata, recupera convicción y se sienta (11 recuerdos, 6 capítulos). Sentada mira la estrella; tras la cita suena el coro de "Astronauta" una vez mientras la cámara da una vuelta de 360° por el cielo, y aparece la pantalla final «Te sientas junto al fuego» con la invitación a ffm.to. Resuelve D6. Ver "Cierre".
- **2026-11-05: revelación de la nave (DIS-08).** Al acercarse, la niebla esconde la nave y la música se apaga; a 30 m el juego toma la cámara unos 10 s (no se puede saltar), la niebla se abre y la nave aparece enorme y estrellada, del tamaño de un bus, con un acorde grave y crujidos del casco. Después se le sostiene la mirada como siempre. Ver "Revelación de la nave".
- **2026-11-06: la estrella queda fija (decisión del autor, ENG-13).** La estrella es el planeta lejano al que iba Isi («Un planeta lejano») y ya no se mueve por el cielo: queda siempre en la misma dirección. Así se cumplen «ningún oculto en la dirección de la estrella» y «la foto del campanil mira hacia la estrella». El aspecto de planeta llega con ART-06.

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
   despegue ni la reparación. Antes de la estrella, Isi vuelve a la fogata y se
   sienta (DIS-07); la secuencia completa está en "Cierre".

8. **Encaje con el arco del álbum (revisado 2026-11-05):** el Acto I planta la
   herida (por qué cayó) y deja claro el deseo de volver a volar. Lo que queda
   abierto es **si se atreve**. El despegue en sí (subir a la nave y salir)
   sigue reservado para el Acto 6 ("el regreso"). Los actos intermedios
   (incluido "Despacio", sobre refugio y pausa) no la hacen despegar. Acto I =
   la caída y el deseo. Acto 6 = el ascenso. Todo lo del medio es el "despacio"
   entre ambos.

## Mapeo de objetos/recuerdos (11 ítems, 6 capítulos, radio creciente)

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
| 4 · la fogata (DIS-07) | `campfire` | el mismo fuego del campamento | recupera convicción para poder mirar al cielo; se sienta |
| 5 · el destino | `star` | igual que hoy | la estrella a la que iba |

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

### Capítulo 4 — la fogata (DIS-07)
- **`campfire`**: Isi vuelve al fuego del campamento porque necesita sentarse
  a reordenar sus ideas. Recupera convicción para poder mirar al cielo, y se
  sienta.

### Capítulo 5 — el destino
- **`star`** (gatillo: mirar al cielo, ya sentada junto al fuego): la estrella
  lejana a la que iba. Debe completar la misión, aunque le asuste.
- Beat final (`al_terminar` del capítulo 6 en el JSON): lo fácil y lo difícil,
  y la frase central como algo escuchado en una canción. Después, el coro
  (ver "Cierre").

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
- **Sonido de cercanía (decisión del autor, 2026-11-06, al probar ENG-13):**
  los ocultos eran demasiado difíciles. Desde unos **70 m** del oculto no
  encontrado más cercano suena un **arpegio tierno y calmo**, en bucle: notas
  suaves, como de cajita de música, que suben y bajan por La mayor con novena
  (La4, Do#5, Mi5, Si5, Mi5, Do#5) y una pausa, una nota cada 0,5 s. **Solo
  crece el volumen** al acercarse; las notas y el tempo no cambian. Se escucha
  hacia el lado donde está el objeto, calla mientras hay una tarjeta abierta y
  se apaga al encontrarlo. Vale también para la carta: el mirador sigue sin
  nada que lo señale desde lejos, pero ya en la ladera la carta suena como los
  demás. Lógica en `src/game/systems/proximity.ts`.
- El mirador es la excepción: es un lugar y se descubre como lo defina DIS-05.

### Lugares de los ocultos (decisión del autor, 2026-11-06)

**La idea.** Los ocultos seguían siendo difíciles de encontrar. Alrededor de
cada uno, el terreno cambia: un pedazo de bioma que **no aparece en ninguna
otra parte del planeta**, para que el jugador piense "esto no lo había visto"
y vaya a mirar. No es una flecha ni un cartel; la curiosidad la pone el
lugar. El orden de las pistas al acercarse es: **el lugar raro** (visible a
unos 100 m, con la niebla) → **el arpegio** (desde 70 m) → **el destello**
(desde 30 m) → el objeto en su escondite.

**Reglas del autor:**

- Cada oculto tiene **su propio lugar**. Uno es muy distinto; los otros
  bastan con un cambio claro (color de la tierra, árboles con otra forma,
  terreno más puntiagudo, una isla).
- Los elementos van **cerca del objeto, pero no al lado**: el escondite de
  cada uno no cambia.

**Los cinco (aprobados por el autor el 2026-11-06):**

| Oculto | Su lugar |
|---|---|
| `guitar` (el muy distinto) | Un **bosquecillo de árboles de madera**: troncos claros, delgados y algo curvos, con copas redondas, y el suelo en un tono arena cálido. En el planeta no hay árboles (hay hongos, tallos con bulbos y cristales), así que la madera se nota. La guitarra es de madera: el lugar rima con el objeto sin explicarlo. |
| `insulin` | **Terreno puntiagudo**: agujas altas de roca y cristal que salen del suelo, con la tierra teñida de un azul frío. Amplía el "entre cristales" de su escondite. |
| `campanil` | **Una isla**: un estanque en anillo y la foto en el islote. Se llega nadando, como en el resto del mapa. |
| `earring` | **Tierra rojiza, color cobre**, entre los tallos con bulbos de su escondite. Tierra y no hojas: un bosque otoñal contradiría «no parece haber otoños en este planeta». |
| `letter` | Nada extra: su lugar es la montaña del mirador (ART-08), que nada señala desde lejos. |

**Más marcados, con una gran estructura (decisión del autor, 2026-11-06).**
Tras la primera prueba, el autor pidió biomas más marcados y una gran
estructura en cada uno, propia del planeta (natural, no hecha por nadie):

| Bioma | Estructura |
|---|---|
| Bosquecillo de madera (`guitar`) | Un **árbol madre** enorme: tronco ancho, raíces que se arquean sobre el suelo y una copa gigante; los árboles chicos parecen sus hijos. |
| Agujas azules (`insulin`) | Una **catedral de cristal**: cristales gigantes que se inclinan hacia un mismo punto, con un brillo tenue propio. |
| Isla (`campanil`) | Una **roca flotante** enorme suspendida sobre la isla, con raíces y tallos colgando. Hay islotes flotantes en el planeta, pero ninguno tan grande ni tan bajo. |
| Tierra cobriza (`earring`) | Un **arco de roca cobriza** gigante y natural, bajo el que se puede pasar. |
| Carta (`letter`) | Ninguna: su estructura es la montaña del mirador (ART-08). |

- **Colosales (decisión del autor, 2026-11-06):** miden de **60 a 100 m**
  (unas cuatro veces su primera versión) y van a unos **40–55 m** del objeto,
  para que su base no caiga sobre el escondite; la roca flotante cuelga a
  ~48 m sobre la isla.
- **Siempre en la niebla (decisión del autor, 2026-11-06):** como todo lo
  demás, también en el paseo libre. Se probó sacarlas de la niebla para verlas
  a lo lejos como siluetas y el autor prefirió que no: se descubren al
  acercarse, igual que el resto del planeta.
- **Siluetas desde la fogata (decisión del autor, 2026-11-06):** desde la
  fogata, las cuatro estructuras se ven como siluetas en la niebla. Más allá
  del final de la niebla todo toma el color del horizonte, así que una
  estructura solo se distingue donde asoma contra el cielo más oscuro de
  arriba. Por eso cada una se coloca del lado de su bioma que mira a la
  fogata y se agranda lo necesario para que su cima suba al menos **14°**
  sobre el horizonte y **8°** por encima de cualquier loma en el camino (la
  roca flotante, además, asoma entera sobre la loma). Tope: 12 veces su
  primer tamaño; detrás de una loma muy grande junto al campamento, asoma
  menos.
- **Sin rastros (decisión del autor, 2026-11-06):** se probó un rastro de
  pistas del bioma desde la fogata hasta cada estructura y el autor lo quitó:
  ver las siluetas desde lejos basta para guiar la exploración.
- Más marcados: el bioma llega a unos **55 m** del objeto (la tierra teñida, a
  ~60 m), con el doble de elementos, más detalle a ras de suelo y la tierra a
  casi plena intensidad. Dentro del bioma no aparecen los hongos, tallos ni
  cristales comunes del resto del planeta.

**Decisiones de Claude (revisables):**

- **Tamaño.** El lugar ocupa un anillo de unos **10 a 55 m** alrededor del
  objeto. Lo bastante grande para verse entre la niebla y sin tocar el
  escondite (5 m).
- **Siempre presentes.** Los lugares existen desde el principio, igual que
  los escondites; solo los objetos aparecen en el paseo libre. Durante la
  historia (150 m) el borde de un bioma puede quedar a unos 15 m del límite
  caminable, pero la niebla del capítulo lo esconde.
- **Determinismo.** Cada lugar usa el generador propio de los ocultos,
  derivado de la semilla. El color de la tierra se calcula por posición, sin
  azar. Los árboles y las agujas no tocan el terreno.
- **La isla sí cambia el terreno**, solo ahí: un anillo de unos 7 a 15 m
  alrededor de la foto se hunde bajo el agua y el islote (5 m) queda seco.
  Es un ajuste local de `TerrainField`, nulo a menos de 200 m del fuego, así
  que el fixture de `terrain.test.ts` (puntos a menos de 150 m) no cambia;
  las semillas existentes solo cambian en esa isla. La foto se ubica
  primero con el terreno original y después se hunde el anillo.
- **Colisiones.** Los árboles y las agujas tienen collider; Isi los rodea.
- **Móvil primero.** Cada lugar son una o dos mallas instanciadas (pocas
  draw calls), sin sombras, con el Lambert flat de siempre.
- **Mientras no exista ART-11,** los árboles y las agujas son formas
  procedurales low-poly del mismo estilo que el resto del mundo.

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

### Textos: decisiones del autor (DIS-12, 2026-11-05)

- **Títulos con artículo indefinido** ("Una guitarra", "Un arete"…), a
  diferencia de las memorias ("El casco"). Así se marca sin decirlo que el
  objeto no es de Isi.
- **Isi identifica qué es cada objeto, aunque no sepa de quién es.** La
  excepción es el lápiz de insulina: lo describe sin saber qué es.
- **Campanil:** en el reverso de la foto está escrito "7 de Noviembre de
  2025, Concepción". El lugar se nombra solo así, como un dato del objeto.
- **Canon nuevo, por la foto:** Isi vive **mucho después de 2025**. Al leer la
  fecha dice "Eso fue hace mucho tiempo". No se fija cuánto tiempo pasó ni el
  año de Isi; los actos siguientes no deben contradecirlo.
- **Carta:** habla solo la voz de quien la escribió, entre «», y Isi no agrega
  nada. Cabe en una sola tarjeta y no lleva firma: una inicial acercaría
  demasiado el nombre de Tiann.
- **Ninguna tarjeta dice "alguien estuvo aquí".** Los ocultos se encuentran en
  cualquier orden y la sorpresa la da el objeto ajeno, no una frase.
- **Textos aprobados (2026-11-05):** viven en `acto1.json`, sección `ocultos`.

## Mirador (DIS-05)

### La idea

Detrás de una cordillera, en el borde del mundo, hay un cielo que no existe en
ningún otro lugar del acto: un **planeta gigante con anillos de colores**,
enorme sobre el horizonte, y detrás una **galaxia vibrante**, con estrellas y
nebulosas que destellan lentamente. Lo que el jugador debe sentir: **algo
abrumador, hermoso y desconocido, que lo hace sentirse pequeño frente al
universo**. La carta («Te regalo este paisaje…») es de quien encontró ese
lugar antes; su texto ya calza y no cambia.

### Decisiones del autor (2026-11-05)

- **Una montaña grande, parte de una cordillera** que bloquea la vista hacia el
  otro lado. Subirla es la **única** manera de ver lo que hay detrás.
- **Se descubre por pura curiosidad.** La montaña es visible; lo escondido es la
  vista. Nada la señala: sin texto, sin destello, sin sonido que llame.
- **El cielo del mirador existe solo ahí.** No se ve desde ningún otro punto del
  mapa.
- **La cima mira hacia fuera del mundo**, más allá del borde del paseo libre:
  un primer vistazo a lo que hay más allá del miedo. Isi mira, no se va: no
  insinúa el despegue (Acto 6).
- **La revelación es gradual:** el cielo va emergiendo mientras se escala, no
  aparece de golpe al coronar.
- **En la cima, el jugador sigue libre** y mira a su ritmo. Sin cámara guiada,
  sin pausa, sin que Isi se siente. La carta está ahí para quien la encuentre.
- **El planeta anillado del cielo normal** (`sky.ts`) se hace **más pequeño y
  más lejano**, para que no compita con el del mirador. Se queda como un eco
  lejano de lo que espera detrás de la cordillera.

### Ubicación

- Una cordillera en **una sola dirección desde el fuego**, con la cresta entre
  unos **360 y 395 m** y un **pico** más alto que el resto, que es el que se
  puede subir. El resto de la cresta es demasiado empinado o está bloqueado.
- La dirección no coincide con la de la nave, la de la estrella ni la de los
  otros cuatro ocultos. Se fija por semilla con un generador propio, igual que
  los ocultos.
- **Del otro lado hay un precipicio.** La cima queda al borde de ese
  precipicio, justo dentro del límite de 400 m: el borde del mundo coincide con
  el borde físico, y se mira hacia fuera sin poder cruzar.

### La revelación

- El cielo del mirador está colocado **en la dirección de fuera** (del fuego
  hacia el pico) y **bajo, cerca del horizonte**, de modo que la cresta lo tape
  mientras se sube.
- Aparece en función de la altura del jugador sobre la ladera y de su cercanía
  al pico: primero asoma el borde de los anillos sobre la cresta y, en la cima,
  se ve completo. Al bajar, se desvanece en sentido inverso.
- El viento y silencio de AUD-03 crece con la misma curva.

### En la cima

- El jugador queda libre. No aparece texto de Isi (si el autor quiere una
  frase, la escribe él).
- **La carta** descansa sobre una roca al borde del precipicio, **de cara al
  planeta**: al sostenerle la mirada, el jugador ya está mirando el paisaje
  (como la foto del campanil, que mira hacia la estrella). Sigue las reglas de
  los ocultos: se activa con la mirada, se guarda en `lvr-a1-hidden-<seed>` y
  tiene el destello de cercanía a unos 30 m.
- **No salta la frase del borde** ("No me atrevo a mirar más allá
  todavía…") dentro del mirador: ahí sí se atreve a mirar.

### Encuadre ideal (lo que ART-08 debe poder capturar)

De pie en la cima, mirando hacia fuera:

- el planeta llena una buena parte del cuadro, cerca del horizonte, con los
  anillos inclinados y de colores;
- detrás, la banda de la galaxia, las nebulosas y las estrellas destellando;
- abajo y delante, **siluetas por capas** de **agujas de cristal**, que se
  pierden en la bruma (son las referencias del autor del roadmap);
- la carta en primer plano, al borde, sin tapar la vista.

### Decisiones de Claude (revisables)

- **La montaña se construye a mano**, junto con el mundo, como el escondite de
  los ocultos: el terreno sale de la semilla y no garantiza una montaña.
  **No puede cambiar la altura del terreno existente**: `TerrainField` y su
  fixture son invariantes. Lo que sume la montaña tiene que ser nulo dentro de
  unos 340 m del fuego y fuera de su sector, o hay que regenerar el fixture y documentarlo. El suelo
  que pisa el jugador (`groundAt`) debe incluir la montaña.
- **Visibilidad.** La niebla corta la vista a unos 105 m en celular y 160 m
  en computador, así que la montaña no se ve desde el fuego: aparece como una
  silueta al acercarse. Es parte de la curiosidad, no un problema.
- **Determinismo.** El cielo del mirador, la cordillera y la dirección usan su
  propio generador derivado de la semilla; nunca el `rng()` de `chunks.ts`,
  `storyWorld.ts` ni `sky.ts`. Achicar el planeta normal solo cambia tamaño y
  distancia, sin llamadas nuevas a `rng()`.
- **Móvil primero.** El cielo del mirador son pocos meshes y sprites, sin
  sombras. Las siluetas de cristal son capas planas o low-poly.
- **La estrella no se mueve** (decisión del autor, 2026-11-06): está en una
  dirección fija (`STAR_ANGLE` en `sky.ts`), y "no en la dirección de la
  estrella" se mide contra esa dirección, igual que en los ocultos (ENG-13).
- **Dirección del mirador:** ya la fija ENG-13 (`miradorAngle` en
  `hiddenLayout.ts`, la de la carta, que está a 390 m), con un sector de
  ±0,3 rad (`MIRADOR_HALF_WIDTH`). ART-08 construye la cordillera ahí y
  ENG-14 usa el mismo sector.
- **Modo debug:** un salto "ir al mirador" en el panel, para revisar el
  encuadre.

**Al construirlo (ART-08, 2026-11-12), también revisables:**

- **Dónde empieza y termina la montaña.** No toca el terreno a menos de
  **344 m** del fuego ni después de los 420 m, y se desvanece hacia los lados
  entre 0,30 y 0,36 rad de la dirección del mirador (el mismo fundido que usa
  el borde para volver a oscurecerse). Su base se apoya en la altura media del
  terreno al pie, siempre sobre el agua. El fixture de `terrain.test.ts` no
  cambia; `mirador.test.ts` verifica que el mundo de la historia queda igual.
  **Las semillas antiguas cambian** solo en ese sector, más allá de 344 m, donde
  solo llega el paseo libre.
- **Forma.** Una cresta dentada de unos 26 m (con riscos de roca encima) y un
  macizo más alto alrededor del pico, que sube **44 m** sobre su base. El pico
  es una meseta de unos 20 × 25 m, apenas inclinada hacia el borde, que
  termina en un precipicio.
- **El camino de subida** es una sola rampa de unos 100 m que sube en diagonal
  por la ladera que mira al fuego, con una pendiente pareja de ~24°. Empieza a
  un costado del sector (el lado cambia con la semilla) y llega a la meseta
  por detrás. Tiene 11 m de ancho.
- **El resto de la cordillera no se puede caminar.** El motor no tiene límite
  de pendiente, así que el bloqueo es una regla: fuera de la rampa y la
  meseta, Isi no pasa de donde la montaña ya levantó el suelo 2,5 m, y se
  desliza a lo largo de la ladera. No hay texto ni sonido al chocar.
- **Acceso, cima y tope.** El tope del paseo libre (398,5 m) cae sobre la
  meseta, que sigue plana hasta los 404 m; el precipicio empieza ahí. Isi
  rebota en el tope a unos 5 m del borde físico, sin frase ni oscuridad, como
  pide "Borde". **La carta quedó a 394 m** (antes 390), más cerca del borde, y
  ya no se corre a "suelo seco": la montaña siempre está debajo.
- **La revelación** depende solo de la altura ganada sobre la base (nada hasta
  el 20 % de la subida, todo al llegar al borde), así que también se deshace
  sola al bajar. El planeta sube desde debajo del horizonte (de −24° a 21° de
  elevación su centro) mientras se hace opaco; la galaxia aparece al final.
  Con esto, lo primero que asoma sobre la cresta son los anillos y la parte
  alta del planeta.
- **El cielo del mirador.** Un planeta helado (blancos, celestes y lilas, en
  bandas, low-poly) que ocupa unos 56° de cielo, iluminado desde la izquierda,
  con anillos violeta, magenta, celeste y rosa, inclinados. Hacia el horizonte
  se disuelve en la bruma. Detrás, una banda de ~520 estrellas de colores que
  titilan lento (entre 5 y 18 s por ciclo; quietas con *reduced motion*) y una
  docena de nebulosas que respiran, más un resplandor rosado sobre el
  horizonte. No depende de la niebla ni del amanecer.
- **Las agujas de cristal** (90) empiezan al pie del precipicio y se pierden
  en la niebla; algunas alcanzan la altura del horizonte.
- **El planeta del cielo normal** quedó a la mitad de su tamaño y más lejos
  (ocupa un 40 % de lo que ocupaba). No se desvanece en la cima: si queda en
  la misma dirección, el planeta del mirador lo tapa.
- **Sin objetos comunes del planeta** (hongos, cristales, rocas sueltas) sobre
  la montaña, igual que en los biomas de los ocultos.
- **Modo debug:** dos saltos, "Al pie" (donde empieza la rampa) y "A la cima".
- **Viento (AUD-03):** el motor ya calcula la curva (`miradorSky.reveal`, de 0
  a 1); falta que el audio la use.

### Lo que queda para quien lo construya

- La forma exacta de la cordillera, la pendiente y el camino de subida
  (ART-08).
- El tamaño, los colores de los anillos y el ritmo del destello de la galaxia,
  dentro del tono pedido. El autor aprueba con una captura (ART-08).
- La curva exacta de la revelación y la del viento (con AUD-03).

## Borde (DIS-06)

### La idea

Hoy el borde es una pared invisible: Isi frena en seco al llegar al radio del
capítulo (`Game.resolvePlayer`) y aparece una frase de `al_llegar_al_borde`.
El jugador no tiene cómo verlo venir. Ahora, **antes de chocar, el mundo se
apaga**: todo se oscurece, la música se desvanece, el viento crece e Isi avanza cada vez más lento,
como si algo la empujara de vuelta. Lo que el
jugador debe sentir: **soledad**. El borde no es una pared; es el lugar donde
Isi se queda sola.

### Decisiones del autor (2026-11-05)

- **El mundo se apaga:** se oscurece la escena y se apaga la música.
- **Isi camina más lento, como si algo la empujara de vuelta.** El avance
  hacia fuera se hace más pesado a lo largo de la franja; al volver hacia el
  fuego camina normal.
- **El viento se escucha más fuerte** a medida que se acerca.
- **Al final de la oscuridad, se frena igual que hoy**, con el mismo margen y
  la misma frase de `al_llegar_al_borde` (y su espera de 7 s).
  *Cambiado por el autor (2026-11-06):* el tope no se siente como una pared
  rígida sino como un **rebote**: al tocarlo, algo empuja a Isi levemente
  hacia atrás (unos 0,4 m, en menos de medio segundo). Mientras dura el empuje,
  no puede avanzar hacia fuera; si insiste, vuelve a rebotar. La frase sigue
  igual.
- **El paseo libre tiene el mismo borde**, a los 400 m (`FREE_ROAM_RADIUS`).
  Hoy el código no lo frena en el paseo libre (`!progress.freeRoam`); eso
  cambia: el tope duro también vale ahí, y es el que hace coincidir el borde
  del mundo con el precipicio del mirador.
- **En el paseo libre, Isi dice otra frase.** Las de `al_llegar_al_borde`
  hablan de un miedo que el final ya dejó atrás. En el paseo libre dice una
  sola, aprobada por el autor: **«Hasta aquí llega lo que puedo caminar...»**.
  Va en `acto1.json`, en una clave nueva `voz_de_isi.al_llegar_al_borde_libre`
  (lista de un elemento, para que el autor pueda sumar más), validada como las
  demás, con la misma espera de 7 s.
- **Excepción: el mirador.** En el sector del mirador el borde no se oscurece
  ni apaga la música: el precipicio ya es el límite físico, y la vista hacia
  fuera es justo lo que el mirador revela. El tope duro sigue ahí (coincide
  con el precipicio) y, como ya dice "Mirador", no salta la frase del borde.

### Cómo se comporta

- **Una franja antes del tope.** La señal crece de 0 a 1 a lo largo de una
  franja que termina en el tope duro (`radiusCur - EDGE_MARGIN`). Fuera de la
  franja, nada cambia respecto de hoy.
- **Depende solo de la distancia al fuego.** Es continua: al darse vuelta y
  alejarse del borde, el mundo vuelve a la normalidad con la misma curva.
- **Acompaña al radio.** Al completar un capítulo, el radio crece suavemente
  (`radiusCur`) y la franja se corre con él: si Isi estaba en el borde, la
  oscuridad se retira sola. Eso cuenta que ahora se atreve a mirar más lejos.
- **Visual:** la luz de la escena (cielo, niebla, luces) baja hacia un negro
  azulado, más una viñeta suave en los bordes de la pantalla. En el tope, el
  mundo inmediato sigue legible (se ve el suelo y por dónde volver), pero
  apagado.
- **Sonido (AUD-05):** sobre la capa de viento de AUD-03 (el "silencio" del
  juego, el mismo que antes de la nave y en el mirador). En la franja, el
  viento sube y el pad, la cajita musical y la canción (AUD-01, si suena) bajan.
  En el tope, la música está casi apagada y solo queda el viento. El fuego ya
  se apaga con la distancia (`setFireLevel`) y no cambia.

### Decisiones de Claude (revisables)

- **Ancho de la franja proporcional al radio:** el 25 % del radio, con mínimo
  4 m y máximo 25 m. Con metros fijos, el capítulo 1 (14 m) quedaría oscuro
  casi entero. Valores: cap. 1 → 4 m, cap. 2 → 12 m, cap. 3 → 22,5 m,
  caps. 4–5 → 25 m.
- **Paseo libre: franja de 15 m** (de unos 383,5 m al tope). Así no toca a los
  ocultos, que llegan hasta 380 m (DIS-04): su destello no compite con la
  oscuridad. El rango de los ocultos no cambia.
- **Orden de construcción.** La parte visual puede construirse ya. El sonido
  (AUD-05) espera a que exista el viento de AUD-03, para no hacer un viento
  provisional que el autor apruebe dos veces. *Actualizado en ENG-14
  (2026-11-06):* la excepción del mirador ya está activa con el sector de
  ENG-13, aunque la cordillera (ART-08) no exista todavía, porque la carta
  está a 390 m, dentro de la franja del paseo libre. Hasta ART-08, en ese
  sector el tope es una pared invisible sin aviso.
- **Curva suave** (por ejemplo `smoothstep`), para que el principio de la
  franja no se note como una línea.
- **Intensidad en el tope:** la luz baja hasta cerca de un 35 % de la normal y
  la música hasta un 10 %. Ajustable al probar.
- **El empuje:** solo frena la parte del movimiento que va hacia fuera (la
  componente radial); caminar de lado o de vuelta no se frena. Con la misma
  curva que la oscuridad, la velocidad hacia fuera baja hasta cerca de un 30 %
  justo antes del tope. Ajustable al probar. Se aplica en
  `resolvePlayer` (o en el paso de movimiento de `player`), sin tocar la
  mecánica de la mirada. En el mirador no hay empuje, igual que no hay
  oscuridad.
- **El cielo no amanece por esto ni se toca su paleta:** la oscuridad es un
  multiplicador encima de la curva noche → `PRE_DAWN`, no un cambio de `k`.
- **Ningún ítem del capítulo actual puede quedar dentro de la franja.** Si
  alguno cae ahí, se achica la franja de ese capítulo, no se mueve el ítem. La
  nave (cap. 4) y la estrella (cap. 5, en el cielo) se revisan al probar.
  *Resultado en ENG-14:* las distancias de los ítems no dependen de la
  semilla, y dos capítulos caen en este caso: el transmisor (cap. 2, a 44 m
  del fuego, con el tope a 46,5 m) y la pieza del motor (cap. 3, a 84 m, con el
  tope a 88,5 m). La franja se calcula con los ítems **pendientes** y se ajusta
  con suavidad, así que en esos capítulos casi no hay franja hasta recordar
  ese ítem; después se abre hasta su ancho normal. La nave (110 m) no la toca.
- **El sector del mirador** se define con la misma dirección y ancho angular
  que use ENG-13/ART-08 para la cordillera; fuera de ese sector, el borde del
  paseo libre se comporta como cualquier otro.
- **Motor / UI:** el motor calcula un valor de borde (0–1) por frame. Si la
  viñeta es un overlay de React, el motor la publica en el store redondeada
  (por ejemplo a 0,05), solo cuando cambia. Si es parte del render, no pasa por
  el store.
- **Modo debug:** el anillo del suelo ya marca el tope; suma un segundo anillo
  donde empieza la franja.
- **Móvil primero:** sin pases de postproceso caros. Basta con una viñeta
  barata (overlay o quad) y la luz que ya existe.

### Lo que queda para quien lo construya

- El color exacto del negro azulado, la forma de la viñeta y las curvas finas
  de luz y sonido. El autor aprueba jugando hasta el borde de cada capítulo.
- El sonido del viento en sí (AUD-03).

### Hecho cuando

El jugador nota el borde antes de chocar con él, porque todo se apaga y queda
solo el viento, y al frenarse ya no se siente una pared invisible abrupta.

## Revelación de la nave (DIS-08)

### La idea

La nave es el momento **"wow"** del acto: tiene que verse en todo su esplendor
y ser **sobrecogedora**. El esplendor es el de una nave **enorme e imponente,
ya estrellada**: el daño se ve desde el primer instante. La revelación es solo
el **encuentro**; recordar sigue siendo sostenerle la mirada, como con
cualquier otro objeto.

### Decisiones del autor (2026-11-05)

- **El juego toma el control por un momento** para mostrarla, y después lo
  devuelve.
- **La toma no es el recuerdo.** Al terminar, quien juega le sostiene la
  mirada con la mecánica normal y aparece la tarjeta de `ship` de siempre.
- **No se puede saltar.**
- **Tamaño: como un bus** (unos 12 m de largo y 3–4 m de alto, el doble de la
  actual). Lo imponente lo dan la cámara baja y la niebla, no el tamaño bruto.
- **Cámara:** baja casi al suelo detrás de Isi, mirando hacia arriba; mientras
  la niebla se abre, avanza y sube en diagonal recorriendo la nave de un
  extremo al otro, y vuelve a la vista normal de Isi, mirándola de frente.
- **Sonido:** no se usa la melodía de "Astronauta" (el coro queda para el
  cierre, DIS-07). Solo viento al acercarse; en la toma el viento baja, entra
  un **acorde grave y largo** con la tónica de "Astronauta" (sacada de la
  partitura) que crece despacio, y un **crujido metálico** lejano del casco.
  Lo sobrecogedor sale del tamaño del sonido, no de una melodía.

### Secuencia

Los tiempos son de la toma, desde que el juego toma el control.

| # | Momento | Jugador | Cámara | Sonido | Niebla / escena |
|---|---|---|---|---|---|
| 1 | Cap. 3, caminando hacia la nave | camina | libre | normal | más densa cuanto más cerca de la nave; la oculta del todo |
| 2 | A ~60 m de la nave | camina | libre | la música se apaga en 3 s; queda el viento (AUD-03) | igual |
| 3 | A ~30 m: **0–1,5 s** | sin control; Isi se detiene | baja casi al suelo detrás de Isi y mira hacia arriba | el viento baja, como si contuviera el aire | igual |
| 4 | **1,5–4 s** | sin control | empieza a avanzar | entra el acorde grave y crece despacio | la niebla se abre hacia la nave |
| 5 | **3–8 s** | sin control | avanza y sube en diagonal, recorriendo la nave de un extremo al otro | a los ~5 s, crujido metálico del casco | la luz roja parpadea |
| 6 | **8–10 s** | sin control | vuelve a la vista normal de Isi, mirando la nave de frente | el acorde empieza a apagarse | niebla abierta |
| 7 | Después | camina y mira | libre | el acorde se apaga en ~4 s; viento y algún crujido suelto | niebla abierta |
| 8 | Sostiene la mirada en la nave | — | — | `swell` de siempre | tarjeta de `ship` |

### Decisiones de Claude (revisables)

- **Numeración:** capítulos de 0 a 5, como en "Cierre"; la nave es el
  capítulo 3 (`capitulo4` en el JSON, "cap. 4" en "Borde").
- **Distancias:** la música se apaga a 60 m del centro de la nave y la toma se
  dispara a 30 m, en cualquier dirección de llegada. La cámara se arma sobre la
  línea Isi → nave, así que el plano funciona venga de donde venga.
- **Rango de la mirada de `ship`:** sube de 24 a ~32 m, acorde al tamaño
  nuevo, para que se pueda sostener la mirada desde donde la toma deja a Isi
  sin obligarla a caminar. El cono se revisa al probar.
- **Cómo se esconde:** hoy, al pasar al capítulo 3, la niebla se abre a ~150 m
  y la nave (a 110 m del fuego) se vería desde lejos. Mientras la nave no se ha
  revelado, `fog.far` se limita a la distancia hasta la nave menos ~8 m (con un
  mínimo de ~22 m), así que el mundo se cierra a medida que Isi se acerca.
  En la toma, la niebla vuelve a su valor normal en ~2,5 s. Es la misma
  `THREE.Fog` de siempre: no hace falta niebla direccional.
- **Cuándo se dispara:** solo en el capítulo 3, mientras `ship` no está
  recordada, sin tarjeta ni frase en pantalla (si hay una, espera a que se
  cierre) y con el acto sin pausa. Si se recarga antes de recordarla, la toma
  vuelve a pasar; después de recordarla, nunca más. No hay clave nueva de
  `localStorage`.
- **Durante la toma:** no hay movimiento ni mirada del jugador, el joystick se
  oculta, la atención no carga sobre la nave y no corre el aviso de pista de
  45 s. Escape u Opciones pausan la toma, y al volver sigue desde donde quedó.
  El estado (por ejemplo una fase `reveal`) se publica en el store solo cuando
  cambia.
- **Cámara a ras de suelo:** nunca baja de ~0,4 m sobre el terreno en
  cualquier punto del recorrido, ni atraviesa la nave.
- **Reduced motion:** la cámara no se mueve. La toma pasa desde la vista
  normal de Isi, con la niebla abriéndose y el mismo sonido, y dura lo mismo.
- **Se publica por partes**, como el cierre. La toma (cámara, niebla, bloqueo)
  puede salir con la nave actual; mientras no existan el viento (AUD-03) ni el
  acorde, la música se apaga igual y la toma pasa en silencio. El modelo nuevo
  (ART-05) entra cuando esté listo.
- **Debug:** un botón "Repetir revelación" en el panel; "saltar al cap. 3" deja
  a Isi a más de 60 m de la nave para poder vivir la llegada completa.

#### Implementación (ART-05, 2026-11-12), también revisable

- **El modelo es procedural**, no un `.glb`: polyfork no tiene una nave
  estrellada que calce con la paleta crema y naranja de la actual. Vive en
  `game/story/ship.ts`, horneado en una sola malla con colores por vértice
  (unos 2.600 triángulos; el presupuesto `hero` es 8.000) más la luz roja y su
  halo. Mide unos 12,6 m de largo y 3,8 m de casco: partida en dos, con las
  costillas a la vista, un ala arrancada y clavada en el suelo, un propulsor
  suelto, placas repartidas y la tierra que levantó al caer.
- **La nave quedó girada unos 29°** respecto de la línea al campamento
  (`SHIP_SKEW`), como si hubiera derrapado al final del surco. Vista de punta
  desde 30 m se leía como un bulto; de tres cuartos se entiende que es una
  nave. La nariz sigue apuntando hacia el lado del campamento.
- **Recorrido de la cámara:** empieza por el extremo más cercano a Isi (la
  nariz, si viene del campamento), por el costado en que ella está, y termina
  alto pasada la mitad del casco. Entre los 8 y los 10 s vuelve a sus ojos: son
  unos 30 m en 2 s, un retroceso rápido que hay que juzgar jugando.
- **La niebla también la esconde antes del capítulo 3.** Desde el borde del
  capítulo 2 (cerca de la baliza) la nave vieja ya se veía.
- **Después de la toma** Isi queda mirando el punto de la mirada de la nave
  (rango 32 m, altura 2,2 m): si quien juega no se mueve, el anillo se llena
  solo en 1,7 s y aparece la tarjeta. Es la mecánica normal, pero no exige
  ningún gesto.
- **Reduced motion:** la cámara no se desplaza; solo gira en ~1,3 s hasta
  mirar la nave, igual que en el cierre.
- **Debug:** "Repetir revelación" deja a Isi a 29,5 m de la nave, de espaldas
  a medias, y dispara la toma de inmediato. "Ítem → Mi nave" la deja a 20 m con
  la revelación ya vista, para probar solo la mirada.
- **Sonido:** no se tocó `audio.ts`. La toma avisa cada momento una vez
  (`approach`, `retreat`, `start`, `chord`, `creak`, `release`, `end`) en
  `Game.onRevealCue`, y `Reveal.phase` (`idle`, `hush`, `reveal`, `done`) sirve
  para una mezcla que se fija en cada frame. Mientras nadie los use, la toma
  pasa en silencio y la música **no** se apaga a los 60 m.

**Problemas vistos al implementar, para que decida el autor:**

- **La baliza está a ~27 m de la nave.** Quien la recuerda queda casi siempre
  a menos de 35 m, así que la toma se dispara apenas se cierran las tarjetas
  del capítulo 2, o a los pocos pasos. El tramo "a 60 m se apaga la música y
  queda el viento" casi no se vive en una partida normal. Salidas posibles:
  mover la baliza más cerca del campamento, o bajar el radio de disparo.
- **A 30 m la nave se ve chica** en la vista final de Isi (un bus a 30 m ocupa
  poco de la pantalla). La toma la muestra de cerca, pero al volver hay que
  caminar para sentirla grande otra vez. Se puede terminar la toma más cerca
  (por ejemplo dejando a Isi a 18–20 m) si el autor lo prefiere.

### Lo que queda para quien lo construya

- Las curvas finas de la cámara y de la niebla; el autor las aprueba jugando.
- El modelo de la nave (ART-05: tamaño de bus, rota, presupuesto `hero`), el
  viento (AUD-03), el acorde y el crujido.
- El extremo por el que empieza el recorrido de la cámara, según cómo quede el
  modelo (la nariz apunta al campamento).

### Hecho cuando

El autor llega a la nave caminando desde el capítulo 2, vive la toma completa y
la aprueba como sobrecogedora; y queda implementada junto con ART-05 y AUD-03.

## Cierre (DIS-07)

### La idea

El acto termina en **calma**: Isi vuelve al fuego, se sienta y se toma un
momento para interiorizar todo lo que acaba de recordar. No hay euforia ni
amanecer (el cielo sigue topado en `PRE_DAWN`); no se muestra la reparación ni
el despegue. Sentarse es el gesto de detenerse a reordenar las ideas antes de
mirar hacia arriba con convicción.

### Decisiones del autor (2026-11-05)

- **Capítulo nuevo: la fogata, entre la nave y la estrella.** Después de la
  nave, Isi tiene que volver caminando al campamento. El acto pasa a **11
  recuerdos en 6 capítulos**: 0 despertar · 1 antes de partir · 2 el miedo ·
  3 la nave · **4 la fogata** · 5 el destino.
- **Frase nueva al terminar el capítulo de la nave**, a continuación de
  "…Eso fue suficiente para hacerme caer...": **«Tengo mucho en mi cabeza.
  Necesito sentarme a reordenar mis ideas...»** (texto del autor, tal cual).
- **El recuerdo de la fogata:** al mirarla esta segunda vez, Isi **recupera
  convicción para poder mirar al cielo**. El texto de la tarjeta lo escribe el
  autor.
- **Isi se sienta al recuperar el recuerdo de la fogata.** Mira la estrella ya
  sentada.
- **Orden después de la estrella:** tarjeta de `star` → "La parte más fácil…"
  → "La más difícil…" → "…lo que escuché una vez en una canción..." → la cita
  **«Nadie puede ser astronauta con los pies en la Tierra»**, entera → recién
  entonces entra **el coro de "Astronauta" (B1) desde el principio, una sola
  vez**. Texto y música no se sincronizan.
- **Durante el coro, la cámara va sola: da una vuelta de 360° en 15 s**
  (revisado 2026-11-05). Después de la cita el jugador ya está mirando la
  estrella, así que no vuelve al fuego: gira mirando el cielo, baja un poco a
  mitad de la vuelta para que se vea algo del horizonte, y termina otra vez en
  la estrella. Empieza 0,5 s después de la cita y la pantalla final aparece
  0,5 s después de que termina.
- **La pantalla final aparece cuando la cámara guiada termina su recorrido**
  y vuelve a la estrella (revisado 2026-11-05). La cámara se queda mirando la
  estrella y **el coro sigue sonando detrás** de la pantalla final hasta
  terminar.
- **Pantalla final:** el título cambia de "Completaste el Acto I" a **«Te
  sientas junto al fuego»**. El cuerpo actual ("Lo siguiente es arreglar la
  nave…") se mantiene. **Debajo va la invitación a escuchar** en
  `https://ffm.to/tiann-astronauta`.
- **"Seguir explorando":** Isi se pone de pie y empieza el paseo libre.
- **D6 resuelta:** suena **solo el coro, una vez, solo en este momento**. No se
  repite en el paseo libre.
- **Se publica por partes.** Cada pieza sale a producción cuando está lista,
  aunque falten el coro (AUD-01) o los textos del autor: mientras tanto, la
  pausa del coro va en silencio y los textos faltantes van como provisionales.
  No hace falta esconderlo detrás del modo debug.

### Secuencia

| # | Momento | Jugador | Cámara | Sonido | UI |
|---|---|---|---|---|---|
| 1 | Termina el cap. 3 (nave) | camina | libre | `swell` como hoy | frases de `al_terminar`, incluida la nueva |
| 2 | Cap. 4: vuelve al campamento | camina | libre | ambiente normal | pista del cap. 4 |
| 3 | Sostiene la mirada en la fogata | — | — | campanilla de recuerdo | tarjeta de la fogata |
| 4 | Isi se sienta | **no puede caminar desde aquí** | baja al sentarse; luego mirar libre | — | — |
| 5 | Cap. 5: busca la estrella, sentada | solo mirar | libre | ambiente normal | pista del cap. 5 |
| 6 | Sostiene la mirada en la estrella | solo mirar | libre | campanilla | tarjeta de `star` y las 4 frases |
| 7 | Termina la cita | sin control | va sola: una vuelta de 360° en 15 s por el cielo, bajando un poco hacia el horizonte a mitad | entra el coro B1, una vez; el ambiente baja (AUD-01) | sin texto |
| 8 | La vuelta termina en la estrella | sin control | fija en la estrella | el coro sigue hasta terminar; luego vuelve el ambiente | pantalla final + invitación |
| 9 | "Seguir explorando" | camina | se pone de pie | ambiente normal | paseo libre |

### Decisiones de Claude (revisables)

- **Id nuevo para la fogata:** `campfire` (no se reutiliza `fire`: ya está
  recordado desde el capítulo 0 y el capítulo nuevo se daría por hecho).
  Mira el mismo objeto de la escena (el grupo de `Campfire`); no agrega
  llamadas a `rng()` ni cambia posiciones. Su `attention` copia la de `fire`.
- **Radio del capítulo de la fogata: 150**, igual que la nave y la estrella
  (`CHAPTER_RADII` pasa a `[14, 48, 90, 150, 150, 150]`). Volver al centro no
  necesita más mundo.
- **Textos que cambian de lugar en `acto1.json`:** lo que hoy es `capitulo5`
  (estrella) pasa a `capitulo6`; `capitulo5` es la fogata, con su `pista` y
  `al_terminar` que escribe el autor (si `al_terminar` queda vacío, el loader
  debe aceptarlo). La memoria nueva va bajo `memorias.campfire`.
  `interfaz.final.titulo` pasa a «Te sientas junto al fuego».
- **Sentarse (ART-09):** la cámara baja de 1,6 m a unos 0,9 m en ~1,5 s,
  junto al fuego, mirando hacia él. Sentada, el jugador mueve la mirada
  igual que de pie (ratón/arrastre), sin caminar. Con *reduced motion*: un
  fundido corto en vez del movimiento, igual al levantarse.
- **Cámara del coro:** desde la estrella, una vuelta completa de 360° en
  **15 s** (decisión del autor), acelerando y frenando suave, y termina en la
  estrella. A mitad de la vuelta la mirada baja hasta ~0,45 rad sobre la
  horizontal (`PAN_PITCH`), suficiente para ver el horizonte y los cerros
  abajo del cuadro, y vuelve a subir. Independiente del largo del coro.
  Con *reduced motion*, la cámara no se mueve (queda mirando la estrella), pero
  la pantalla final espera lo mismo.
- **Tiempos (decisión del autor):** el coro y la cámara arrancan juntos
  0,5 s después de que se cierra la tarjeta de la cita; la pantalla final
  aparece 0,5 s después de que la vuelta termina en la estrella.
- **Si el jugador aprieta "Seguir explorando" antes de que acabe el coro**, el
  coro sigue hasta su final (no se corta) y no se repite.
- **Mientras no exista AUD-01** (falta la partitura), el coro no suena: la
  cámara y la pantalla final funcionan igual, en silencio. La secuencia no
  depende de la duración del coro.
- **La invitación**: una línea de texto y un enlace/botón que abre
  `https://ffm.to/tiann-astronauta` en una pestaña nueva, debajo de los
  botones actuales. El texto lo escribe el autor (hasta entonces, provisional
  marcado como tal). El diseño visual llega con UI-03.
- **Dónde se sienta:** en un punto fijo junto al fuego (unos 2 m), libre de
  los colliders del casco y el set de mate, mirando hacia el fuego. Al
  sentarse, la cámara se desliza hasta ahí desde donde estaba. El mismo punto
  sirve para reanudar sentada y para que el plano del coro sea siempre igual.
  No se alinea con la estrella ni depende de ART-06.
- **Cuándo se da por terminado el acto:** `star` y la marca de acto completado
  (`onComplete`, `lvr-acts-done`) se guardan **cuando aparece la pantalla
  final**, no al recordar la estrella. Si alguien recarga a mitad de las
  frases o del coro, vuelve sentado al capítulo 5 y mira la estrella otra vez;
  nadie se pierde el coro ni la invitación. Así "tiene `star`" sigue
  significando "vio el final".
- **`Narrative` y `gameStore`:** la nota "no tocar" de "Notas de
  implementación" se refiere a su mecánica (la cola de tarjetas, el patrón del
  store). Sumar campos al store (por ejemplo `seated` o una fase del cierre,
  para ocultar el joystick y bloquear el movimiento) está bien y es lo
  esperado.
- **Guardado y reanudación:**
  - Si un jugador recarga con la fogata ya recordada y la estrella no,
    reaparece **sentado junto al fuego**, en el capítulo 5.
  - Las partidas guardadas que ya tienen `star` (terminaron el acto con 10
    recuerdos) se tratan como terminadas: se agrega `campfire` al cargar, para
    que no vuelvan a un capítulo 4 y salten el cierre. No cambia ninguna clave
    de `localStorage`.
  - Al volver de la pantalla final (paseo libre ya activo), Isi aparece de pie.
- **Numeración:** en esta sección los capítulos van de 0 a 5, como en la tabla
  de objetos; las claves del JSON son 1 más (`capitulo5` = fogata,
  `capitulo6` = estrella). La sección "Borde" numera desde 1.
- **Borde (DIS-06):** la franja se calcula igual; nave, fogata y estrella
  (caps. 4–6 en la numeración de "Borde") usan 25 m. Sentada no hay
  movimiento, así que el borde no interviene.
- **Debug:** el panel de saltos suma el capítulo nuevo; "saltar al cap. 5" deja
  a Isi sentada junto al fuego.
- **Cuando la estrella ya fue mirada**, la mirada en el cielo no vuelve a
  disparar nada; el paseo libre no tiene coro.

### Lo que queda para quien lo construya

- Curvas finas de la cámara (sentarse, coro, levantarse); el autor las aprueba
  jugando.
- La voz del coro en sí (AUD-01) y el rediseño de la pantalla final (UI-03).
- Si el modelo del fuego necesita algo para que la segunda mirada se lea
  distinta a la primera (no es obligatorio).

### Textos pendientes del autor

- Tarjeta de la fogata (`memorias.campfire`: título y texto).
- `capitulo5` (fogata): `pista` y, si quiere, `al_terminar`.
- La pista del capítulo de la estrella puede necesitar ajuste ahora que Isi la
  busca sentada.
- La línea de la invitación a ffm.to.

### Hecho cuando

El autor juega el final completo, de la nave a "Seguir explorando", y lo
aprueba; y queda implementado mediante ART-09, AUD-01 y UI-03.

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
