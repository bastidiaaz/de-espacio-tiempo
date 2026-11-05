# Guía de escritura — Acto I ("Astronauta")

> **DIS-01.** Esta guía sirve para reescribir los textos de `src/content/acto1.json` (DIS-02). Los textos los escribe el autor. Aquí hay criterios, preguntas y notas; no hay líneas de reemplazo.
> **Canon revisado (2026-11-05):** al reescribir, el autor cambió el canon (ver el historial del brief). Isi ahora despierta sin recordar, así que el principio 1 ya no aplica tal cual: el gesto es recuperar un recuerdo, no admitir algo sabido. Las notas de la sección 4 comentan los textos del 2026-11-04 y quedan como historial. Los demás principios siguen vigentes.
>
> **Fuentes:** el brief del Acto I (`docs/superpowers/specs/2026-11-03-de-espacio-tiempo-acto1-astronauta-design.md`), la letra de "Astronauta" tal como aparece en ese brief y los textos actuales (2026-11-04). Si DIS-03 cambia algún objeto, su nota de aquí queda obsoleta.

## 1. La voz de Isi

1. **Isi sabe.** No descubre nada: lo admite. Ningún texto puede sonar a "ahora entiendo" o "de pronto recordé". El gesto es atreverse a mirar algo que ya conocía.
2. **El objeto habla primero.** Cada tarjeta parte de algo que se ve o se toca: piedras, un rayón, cardamomo, una costura. La emoción queda en lo que el objeto deja ver, no en una frase que la nombre.
3. **Frases cortas y concretas.** Isi está cansada, no es poética. Le salen sustantivos y verbos, casi sin adjetivos.
4. **Lo que no dice pesa.** La herida es "dudé". Cada tarjeta puede acercarse a esa palabra sin decirla. La que la dice tiene que ganársela.
5. **El cierre tiene dos mitades** (decidido por el autor, 2026-11-04). Tiene que doler todavía, como pide el brief. Y a la vez tiene que decir "está bien atreverse, aunque la incertidumbre siga presente", como pide el roadmap: valentía, atrevimiento, incertidumbre, curiosidad. Si el final solo duele, o solo consuela, falla.
6. **Eco, no cita.** La letra es la cantera de imágenes: equipaje, polvo de la duda, estela, traje ligero, sol cálido en la soledad fría, mensajes a la Luna, arena en el salar, mirar al cielo para olvidar, ingravidad, horizonte de eventos. Las imágenes pueden aparecer; los versos completos, no. La única cita textual reservada es la frase central del cierre.

### Quién habla (decidido por el autor, 2026-11-04)

- **Inicio y final:** en 2.ª y/o 3.ª persona.
- **Desarrollo** (tarjetas, susurros, capítulos): en 1.ª persona, la voz de Isi.

Así está hoy:

| Dónde | Persona | Ejemplo actual |
|---|---|---|
| Intro | 2.ª ("Despiertas…") | `intro.primera_vez`, `intro.retomando` |
| Tarjetas, susurros, capítulos | 1.ª (Isi) | casi todo |
| Final | 3.ª ("Isi se queda quieta…") | `final.cuerpo` |

El reparto actual ya cumple la decisión. La 2.ª persona coincide con la de la canción ("Llevas años preparando tu equipaje", "Te comprendo"): alguien le habla a la astronauta. La 3.ª mira a Isi desde fuera. En el inicio y el final se pueden combinar. Lo que importa es que ninguna de las dos se cuele en el desarrollo, y que la 1.ª persona no aparezca en el marco.

## 2. Qué evitar

- **Nombrar la emoción:** miedo, soledad, dolor, esperanza. Si la palabra aparece, la tarjeta suele estar explicando. Hoy "miedo" sale 2 veces y "atreverse" 4.
- **Explicar el sentido del gesto:** "y eso no arregla nada", "nada de esto explica todavía…". El jugador ya lo sintió; decírselo resta.
- **Indicaciones de juego disfrazadas de pensamiento:** "La nave tiene que estar justo delante." Las pistas (`pista`) sí orientan; los pensamientos (`al_terminar`) no deberían hacerlo.
- **Gastar las palabras clave.** Hoy "todavía" aparece 9 veces, "fuego" 8, "mirar" 8, "de frente" 6 y "quieta" 6. "Dudé" sale en el fuego (capítulo 0), en la pieza del motor y en la estrella. Si la palabra ya salió en la primera tarjeta, la estrella no la estrena.
- **Repetir remates.** "Aquí fue" (nave y fin del capítulo 4), "medio segundo" (motor y final), "suficiente" (motor y estrella), "por ahora" (3 veces). Cada uno sirve una vez.
- **Resolver hilos reservados.** Nada sobre volver a volar (Acto 6). Nada sobre a quién le transmite (sin asignar). Nada de amanecer ni sanación.

## 3. Límites prácticos (los pone el motor)

- **Tarjetas** (memorias y pensamientos): se escriben a 42 caracteres/s y quedan en pantalla `4 + 0,045 × caracteres` segundos antes de avanzar solas. Una tarjeta de 120 caracteres tarda unos 3 s en escribirse y queda 9 s. Hoy van de 44 a 151 caracteres; la más larga es el registro de vuelo.
- **Susurros**: duran poco y no se pueden pausar.
  - `quedarse_quieta`: 1,6 s. Tiene que leerse de un vistazo (hoy, 26 caracteres).
  - `al_llegar_al_borde`: 3,5 s. Conviene no pasar de ~50 caracteres.
  - `pista` de capítulo: 4,5 s. Conviene no pasar de ~60. Hoy las de los capítulos 2 y 3 tienen 77.
- **Móvil primero.** El texto se lee en un teléfono, sobre el valle de noche y con el pixelado retro.
- **Formato:** reglas del JSON en `docs/editar-textos.md`. Para probar un texto en segundos, abre el Acto I con `#debug` y salta al ítem.

## 4. Nota por texto

Cada nota dice **qué sobra** y **hacia dónde se podría ir**. Las direcciones son preguntas o imágenes, no frases para copiar.

### Memorias

**`fire` — El fuego** (capítulo 0, 97 car.)
- *Sobra:* "Por una vez, no dudé." Nombra la herida en la primera tarjeta del juego y le quita peso a la estrella.
- *Dirección:* las manos que saben hacer algo mientras la cabeza está en otra parte (lo dice el brief). ¿Qué tiene de raro, o de fácil, haber hecho esto sin pensarlo?

**`helmet` — El casco rayado** (capítulo 0, 129 car.)
- *Sobra:* "listo para un viaje que yo seguía posponiendo" explica el objeto. El rayón y la caja ya bastan.
- *Dirección:* el equipaje de la letra ("Llevas años preparando tu equipaje"). ¿Cuántos años? ¿Dónde estaba la caja? Un dato concreto pesa más que la explicación.

**`thermos` — El termo abollado** (capítulo 0, 112 car.)
- *Funciona:* es de las mejores. El cardamomo es concreto, y el gesto de preparar para dos dice la soledad sin nombrarla.
- *A revisar:* "como si alguien más fuera a tomarlo conmigo" está al límite de explicar. ¿Se puede mostrar con algo del objeto (dos tazas, una tapa) en vez de decirlo? La letra ofrece "cálido es el sol… en tu fría soledad": calor y frío juntos.

**`patch` — La insignia** (capítulo 1, 110 car.)
- *Sobra:* "para tener por fin una excusa con la que partir". Lo que dice la insignia ya lo sugiere.
- *Dirección:* la costura hecha a mano, la misión que nadie le encargó. ¿Cómo quedó la costura? ¿Torcida, prolija? Eso dice más que el porqué.
- *Decidido:* "SURVEY ONE" no va en inglés a propósito; se reescribe. El nombre de la misión es un buen lugar para la voz de Isi: lo inventó ella.

**`photo` — La fotografía** (capítulo 1, 120 car.)
- *Sobra:* "sin miedo" y "temerle al cielo que todavía no me atrevo a cruzar". Son dos nombres para la misma emoción en una sola tarjeta.
- *Dirección:* la letra dice "En la Tierra mirabas al cielo para olvidar". ¿Qué estaba mirando la Isi de la foto? ¿Hacia dónde apunta la cámara? Que la diferencia entre entonces y ahora la ponga el jugador.

**`seeds` — El transmisor** (capítulo 1, 121 car.)
- *Funciona:* "Seguí grabando igual" es el remate justo, terco y sin queja.
- *A revisar:* "dirigidos a quien fuera que estuviera escuchando" roza el hilo reservado (a quién le habla). Hoy lo deja abierto, y está bien; cuidado con no darle forma de persona.
- *Dirección:* la letra dice "Tus mensajes a la Luna ya no llegan y se pierden en el mar". ¿La Luna o el mar pueden entrar como imagen? "Cien" es concreto y sirve.

**`recorder` — Registro de vuelo** (capítulo 2, 151 car., la más larga)
- *Funciona:* la frase cortada ("puedo—") y el silencio son la mejor herramienta del acto: la duda se oye sin nombrarla.
- *Sobra:* "No terminé la frase. Tampoco terminé la maniobra." explica el paralelo que la cita ya mostró.
- *Dirección:* terminar en el silencio, o en algo que se oiga después (estática, una alarma). Recortarla además la deja bajo los 120 caracteres.

**`beacon` — Pieza del motor** (capítulo 2, 113 car.)
- *Sobra:* "Dudé medio segundo. Fue suficiente." adelanta exactamente lo que la nave y la estrella tienen que entregar después. Con esto, el capítulo 2 ya resuelve el misterio.
- *Dirección:* "El polvo de la duda se acumula en el motor al despegar" es la imagen más literal de la letra y le pertenece a este objeto. El polvo puede quedar como evidencia física, sin traducirlo a "dudé". El jugador lo conecta en la estrella.

**`ship` — Mi nave** (capítulo 3, 120 car.)
- *Funciona:* "ISI" estampado a mano bajo el cristal es concreto y propio.
- *Sobra:* "Un pie todavía en la Tierra, cuando ya estaba en el aire" parafrasea la frase central antes del cierre y la desgasta. "Aquí fue" se repite en el fin del capítulo 4.
- *Dirección:* el lugar exacto de la cabina donde pasó: un asiento, una palanca, un botón. Que el "aquí" sea un objeto y no una frase.

**`star` — Una estrella lenta** (capítulo 4, 100 car.)
- *Sobra:* "No hay más que decir, y lo sé desde el primer día" es una frase sobre la tarjeta, no sobre la estrella. Y si las demás ya no dicen "dudé", esta es la que lo dice por primera vez.
- *Dirección:* el brief pide la memoria completa y cruda del instante. ¿Qué vio por la ventanilla en ese medio segundo? Quizás esta estrella. La letra ofrece "la vida es tan solo un instante de ingravidad". Es el único lugar donde "dudé" puede decirse de frente, una vez.

### Capítulos (`pista` a los 45 s y `al_terminar`)

**Capítulo 1**
- `pista` (40 car.): funciona, es corta y orienta.
- `al_terminar`: "La oscuridad cede un poco" describe lo que el jugador ya ve en pantalla. ¿Qué siente Isi al ver el surco, no qué pasa en el cielo?

**Capítulo 2**
- `pista` (77 car.): larga para 4,5 s. "Lo que dejé por el camino" ya orienta; la primera frase sobra.
- `al_terminar`: "Nada de esto explica todavía por qué estoy en el suelo" anuncia la estructura del misterio. Es la voz del diseñador, no la de Isi.

**Capítulo 3**
- `pista` (77 car.): larga. "Empieza a tener sonido" es buena idea, porque anticipa el registro de vuelo sin nombrarlo.
- `al_terminar`: "La nave tiene que estar justo delante" es una instrucción de juego. Si hace falta orientar, eso va en la `pista` del capítulo 4.

**Capítulo 4**
- `pista` (28 car.): funciona.
- `al_terminar`: "Aquí fue" repite la nave. "Todavía no me atrevo a decirlo completo" explica el gesto. "Algo allá arriba se mueve despacio" es buena: señala la estrella, y "despacio" le guiña al Acto II sin resolver nada. Puede bastar sola.

**Capítulo 5 (cierre)**
- `pista` (28 car.): "aunque duela" nombra el dolor. ¿Basta con el gesto de mirar arriba?
- `al_terminar`: tres tarjetas.
  - La primera es la frase central y está bien que vaya textual.
  - "Lo sé ahora" choca con el principio 1 (Isi ya lo sabía).
  - "No sé todavía qué hacer con eso" explica la falta de resolución.
  - "Me quedo quieta" es el gesto. Pregunta para el autor: ¿hace falta algo entre la frase central y la quietud, o el silencio basta?
  - Aquí entran las dos mitades del cierre: duele, y mirar igual fue un atrevimiento, aunque no resuelva nada. "El horizonte de eventos promete algo más" es la imagen de la letra para esa curiosidad.

### Voz de Isi (susurros)

- **`al_despertar`** (2 tarjetas): "la misma pregunta de siempre" está bien porque es vaga. La segunda ("tal vez por fin pueda mirarlo de frente") explica la mecánica con palabras de la interfaz. ¿Puede Isi decirlo a su manera, sin "mirar de frente"?
- **`al_llegar_al_borde`** (3 variantes, se elige una al azar):
  - "Todavía no. Eso no." es la mejor: corta y física.
  - "El miedo pesa más que la curiosidad, por ahora" nombra dos emociones en 3,5 s.
  - "Hay algo más cerca que sí puedo mirar" es útil como pista.
  - Ojo: cuando el borde avise con sonido (AUD-05), estas líneas pueden ser aún más cortas.
- **`quedarse_quieta`** (1,6 s): es parte del desarrollo, así que va en la voz de Isi. Hoy es una orden en 2.ª persona ("Quédate quieta"). Sirve si se lee como Isi hablándose a sí misma; si suena a narrador, rompe la regla de quién habla.

### Interfaz

La interfaz puede ser neutra, pero comparte vocabulario con la voz de Isi. Si "mirar de frente" vive en el HUD, el diario y la intro, se gasta antes de llegar a las tarjetas.

- **`intro.primera_vez`:** "y lo recuerdas todo" dice la premisa en voz alta. ¿Hace falta? El jugador lo entiende por las tarjetas.
- **`intro.retomando` / `intro.completo`:** funcionan, y ya están en 2.ª persona, como pide el marco.
- **`como_jugar_*`:** son instrucciones; claridad antes que voz. `como_jugar_final` se pega detrás de la instrucción táctil o de teclado (en `src/content/copy.ts`); se leen juntas.
- **`hud.nada_mirado` / `hud.contador`:** "mirados de frente" se repite en cada partida. ¿Basta un verbo más corto?
- **`diario.titulo`** ("Lo que ya puedo mirar") **y `diario.desconocido`:** funcionan, son de Isi. El segundo sale en cada casilla vacía, así que se va a leer muchas veces.
- **`final.titulo`** ("Por ahora"): funciona, pero repite el "por ahora" del capítulo 5. Elegir uno de los dos.
- **`final.cuerpo`** (218 car.): es el texto más explicativo del acto. "Y eso no arregla nada" y "la pregunta también" le dicen al jugador qué sentir. Repite la frase central, que acaba de leer en el capítulo 5. La 3.ª persona ya cumple el marco; la 2.ª también serviría. Debe llevar las dos mitades del cierre: que duela y que valga haberse atrevido. Preguntas: ¿el final necesita repetir la frase o puede dejarla resonar? ¿Puede ser más corto que las tarjetas?

## 5. Cuando el borrador esté listo

1. Editar `src/content/acto1.json` y correr `npm test`. El test avisa si falta un id, si un texto quedó vacío o si el contador perdió `{n}` o `{total}`.
2. Jugar con `#debug` y leer cada texto en su momento real, en el teléfono si se puede.
3. Pasarle el archivo a Claude para la revisión contra el brief (DIS-02).
