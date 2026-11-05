# Brief narrativo — "De Espacio-Tiempo", Acto I ("Astronauta")

## Historial

- **2026-11-03:** versión original. Premisa de duda sin amnesia, sin vínculos humanos y cierre en quietud junto al fuego.
- **2026-11-05: cambio de canon decidido por el autor**, al reescribir los textos (DIS-02). Cambian las decisiones 2, 4, 5, 7 y 8, el mapeo de objetos y los textos de dirección. Lo que el autor ya escribió está en `src/content/acto1.json`, que ahora es la referencia del copy; este brief fija el canon que esos textos establecen.

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

### Capítulo 0 — despertar junto al fuego
- **`fire`**: el fuego. Isi no sabe si lo hizo ella misma.
- **`helmet`**: el casco de astronauta, maltratado, con la etiqueta «ISI»
  adentro. Es el primer dato de quién es.
- **`thermos`**: un set de mate (termo, mate de madera, bombilla). El olor le
  resulta familiar. *Pendiente de arte (DIS-03): hoy la escena solo tiene un
  termo; el mate y la bombilla no existen.*

### Capítulo 1 — quién era antes de partir
- **`patch`**: la insignia de la misión (cohete y planeta). Isi recuerda que
  tenía una misión.
- **`photo`**: Isi joven con su familia y un gato. Aquí empieza a recordar de
  verdad. *Pendiente de arte (DIS-03): la familia y el gato no se ven.*
- **`seeds`** (transmisor): más de cien mensajes al espacio, sin respuesta.

### Capítulo 2 — el miedo del viaje
- **`recorder`**: un mensaje que Isi misma escribió durante el vuelo: tenía
  miedo y extrañaba la seguridad de casa.
- **`beacon`**: una pieza del motor cubierta de polvo; la reconoce como parte
  de su nave. Eco de "el polvo de la duda se acumula en el motor".

### Capítulo 3 — la nave
- **`ship`**: siempre quiso volar entre las estrellas, y ahora le duele mirar
  la nave. Al terminar el capítulo admite la causa: dudó.

### Capítulo 4 — el destino
- **`star`** (gatillo: mirar al cielo): la estrella lejana a la que iba. Debe
  completar la misión, aunque le asuste.
- Beat final (`al_terminar` del capítulo 5 en el JSON): lo fácil y lo difícil,
  y la frase central como algo escuchado en una canción.

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
