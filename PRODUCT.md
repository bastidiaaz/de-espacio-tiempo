# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fans de Tiann que lo siguen en redes sociales. Llegan por un link publicado en redes (posts, stories, bio) y abren el juego en el teléfono, en sesiones cortas y probablemente con audífonos. Ya conocen la música; no necesariamente son jugadores habituales. El juego es otra forma de habitar la canción.

## Product Purpose

"De Espacio-Tiempo" es la adaptación jugable del álbum *despacio-tiempo* de Tiann: 6 canciones, 6 actos, en el orden del tracklist. Cada acto traduce una canción en una experiencia contemplativa de exploración.

El éxito de un acto es que quien lo juega se quede con la sensación de la canción, aunque no la verbalice. Por ejemplo, al cerrar el Acto I ("Astronauta"): está bien atreverse, aunque la incertidumbre siga presente. Al terminar, el juego invita a escuchar la canción (`https://ffm.to/tiann-astronauta`, `https://ffm.to/tiann-despacio`).

## Positioning

No es una historia de amnesia. Isi recuerda perfectamente lo que pasó; lo que no puede es mirarlo de frente. La mecánica central es sostener la mirada: quedarse quieta 1,7 s mirando algo es atreverse a admitir una verdad que ya conoce. El radio jugable que crece es miedo, no memoria. Cada acto puede redefinir qué significa el gesto sin tocar la mecánica.

## Operating Context

- Se juega en móvil web. Se entra desde un link en redes sociales, sin instalación.
- Calendario: Acto I pulido lo antes posible; Acto II ("Despacio") poco después (ambas canciones ya están publicadas); Actos 3 a 6 junto al álbum (estimado: marzo de 2027).
- Equipo: el autor + Claude. El roadmap vive en `docs/roadmap.md`.
- Fuente de verdad narrativa: los briefs por acto en `docs/superpowers/specs/`. Si el código contradice un brief, manda el brief.

## Capabilities and Constraints

- Mundo low-poly procedural y determinista por semilla, en React 18 + Three.js 0.160.0 (fijado) + TypeScript + Vite. Las invariantes técnicas están en `CLAUDE.md`.
- Móvil primero: sin sombras en tiempo real, instancing por chunk, render retro a 460 px de alto.
- Progresión por capas: 5 capítulos por acto, radio que crece, tarjetas que se escriben y avanzan solas, pistas a los 45 s.
- Cámara en primera persona pura. Isi no se ve nunca.
- Idioma in-game: español.
- Hilos reservados, que no se resuelven antes de su acto: "¿volverá a volar?" (Acto 6); a quién le habla Isi cuando transmite (sin acto asignado).
- Tipografía: Caveat como letra manuscrita (D7), con Belleza y Glacial Indifference del Tiann Design System. Las decisiones D1–D7 están resueltas en el roadmap.

## Brand Commitments

- Nombre: "De Espacio-Tiempo" (juego de palabras con "despacio"). Protagonista: Isi. Artista: Tiann.
- No se toca: el estilo low-poly (los assets pueden cambiar), el modo retro pixelado como look principal, la atmósfera y las esporas, la música y los sonidos actuales (se suman capas, no se reemplazan), la progresión por capas y la mecánica de la mirada.
- Referencia de UI: la portada de "Astronauta". Trazo blanco a mano sobre negro, letras manuscritas, estrellas en cruz y *boiling line*.
- Voz: los textos in-game los escribe el autor. Claude orienta y revisa, nunca redacta el texto final. Hay que evitar explicar la emoción.
- Cada acto tiene un cambio visual fuerte respecto del anterior. Su portada es la referencia de su UI.

## Evidence on Hand

- Brief del Acto I con la letra completa de "Astronauta": `docs/superpowers/specs/2026-11-03-de-espacio-tiempo-acto1-astronauta-design.md`.
- Links oficiales de las canciones en ffm.to (ver arriba).
- Referencias visuales del mirador en la raíz del repo (planeta anillado dominando el horizonte).
- Versión original: `reference/lumen-vale-remember.html`.
- No hay testimonios, métricas de jugadores ni prensa. No se inventan.

## Product Principles

1. **La canción manda.** Cada acto sirve a su canción: su letra y su sensación deciden el contenido, no la conveniencia del motor.
2. **Mostrar, no explicar.** La emoción se sugiere con espacio, luz, sonido y silencio. El texto es escaso y es del autor.
3. **De un link a estar dentro.** Un fan que llega desde redes en el teléfono debe estar caminando en segundos, sin fricción ni conocimientos de videojuegos.
4. **Preservar la atmósfera.** Lo nuevo se suma por capas sobre el low-poly, el retro, las esporas y el audio existentes; nunca los reemplaza.
5. **Respetar el canon.** No se adelantan hilos reservados, y no se cierra con una sanación que el álbum guarda para más adelante.

## Accessibility & Inclusion

- Respetar `prefers-reduced-motion` en la *boiling line* y en las animaciones de cámara.
- Opciones de sensibilidad de cámara y tamaño de texto (ENG-09), guardadas en claves `lvr-*` nuevas; las claves existentes no cambian.
- Controles táctiles como caso principal; teclado y ratón como secundarios.
