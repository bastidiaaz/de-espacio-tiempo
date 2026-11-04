---
name: De Espacio-Tiempo
description: Valle alienígena low-poly, de noche, iluminado por una hoguera. Adaptación jugable de despacio-tiempo.
colors:
  noche-horizonte: "#3d3a78"
  noche-medio: "#2b2c66"
  noche-cenit: "#0f1233"
  noche-resplandor: "#7a6bd0"
  luz-cielo: "#8d9cff"
  luz-suelo: "#2a2350"
  luz-luna: "#9fb0ff"
  alba-horizonte: "#f2b3a6"
  alba-medio: "#d98fb0"
  alba-cenit: "#5b5aa6"
  alba-resplandor: "#ffd9a0"
  agua-honda: "#4f7f95"
  agua-superficie: "#7ad7d6"
  arena-rosada: "#f0c4a4"
  roca-lila: "#8b78ad"
  roca-lila-clara: "#a68ab5"
  escarcha: "#f6ecf6"
  ladera-lavanda: "#a993d8"
  ladera-lavanda-clara: "#c4a6e0"
  pasto-turquesa: "#4cae9c"
  pasto-menta: "#9bd49a"
  floracion-rosa: "#f0a6c6"
  surco-quemado: "#4a3d62"
  cristal-cian: "#8ef0ff"
  cristal-rosa: "#ff9ed8"
  cristal-violeta: "#b79cff"
  bulbo-cian: "#8ff5ff"
  bulbo-rosa: "#ffd0f0"
  bulbo-limon: "#fff3a8"
  hongo-rosa: "#f29bb5"
  hongo-coral: "#ff9e7a"
  hongo-lila: "#c9a0ff"
  hongo-miel: "#ffd27a"
  hongo-aguamarina: "#7fe0d0"
  llama-nucleo: "#ffe08a"
  llama-media: "#ffb347"
  llama-borde: "#ff7a3d"
  luz-hoguera: "#ff9a4d"
  brasa: "#ffa050"
  espora: "#e6ffb0"
  destello-mirada: "#cfe8ff"
  estrella: "#fff6e8"
  estrella-lenta: "#fff1c0"
  gigante-banda-durazno: "#ffd2b0"
  gigante-banda-coral: "#f29a9a"
  gigante-banda-orquidea: "#c58bd1"
  gigante-banda-crema: "#ffe6c9"
  gigante-anillo: "#ffdcc4"
  luna: "#d9f2ff"
  traje-crema: "#fff0dc"
  traje-naranja: "#f3a25e"
  visor: "#35577a"
---

# Design System: De Espacio-Tiempo

> **Alcance.** Este documento cubre solo el **mundo 3D**: el valle, el cielo, la luz, la atmósfera, los objetos y el render. La **UI de React** (intro, HUD, tarjetas, diario, final, susurros, retícula) queda fuera a propósito: se va a rediseñar en estilo sketch con *boiling line*, tomando como referencia la portada de "Astronauta" (roadmap ART-01, UI-02, UI-03). Cuando exista esa UI, se documenta aquí con `/impeccable document`. Mientras tanto, `src/styles/tokens.css` no es una referencia de diseño que haya que extender.

## Overview

**Creative North Star: "El fuego en el valle"**

Un valle alienígena de noche, hecho de facetas planas en tonos pastel, con una sola fuente de calor: la hoguera que encendió Isi. Todo lo demás es frío y suave: índigo en el cielo, lavanda en las laderas, turquesa en el pasto y cian en los cristales. El fuego es lo único naranja que arde. La luz cálida que llega desde la hoguera es el ancla emocional de cada encuadre; el resto del mundo se percibe a la distancia, filtrado por niebla.

La densidad es baja y contemplativa: mucho cielo, siluetas que se apilan en capas por la niebla y pocos objetos, cada uno con su color. La magia no viene de efectos espectaculares. Viene de lo pequeño que se mueve: las esporas verde limón que flotan alrededor de Isi, las brasas que suben, el destello frío cuando algo se mira de frente. El render pixelado a 460 px de alto es el look principal, no un filtro opcional: une las facetas y les da textura de recuerdo.

El mundo está siempre a punto de amanecer y nunca amanece. La paleta del alba existe en el código, pero se mezcla como máximo al 12 %: el amanecer está reservado para el Acto 6.

**Key Characteristics:**
- Low-poly con *flat shading* en todo: terreno, objetos, planeta y luna.
- Noche índigo y lavanda, con la hoguera naranja como único foco cálido.
- Niebla del mismo color que el horizonte, que marca hasta dónde se atreve a llegar Isi.
- Brillos aditivos (esporas, brasas, destellos, estrellas) en vez de sombras.
- Pixelado retro a 460 px de alto, activo por defecto.
- Cielo que domina el encuadre: un gigante anillado, una luna y 700 estrellas.

## Colors

Pasteles fríos de noche sobre facetas planas, con un único núcleo de fuego naranja y acentos de neón suave en lo vivo (cristales, bulbos, hongos, esporas).

### Primary
- **Llama de hoguera** (`llama-nucleo` → `llama-media` → `llama-borde`, más `luz-hoguera` y `brasa`): el calor del juego. Solo pertenecen a la fogata, su halo, su luz puntual y las brasas que suben. Es el único lugar del mundo donde el naranja emite luz.

### Secondary
- **Destello de mirada** (`destello-mirada`): cian helado. Marca lo que Isi se atreve a mirar: el brillo de un objeto recordable y el estallido de luz al sostener la mirada. Comparte color con el arco de la retícula para que mundo y gesto se lean como lo mismo.
- **Espora** (`espora`): verde limón traslúcido. Son las partículas que flotan alrededor de Isi, el toque mágico del valle. Usan mezcla aditiva al 80 % de opacidad.

### Tertiary
- **Neones de lo vivo** (familias `cristal-*`, `bulbo-*`, `hongo-*`): cian, rosa, violeta, coral, miel y aguamarina saturados, en piezas pequeñas e instanciadas. Los cristales tienen un leve emisivo violeta (`#2b1f5c`) para leerse en la oscuridad.
- **Gigante anillado** (familia `gigante-*`) y **luna**: bandas de durazno, coral y orquídea, con un anillo crema al 45 % y una luna celeste. Dominan el cielo y son la composición de fondo del mirador.

### Neutral
- **Noche** (`noche-cenit` → `noche-medio` → `noche-horizonte`): degradado del cielo. `noche-horizonte` es también el color de la niebla, así el suelo lejano se disuelve en el cielo sin costura.
- **Luz ambiente**: hemisférica entre `luz-cielo` y `luz-suelo` (intensidad 1,1), más una luz direccional de luna, `luz-luna` (0,35). Es fría y débil, para que el fuego gane.
- **Terreno por altura**: `agua-honda` y `agua-superficie` (78 % de opacidad) abajo, luego `arena-rosada`, `pasto-turquesa` y `pasto-menta` (con manchas de `floracion-rosa`), después `ladera-lavanda` y `ladera-lavanda-clara`, y `escarcha` en las cumbres. Las pendientes empinadas pasan a `roca-lila`. Cada triángulo varía ±3 % de luminosidad.
- **Surco quemado** (`surco-quemado`): el rastro del aterrizaje forzoso, que oscurece el terreno hasta un 75 %.
- **Pertenencias de Isi** (`traje-crema`, `traje-naranja`, `visor`): el naranja del traje es el único naranja que no emite luz. Debe leerse como "de Isi", no como fuego.

### Named Rules
**The One Fire Rule.** Solo la hoguera emite luz cálida. Ningún objeto, cristal ni efecto nuevo puede ser una segunda fuente naranja o ámbar; si algo necesita brillar, brilla frío (cian, lila o limón).

**The Never-Dawn Rule.** La paleta del alba (`alba-*`) se mezcla como máximo un 12 % (`PRE_DAWN` en `Game.ts`) hasta el Acto 6. Un cielo rosado se lee como sanación, y el álbum lo guarda para "el regreso".

**The Fog-Is-Horizon Rule.** La niebla siempre usa el color del horizonte del cielo en ese momento. Nunca se le asigna un gris neutro ni un color propio.

## Layout

El encuadre es primera persona pura: la cámara está a la altura de los ojos de Isi y ella no se ve nunca. El mundo se organiza en anillos alrededor de la hoguera.

- **Radio que crece:** cada capítulo amplía el área caminable y aleja la niebla. El inicio de la niebla es el 35 % del radio actual (máximo 28 m) y el final es el radio + 14 m, sin superar el alcance de los chunks cargados. El borde del mundo es la niebla, no una pared.
- **Chunks de 56 m** con 16 × 16 segmentos (3,5 m por faceta). Alrededor de Isi se cargan 2 chunks por lado en pantallas táctiles y 3 en escritorio.
- **Cielo como mitad del cuadro:** las estrellas solo nacen por encima de +0,12 de elevación. El gigante anillado está a 440 m en dirección noroeste y alto (−0,55, 0,42, −0,72); la luna, en el lado opuesto (0,62, 0,5, −0,35). Ambos se ven desde la fogata.
- **Paseo libre:** al terminar el acto, el radio salta a 400 m.

**The Campfire-Is-Origin Rule.** Todo lo que importa se coloca en relación con la hoguera: los capítulos se abren en anillos desde ella, y lo que hay que ver desde ahí (la estrella lenta, el gigante) tiene que verse sin moverse de su lado.

## Elevation & Depth

No hay sombras en tiempo real: es una restricción del presupuesto móvil y también una decisión estética. La profundidad se construye con tres recursos:

1. **Niebla atmosférica.** Disuelve lo lejano en el color del horizonte y apila las colinas en siluetas de tonos cada vez más cercanos al cielo.
2. **Facetas planas.** El *flat shading* con luz hemisférica da a cada triángulo un tono propio, y eso define la forma sin necesitar sombras proyectadas.
3. **Brillos aditivos.** Son *sprites* y puntos con `AdditiveBlending` y sin escribir profundidad: el halo de la hoguera (70 %), las esporas, las brasas, los destellos de mirada y la estrella lenta. Lo que brilla flota sobre el mundo.

La única luz con alcance real es la puntual de la hoguera (intensidad 18, distancia 30 m, caída 1,5). Moldea el claro alrededor del fuego y se pierde en la noche.

**The No-Shadow Rule.** Ninguna luz proyecta sombras. Si un objeto necesita asentarse en el suelo, se le da un tono más oscuro en la base o una faceta de contacto, no una sombra.

## Shapes

Todo está hecho de poliedros de pocas caras: el planeta es un icosaedro de detalle 3; la luna, uno de detalle 1; los fragmentos del aterrizaje, tetraedros. No hay curvas suaves, no hay texturas pintadas y no hay *normal maps*. El color se pone por vértice o por material (`MeshLambertMaterial`, `flatShading: true`).

- **Vegetación y cristales:** se instancian por chunk (un `InstancedMesh` por tipo) y varían de color dentro de su familia.
- **Siluetas:** son facetadas y algo irregulares; el ruido del terreno las rompe para que no se vean geométricas.
- **Escala:** los objetos de la historia son pequeños y están a mano. El cielo es enorme. El contraste de escala es parte del sentimiento: *eres arena en el salar*.
- **Píxel:** con el modo retro, el *pixel ratio* se limita para que el render mida 460 px de alto y se escala con `image-rendering: pixelated`. Las facetas pequeñas se funden en bloques. Esto está calibrado así y no hay que compensarlo con más detalle.

**The Facet-Only Rule.** Los assets nuevos (incluidos los modelos glTF del pipeline polyfork) se muestran con *flat shading* y colores planos de esta paleta. Si un modelo trae texturas o normales suavizadas, se aplanan antes de entrar a escena.

## Do's and Don'ts

### Do:
- **Do** usa solo colores de esta paleta para geometría nueva. Si hace falta uno nuevo, elige un pastel frío o un neón suave y agrégalo aquí.
- **Do** haz que lo que brilla brille frío y con mezcla aditiva (`destello-mirada`, `espora`, `cristal-*`).
- **Do** deja que la niebla haga el trabajo de profundidad y de borde. Para avisar del límite, densifica la niebla antes de poner una barrera.
- **Do** compón pensando en el render a 460 px: siluetas claras y grandes masas de color se leen; el detalle fino se pierde.
- **Do** respeta `prefers-reduced-motion` en cualquier movimiento de cámara nuevo (sentarse, revelación de la nave).

### Don't:
- **Don't** agregues otra fuente de luz cálida además de la hoguera (The One Fire Rule).
- **Don't** subas la mezcla del alba por encima de 0,12 ni pintes cielos rosados antes del Acto 6.
- **Don't** actives sombras en tiempo real ni uses materiales PBR (`MeshStandardMaterial`) o texturas detalladas.
- **Don't** cambies el orden de las llamadas a `rng()` en `sky.ts`, `chunks.ts` ni `storyWorld.ts` para mover o recolorear algo: rompe el determinismo de todas las semillas.
- **Don't** muestres el cuerpo de Isi: ni sombra, ni manos, ni reflejo.
- **Don't** quites ni atenúes las esporas, que son el toque mágico del valle.
- **Don't** trates `src/styles/tokens.css` (Fredoka, tarjetas redondeadas con desenfoque) como la identidad de la UI: es provisoria y va a ser reemplazada por el estilo sketch.
