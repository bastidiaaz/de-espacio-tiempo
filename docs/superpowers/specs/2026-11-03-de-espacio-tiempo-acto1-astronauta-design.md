# Brief narrativo — "De Espacio-Tiempo", Acto I ("Astronauta")

## Contexto

Lumen Vale — Remember funciona como MVP: la atmósfera y la jugabilidad ya son las
que el usuario busca. Lo que no funciona es la historia (premisa de amnesia,
final demasiado cálido/explícito/conclusivo, núcleo emocional equivocado).

El proyecto se redefine como la adaptación jugable de un álbum en curso,
**"despacio-tiempo"**. Cada acto del juego corresponde a una canción del álbum,
en el mismo orden del tracklist. Este documento es el brief del **Acto I**,
anclado a la canción **"Astronauta"** (#1), para que otra sesión de Claude Code
lo use como base y reescriba el contenido narrativo (no el motor).

El juego pasa a llamarse **"De Espacio-Tiempo"** (juego de palabras: "despacio" +
"espacio-tiempo" — nombre del álbum completo, no solo de este acto).

Este documento **no propone cambios de motor/mecánica**. Todo lo descrito aquí
se implementa como cambio de contenido en `src/content/story.ts`,
`src/content/copy.ts` y los textos/materiales de `src/game/story/storyWorld.ts`
(geometría/objetos pueden mantenerse o ajustarse levemente, pero la estructura
de capítulos por radio creciente, la mecánica de sostener la mirada, y el
sistema de `Narrative`/`gameStore` se conservan tal cual). Ver sección final
de notas de implementación.

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

**Frase memorable (debe aparecer citada o parafraseada en el cierre del acto):**
"Nadie puede ser astronauta con los pies en la Tierra."

**Idea central de la canción:** alguien que vive mirando el espacio desde
tierra firme, consciente de su anhelo, paralizado por la incertidumbre. La
canción crece desde la quietud hasta un clímax emocional: el momento en que el
miedo ya no puede más contra el deseo, y el despegue se vuelve inevitable.

**Canción #2, "Despacio" (siguiente acto, solo como referencia de hacia dónde
se dirige el hilo emocional — NO resolver nada de esto en el Acto I):** trata
de la contemplación de la vida, de darse cuenta de que todos batallan sus
propias luchas contra un mundo que no para, y de la necesidad de refugio y
resistencia en símbolos, lugares y personas que devuelven la capacidad de
frenar. Saberse rebelde lo es todo. Congelar el tiempo en una imagen de
ternura lo es todo.

## Decisiones de diseño (todas acordadas con el usuario)

1. **Idioma del juego: español**, de ahora en adelante (hoy todo el texto
   in-game está en inglés; el proyecto y el álbum son en español, y la frase
   central solo funciona citada textualmente). Esto implica reescribir
   `COPY` (`src/content/copy.ts`) y todas las tarjetas de `story.ts` desde
   cero en español, no traducir 1:1 el texto actual.

2. **Escenario:** se mantiene el valle alienígena actual, con su terreno,
   cielo, nave y sistema de chunks — cero retrabajo técnico. Pero deja de ser
   "nave que se estrelló, hay que ser rescatada": **ella aterrizó ahí por
   decisión propia** (ya había decidido partir una vez). El acto es sobre
   descubrir qué le costó seguir volando, no sobre ser encontrada.

3. **Protagonista:** se llama **Isi**. Sin apellido, sin familia ni pareja
   nombrada (ver punto 5).

4. **Dispositivo narrativo — reemplaza la amnesia:** Isi recuerda
   perfectamente quién es y qué pasó. Lo que no puede es **mirar de frente**
   lo que pasó. El gesto de sostener la mirada (mecánica ya existente) pasa de
   "intentar recordar" a "atreverse a admitir una verdad que ya conoce". El
   radio que crece ya no es "no recuerdo qué hay más allá" sino **"no me
   atrevo a mirar más allá todavía"** — el miedo encoge su mundo, no la
   memoria.

5. **Vínculo humano:** sin destinatario fijo. No hay hija, pareja ni persona
   nombrada esperándola. Los "mensajes a la Luna" de la letra se convierten
   en transmisiones que ella envía sin saber si alguien las recibe — soledad
   cósmica sin resolver, abierta para que algún acto futuro (no este) le dé
   nombre a quién/qué podría ser el refugio.

6. **La causa de por qué se quedó — el corazón del misterio:** no hay avería
   externa dramática ni villano. En el descenso hubo un instante en que pudo
   corregir el rumbo, pero **dudó medio segundo de más**; esa duda —no una
   falla mecánica externa— es lo que dañó el motor y forzó el aterrizaje
   duro. Es la frase central hecha literal: intentó mantener "un pie en la
   Tierra" en el instante exacto en que ya estaba en el aire, y eso la hizo
   caer. El misterio del acto es reconstruir ese instante, pieza por pieza.

7. **Cierre del Acto I (grande pero inconcluso):** el último recuerdo
   (actual id `star`, gatillado mirando el cielo) le entrega la memoria
   completa y cruda del instante de la duda — sin villano, sin excusas. El
   acto NO termina con ella decidiendo volar de nuevo ni con ningún
   rescate/llegada. Termina con ella **quieta junto al fuego**, en eco directo
   de la mecánica de quietud que ya existe (`STILLNESS_LINE`, "Be still for a
   moment"): el gesto final es pausa, no acción. Debe doler todavía — no
   puede sentirse como sanación o resolución, porque un acto futuro ("el
   regreso", donde por fin sube a la nave) depende de que esta pregunta siga
   abierta. La frase central se cita o parafrasea aquí.

8. **Encaje con el arco completo del álbum (validado con el usuario):** el
   Acto I planta la herida (por qué cayó) sin tocar la pregunta de "¿volverá a
   volar?". Esa pregunta queda en suspenso durante los actos intermedios
   (incluido "Despacio", que trata de hallar refugio/pausa, no de volar) y el
   Acto 6 ("el regreso") la cobra entera cuando Isi por fin sube a la nave.
   Acto I = la caída (literal y emocional). Acto 6 = el ascenso. Todo lo del
   medio es el "despacio" entre ambos.

## Mapeo de objetos/recuerdos (10 ítems, 5 capítulos, radio creciente — se
mantiene la estructura actual de `MEMORIES`/`CHAPTERS`)

Se conservan los `id` técnicos actuales donde es razonable (son solo claves
internas / claves de `localStorage` tipo `lvr-mem-<seed>`, no hace falta
tocarlas), reescribiendo título, texto y, si corresponde, qué objeto físico
representan. Los textos abajo son **borradores de dirección**, no copy final
— la sesión que implemente puede pulirlos, pero deben mantener las imágenes y
el eje emocional indicados.

### Capítulo 0 — quietud inicial (radio chico, junto al fuego)
- **`fire`** — el fuego que ella misma construyó. Puede mantenerse casi igual
  al original (ya no depende de la amnesia): construirlo fue un gesto de
  manos que saben hacer algo aunque la cabeza esté en otra parte.
  *Dirección: "Tres piedras, ramas secas, una chispa. Esto sí lo hice yo.
  Por una vez, no dudé."*
- **`helmet`** — ya no "algo me golpeó": es equipaje que cargó mucho tiempo
  antes de decidirse a partir. *Dirección: "El rayón ya estaba aquí antes de
  caer. Llevo este casco guardado en una caja desde hace años, listo para un
  viaje que seguía posponiendo."*
- **`thermos`** — abandona el "alguien me lo prepara"; motivo de calor/
  soledad de la letra ("Cálido es el sol que te acompaña en tu fría
  soledad"). *Dirección: "Cardamomo, para las noches frías. Me lo preparo yo
  misma, cada vez, como si alguien más fuera a tomarlo conmigo."*

### Capítulo 1 — el antes: años de preparación, aislamiento, dudas
- **`patch`** — insignia autoasignada, no de una institución.
  *Dirección: "SURVEY ONE. La cosí yo misma, para una misión que me inventé,
  para tener una excusa con la que finalmente partir."*
- **`photo`** — ya no es la hija: una foto de sí misma, antes del miedo.
  *Dirección: "Yo, mucho más joven. Antes de empezar a temerle al cielo que
  ahora dice que no puedo cruzar."*
- **`seeds`** (repensar como objeto: tarro/dispositivo de transmisiones) —
  los "mensajes a la Luna" que no llegan. *Dirección: "Grabé cien mensajes
  dirigidos a quien fuera que escuchara. Ninguno recibió respuesta. Seguí
  grabando igual."*

### Capítulo 2 — fragmentos del descenso (empieza a oírse/verse la duda)
- **`recorder`** — grabadora de vuelo; primer indicio audible de la
  vacilación, aún sin que se entienda del todo. *Dirección: "Mi propia voz:
  'Perdiendo altitud, puedo corregir, puedo—' Silencio. No completé la
  frase. No completé la maniobra."*
- **`beacon`** (repensar como resto del motor/sistema dañado) — el daño
  físico, literal, de la duda. *Dirección: "El polvo se acumuló justo aquí,
  donde debía encender a tiempo. Dudé medio segundo. Fue suficiente."*

### Capítulo 3 — la nave, de cerca: entiende el mecanismo exacto
- **`ship`** — ya no revela una identidad oculta para ser rescatada: revela
  el lugar exacto donde pasó. *Dirección: "Mi nave. Bajo el cristal de la
  cabina: ISI. Aquí fue. Un pie todavía en la Tierra, cuando ya estaba en el
  aire."*

### Capítulo 4 — el cierre (grande, inconcluso)
- **`star`** (gatillo: mirar al cielo, igual que hoy) — la memoria completa
  y cruda del instante de duda, sin atenuantes. *Dirección: "No hay más que
  decir. Dudé. Eso fue todo. Eso fue suficiente para caer."*
- Beat final (no es un `MemoryDef`, es el `done` del capítulo 4, como ya
  existe hoy en `CHAPTERS`): ella vuelve a quedarse quieta junto al fuego.
  *Dirección: "Nadie puede ser astronauta con los pies en la Tierra. Lo sé
  ahora. No sé todavía qué hacer con eso. Por ahora, me quedo quieta."*

## Textos de capítulo (`CHAPTERS[].hint` / `.done`) — dirección, no final

Deben seguir funcionando como pistas tras 45s de inactividad (`hint`) y como
remate al completar el capítulo (`done`), pero alineados al nuevo eje
(miedo/duda en vez de amnesia/rescate). Ejemplos de dirección:
- Cap. 0 `hint`: algo cerca del fuego, un gesto que ella sigue evitando mirar.
- Cap. 1 `hint`: el rastro de los años antes de partir.
- Cap. 2 `hint`: lo que pasó en el descenso empieza a tener sonido.
- Cap. 3 `hint`: la nave tiene la respuesta final.
- Cap. 4 `hint`: mirar al cielo, aunque duela.

## Otros textos a reescribir (dirección)

- `WAKE_LINES` → ya no "cabeza llena de estática" (amnesia): algo como
  "Otra vez aquí. El fuego, la misma pregunta de siempre." / "Si me quedo
  quieta, tal vez por fin pueda mirar."
- `EDGE_LINES` → de "no recuerdo qué hay ahí" a "no me atrevo todavía":
  "Todavía no. Eso no." / "El miedo pesa más que la curiosidad, por ahora."
- `STILLNESS_LINE` → se mantiene el concepto (pedir quietud), traducido:
  "Quédate quieta un momento."
- `COPY` (`src/content/copy.ts`): título → "De Espacio-Tiempo". `intro.*`,
  `hud.*`, `card.*`, `journal.*`, `ending.*` deben reescribirse en español y
  sin las referencias a "remember" como recuperación de memoria perdida —
  usar lenguaje de "mirar de frente" / "atreverse" en vez de "recordar".
  `ending.body` en particular debe reflejar el cierre acordado (quietud,
  frase central), no un desenlace de rescate/aterrizaje de otros.

## Notas de implementación (para quien ejecute esto)

- Archivos de contenido a tocar: `src/content/story.ts`, `src/content/copy.ts`.
  Posiblemente nombres/geometría puntual en `src/game/story/storyWorld.ts` si
  algún objeto cambia de forma (p. ej. `seeds`→dispositivo de transmisión,
  `beacon`→resto de motor), pero no es obligatorio: los objetos existentes
  pueden reinterpretarse sin cambiar su geometría.
- **No tocar** el orden de capítulos por radio, la mecánica de sostener la
  mirada, `Narrative`, `gameStore`, ni el orden de llamadas a `rng()` en
  `chunks.ts`/`storyWorld.ts`/`sky.ts` (invariante de determinismo del mundo,
  documentada en `CLAUDE.md`).
- Cambiar las claves de `localStorage` (`lvr-seed`, `lvr-mem-<seed>`, etc.)
  **no** es necesario y borraría progreso existente; no se toca a menos que
  se decida explícitamente.
- Dado que el nombre del juego cambia ("De Espacio-Tiempo"), revisar también
  `COPY.canvasLabel` y cualquier referencia a "Lumen Vale" fuera de
  `reference/lumen-vale-remember.html` (ese archivo es solo referencia
  original, no se edita, según `CLAUDE.md`).
- Quien implemente debe tratar los textos de dirección de este documento como
  punto de partida, no como copy final — hay licencia para pulir el español
  siempre que mantenga las imágenes y el eje emocional descritos.

## Verificación

Este documento es narrativo, no código. La sesión que lo implemente debe
seguir corriendo `npm run lint && npm run typecheck && npm test && npm run build`
antes de dar por terminado, como indica `CLAUDE.md`. No se espera que este
cambio rompa `terrain.test.ts` (no se toca el orden de `rng()`), pero sí
puede requerir ajustar `narrative.test.ts`/`progress.test.ts` si referencian
texto literal de `story.ts`.
