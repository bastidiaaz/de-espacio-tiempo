# Roadmap — De Espacio-Tiempo

> Nace de la auditoría con el autor del 2026-11-04. Resume su opinión por área y la convierte en tareas con inputs y outputs.
> La fuente de verdad narrativa sigue siendo el brief de cada acto (`docs/superpowers/specs/`). Si una tarea cambia el canon, primero se actualiza el brief y después el código.

## Visión

- **Qué es:** el juego acompaña al álbum *despacio-tiempo*. Son 6 canciones y 6 actos.
- **Plataforma:** móvil web primero.
- **Equipo:** el autor + Claude.
- **Calendario:**
  - **Release 1:** Acto I pulido, lo antes posible.
  - **Release 2:** Acto II ("Despacio"), poco después. Ambas canciones ya están publicadas.
  - **Release 3:** Actos 3 a 6, junto al álbum (estimado: marzo de 2027).
- **Sensación al cerrar el Acto I:** está bien atreverse, aunque la incertidumbre siga presente. Valentía y atrevimiento, con incertidumbre y curiosidad.

## Lo que se protege (no tocar sin hablarlo)

- **Look:** el estilo low-poly. Los assets pueden cambiar, pero el estilo se mantiene.
- **Modo retro:** el pixelado a 460 px es el look principal. Ya está activo por defecto (`Game.ts:105`).
- **Ambiente:** la atmósfera general y las esporas, que le dan el toque mágico.
- **Audio:** la música y los sonidos actuales. Se agregan capas; no se reemplazan.
- **Progresión:** la historia se abre por capas: 5 capítulos y un radio que crece.
- **Mecánica:** sostener la mirada, tal como está (1,7 s, quieta).
- **Texto en pantalla:** las tarjetas, que se escriben y avanzan solas, y las pistas a los 45 s.
- **Cámara:** primera persona pura. **Isi no se ve nunca.**

## Hallazgos por área

| Área | Funciona | No funciona | Falta |
|---|---|---|---|
| Game design | Mirada, capas, pistas, tarjetas; la revelación de la nave | Textos muy explicativos; el borde no avisa; la estrella se confunde con las esporas | Nave como momento "wow"; cierre animado junto al fuego; canción de cierre; 5 objetos ocultos; mirador oculto; invitación a ffm.to; tracklist multi-acto |
| Ingeniería | Rinde fluido en el teléfono; separación motor/UI; CI | Doble Enter; comentarios con la premisa antigua | Textos en un archivo editable; modo debug; deploy; analítica privada; tests de la mirada y E2E; opciones (sensibilidad, tamaño de texto); pipeline de assets vía polyfork; ADR multi-acto |
| Arte y animación | Low-poly, paleta, atmósfera, retro | UI genérica: intro, tarjetas, diario, tipografía | UI en estilo sketch con *boiling line* (como la portada); bloom, viñeta y grano; nave más grande y detallada; estrella distinta; mirador con el planeta dominando el encuadre; animación de sentarse |
| Audio y sonido | Pad, cajita musical, fuego, campanitas | — | "Astronauta" sintetizada desde la partitura; pasos; viento; sonido de la mirada; aviso de borde; música por capas según capítulo; silencio con misterio antes de la nave |

## Decisiones abiertas

| # | Decisión | Quién | Bloquea |
|---|---|---|---|
| ~~D1~~ | ~~Arquitectura multi-acto y progreso guardado~~ — **resuelta:** `docs/adr/0001-multi-acto.md` | Claude (ADR) → aprobado por el autor | — |
| ~~D2~~ | ~~Formato del archivo de textos~~ — **resuelta: un `.json` por acto**, validado por test (`src/content/acto1.json`, guía en `docs/editar-textos.md`) | Claude propone → autor | — |
| ~~D3~~ | ~~Proveedor de analítica sin cookies (GoatCounter, Plausible o Umami)~~ — **resuelta (2026-11-05): GoatCounter** | Autor | — |
| ~~D4~~ | ~~GitHub Pages o Vercel~~ — **resuelta (2026-11-04): GitHub Pages**, publicado desde el workflow de CI | Autor | — |
| ~~D5~~ | ~~Conexión del MCP polyfork y licencias de sus assets~~ — **resuelta (2026-11-04):** conectado (plan gratis); los modelos low-poly se pueden incluir en el juego sin atribución; las ediciones HD no. Ver `docs/assets.md` | Autor conecta → Claude verifica | — |
| ~~D6~~ | ~~Al cierre, ¿canción completa o un fragmento? ¿Se repite en el paseo libre?~~ — **resuelta (2026-11-05): solo el coro (B1), una vez, junto al fuego; no se repite en el paseo libre.** Ver "Cierre" en el brief del Acto I | Autor | — |
| D7 | Tipografía manuscrita (licencia OFL, o letras dibujadas por el autor) | Autor | ART-01 |

## Tareas

Cada tarea lleva su **ID**, una o más **dependencias**, un **tamaño** (S/M/L) y una **prioridad** (P0: bloquea el release; P1: release; P2: después).
Los textos in-game los **escribe el autor**; Claude orienta y revisa.

### Fase 0 — Desbloquear (antes de producir)

**ENG-01 · ADR multi-acto** · M · P0 · ✅ hecho (2026-11-04): ADR aprobado e implementado (menú, selección de actos, opciones, Acto I como módulo)
- **Inputs:**
  - Respuestas de la auditoría (tracklist con desbloqueo en orden, mecánicas libres por acto, cambio visual fuerte).
  - `Game.ts`, `src/content/`, `progress.ts`.
  - Invariantes de CLAUDE.md.
- **Output:** `docs/adr/0001-multi-acto.md`. Debe definir:
  - escena por acto o motor compartido;
  - cómo se registra el contenido de cada acto;
  - cómo se guarda el progreso de cada acto y el de los objetos ocultos;
  - cómo se lee `lvr-mem-<seed>` sin perder partidas.
- **Hecho cuando:** el autor lo aprueba. Las claves existentes siguen leyéndose, y el determinismo por semilla queda intacto.

**ENG-02 · Textos a un archivo editable** · M · P0 · ✅ hecho (2026-11-04): textos del Acto I en `src/content/acto1.json` (interfaz, voz de Isi, memorias, capítulos); loader tipado `acto1Texts.ts`; `acto1.test.ts` falla con mensajes legibles si falta o sobra un id; guía en `docs/editar-textos.md`
- **Inputs:** `src/content/story.ts`, `src/content/copy.ts`.
- **Output:**
  - un archivo de textos del Acto I, separado del código;
  - un loader tipado;
  - un test que falla si falta o sobra un id.
- **Hecho cuando:** el autor puede cambiar cualquier texto sin tocar TypeScript, y lint, typecheck, test y build pasan.

**ENG-03 · Modo debug** · S · P0 · ✅ hecho (2026-11-04): `#debug` (o `#w123&debug`) en el Acto I; saltar a un ítem te deja frente a él y la mirada la haces tú; en debug no se guarda nada
- **Inputs:** `Game.ts`, `narrative.ts`, `progress.ts`.
- **Output:** un modo oculto, activado con hash (`#debug`), que permite:
  - saltar a cualquier capítulo o ítem;
  - marcar todo como completado;
  - ver el radio.
- **Hecho cuando:** se puede probar un texto o la secuencia final en menos de 30 s, y sin el hash nada del modo debug es visible.

**ENG-10 · Pipeline de assets vía polyfork** · M · P0 · ✅ hecho (2026-11-04): flujo en `docs/assets.md`; `loadModel` (`src/game/three/gltf.ts`) re-viste el modelo con el Lambert flat del juego; manifiesto y presupuesto en `src/game/assets/models.ts`, verificados por `models.test.ts`; `CREDITS.md`; roca de prueba visible solo en `#debug`
- **Inputs:** el MCP polyfork conectado; el presupuesto móvil (sin sombras, instancing).
- **Output:**
  - un flujo documentado: buscar → licencia → descargar glTF → optimizar → `public/models/`;
  - un loader (`GLTFLoader` de three 0.160.0);
  - un archivo `CREDITS.md` con las atribuciones;
  - un presupuesto de polígonos por objeto.
- **Hecho cuando:** un asset de prueba se ve en escena con flat shading coherente, sin alterar el orden de `rng()` (el test de terreno pasa).

**ENG-04 · Deploy** · S · P0 · ✅ workflow listo (2026-11-04): job `deploy` en `.github/workflows/ci.yml`, publica el mismo `dist/` que pasó los checks; repo público y Pages activado con Source: GitHub Actions. URL: https://play.tiannmusica.com/ (dominio propio verificado; DNS en Bandzoogle)
- **Inputs:** `vite.config.ts` (ya tiene `base './'`), `.github/workflows/ci.yml`.
- **Output:** un deploy automático desde `main` y una URL pública.
- **Hecho cuando:** cada push a `main` con CI en verde publica el juego.

**DIS-01 · Guía de escritura del Acto I** · S · P0 · ✅ hecho (2026-11-05): `docs/guia-textos-acto1.md`, usada por el autor en DIS-02. Los tests de `acto1.test.ts` ya no fijan frases literales, así que reescribir no rompe `npm test`
- **Inputs:** el brief del Acto I, la letra completa de "Astronauta" y los textos actuales.
- **Output:** `docs/guia-textos-acto1.md`, con:
  - principios de la voz de Isi;
  - qué evitar ("explicar" la emoción);
  - una nota por cada texto actual: qué sobra y qué se podría sugerir.
- **Hecho cuando:** el autor la usa para reescribir. Claude no redacta el texto final.

### Fase 1 — Release 1: Acto I pulido

**Game design y narrativa**

**DIS-02 · Reescritura de textos (autor)** · M · P1 · depende de ENG-02, DIS-01, DIS-03 · ✅ hecho (2026-11-05): textos del autor en `acto1.json`, con el cambio de canon pasado al brief
- **Inputs:** la guía DIS-01 y el modo debug.
- **Output:** un archivo de textos nuevo. Claude lo revisa contra el brief.
- **Hecho cuando:** el autor da su visto bueno jugando.

**DIS-03 · Revisión de objetos por capa** · M · P1 · ✅ hecho (2026-11-05): tabla aprobada por el autor en el brief del Acto I ("Tabla de objetos"); cambian `thermos`, `photo`, `seeds`, `recorder` y `beacon`
- **Inputs:** el brief, la letra y la estructura de 5 capas (que no cambia).
- **Pendiente de los textos nuevos (2026-11-05):** el `thermos` ahora es un set de mate (falta el mate y la bombilla en escena) y la `photo` muestra a Isi con su familia y un gato (no se ven).
- **Output:** una tabla de objeto → capa → qué recuerdo recupera Isi. Si cambian objetos, se actualiza el brief y, por ejemplo, el transmisor y la pieza de motor reciben una forma que corresponda.
- **Hecho cuando:** el autor aprueba la lista y el brief queda al día.

**DIS-04 · Conceptos de los 5 objetos ocultos** · S · P1 · depende de ENG-01 · ✅ hecho (2026-11-05): sección "Objetos ocultos" del brief del Acto I, aprobada por el autor. Son guiños a Tiann que Isi no reconoce: guitarra, lápiz de insulina, foto del campanil, arete de hoja y carta en el mirador. Siguen DIS-12, ENG-13, ART-11 y AUD-08
- **Inputs:** el brief, la letra y las restricciones (no resolver hilos reservados: el despegue es del Acto 6, y a quién transmite Isi no tiene acto asignado todavía).
- **Output:** 5 conceptos propuestos por Claude, con ubicación y razón de cada uno. El autor elige y escribe los textos.
- **Mecánica de los ocultos:** solo aparecen en el paseo libre, no cuentan en el contador, y al encontrarlos dan texto y sonido, igual que hoy.
- **Hecho cuando:** hay 5 conceptos aprobados.

**DIS-12 · Textos de los objetos ocultos (autor)** · S · P1 · depende de DIS-04; la carta, de DIS-05 · ✅ hecho (2026-11-05): textos del autor en `acto1.json` (sección `ocultos`, validada), decisiones en el brief. La carta se escribió antes de DIS-05; si el mirador cambia lo que se ve, se revisa
- **Inputs:** la sección "Objetos ocultos" del brief del Acto I. Es un título y un texto para cada uno: guitarra, lápiz de insulina, foto del campanil, arete de hoja y carta.
- **Reglas del brief:**
  - Isi no reconoce los objetos;
  - nunca se dice quién estuvo aquí ni se nombra a Tiann;
  - nada insinúa el despegue;
  - la carta no es para Isi ni de ella, y habla del paisaje del mirador.
- **Output:** los textos en `acto1.json`, en una sección propia de ocultos. Claude los revisa contra el brief.
- **Hecho cuando:** el autor les da el visto bueno.

**DIS-05 · Mirador oculto** · S · P1 · ✅ hecho (2026-11-05): sección "Mirador" del brief del Acto I, aprobada por el autor. Cordillera en el borde del mundo; al escalar el pico se revela un cielo que solo existe ahí (planeta anillado gigante y galaxia), con la carta en la cima. El planeta del cielo normal se achica. Siguen ART-08, ENG-13 (la carta) y AUD-03
- **Inputs:** las referencias visuales del autor: un planeta anillado enorme sobre el horizonte, agujas de cristal y siluetas por capas.
- **Output:** un spec con:
  - la ubicación;
  - cómo se descubre;
  - el encuadre ideal;
  - qué ocurre ahí (contemplar; ¿puede ser uno de los 5 ocultos?).
- **Hecho cuando:** el autor aprueba el spec.

**DIS-06 · Señales antes del borde** · S · P1 · ✅ hecho (2026-11-05): sección "Borde" del brief del Acto I, aprobada por el autor. Antes del tope, el mundo se apaga (oscuridad y viñeta, la música baja, crece el viento) e Isi avanza más lento, como empujada de vuelta. El paseo libre tiene el mismo borde a los 400 m, salvo en el mirador, con una frase propia. Siguen ENG-14 y AUD-05
- **Inputs:** `atmosphere.ts`, `Game.resolvePlayer` y los EDGE_LINES.
- **Output:** un spec de señal progresiva, visual (niebla, viñeta o algo similar) y sonora (AUD-05), que avise antes del tope duro.
- **Hecho cuando:** el jugador nota el borde antes de chocar con él, sin una pared invisible abrupta.

**DIS-07 · Secuencia de cierre** · M · P1 · guion ✅ aprobado (2026-11-05): sección "Cierre" del brief del Acto I. Capítulo nuevo de la fogata entre la nave y la estrella (11 recuerdos, 6 capítulos); Isi se sienta al recordarla, mira la estrella sentada y, tras la cita, suena el coro una vez con cámara guiada; pantalla final «Te sientas junto al fuego» con la invitación debajo. Se publica por partes. Falta implementarlo (ART-09, AUD-01, UI-03) y los textos del autor
- **Secuencia (original):** mirar la estrella desde cerca de la fogata → Isi se sienta junto al fuego (cámara) → "Astronauta" en versión juego → invitación a escuchar en `https://ffm.to/tiann-astronauta` → paseo libre con los ocultos y el mirador.
- **Output:** un guion con tiempos y estados de UI.
- **Hecho cuando:** el autor lo aprueba, y queda implementado mediante ART-09, AUD-01 y UI-03.

**DIS-08 · La nave como momento "wow"** · S · P1 · guion ✅ aprobado (2026-11-05): sección "Revelación de la nave" del brief del Acto I. Nave del tamaño de un bus, enorme y ya estrellada; la niebla la esconde al acercarse, a 30 m el juego toma la cámara ~10 s sin poder saltarla (baja a ras de suelo y la recorre subiendo), con acorde grave y crujidos, sin la melodía de "Astronauta". Después se le sostiene la mirada como siempre. Falta implementarlo (ART-05, AUD-03)
- **Secuencia:** silencio con viento antes de verla (AUD-03) → revelación con cámara guiada y apertura de niebla → escala y detalle (ART-05).
- **Output:** un guion con tiempos.
- **Hecho cuando:** el autor lo aprueba.

**Ingeniería**

**ENG-05 · Analítica privada** · S · P1 · código ✅ (2026-11-05): `src/analytics.ts` (GoatCounter, solo en producción y nunca con `#debug`); eventos `acto-N/inicio`, `acto-N/completado` (primera vez en ese navegador) y `acto-N/escuchar`. Sitio: `tiann-play.goatcounter.com`. Falta ver los eventos en el panel tras el deploy
- **Output:** tres eventos anónimos: inicio, acto completado y clic en ffm.to. Sin cookies.
- **Hecho cuando:** los eventos aparecen en el panel, y no hay banner de consentimiento porque no se necesita.

**ENG-06 · Deuda conocida** · S · P1
- **Output:**
  - corregir el doble Enter con la tarjeta enfocada;
  - limpiar los comentarios con la premisa antigua (`sky.ts`, `attention.ts`, `atmosphere.ts`);
  - eliminar el doc-comment duplicado en `Game.ts`;
  - actualizar la sección "Diferencias conocidas" de CLAUDE.md.

**ENG-07 · Tests de la mirada** · M · P1
- **Inputs:** `systems/attention.ts`. Si hace falta, se extrae la lógica sin Three.js para poder testearla en Node.
- **Output:** tests de dwell, drain, cono, rango y selección del ítem más central.

**ENG-08 · E2E con Playwright** · M · P1 · depende de ENG-03
- **Output:** un flujo intro → despertar → (debug) final → link de ffm.to, con WebGL vía SwiftShader, corriendo en CI.

**ENG-09 · Opciones de accesibilidad** · S · P1
- **Output:** sensibilidad de cámara y tamaño de texto, guardados en claves nuevas `lvr-*`. Las existentes no cambian.

**ENG-13 · Objetos ocultos en el juego** · M · P1 · depende de DIS-04 y DIS-12; la carta, de DIS-05
- **Inputs:** la sección "Objetos ocultos" del brief del Acto I y los textos de DIS-12.
- **Output:**
  - los cinco ocultos, solo en el paseo libre, entre 220 y 380 m del fuego y cada uno en una dirección distinta, fuera de las direcciones de la nave y de la estrella;
  - cada uno con su propio escondite;
  - se activan con la mirada, sin contar en el contador, y se guardan en `lvr-a1-hidden-<seed>`;
  - un panel en el modo debug para saltar a cada uno.
- **Ojo:** no tocar el orden de `rng()` (usar un generador propio derivado de la semilla), y correr un oculto al punto seco más cercano si cae en agua o dentro de un collider.
- **Hecho cuando:** el autor encuentra los cinco sin debug, y le cuesta pero lo logra.

**ENG-14 · El borde se apaga** · S · P1 · depende de DIS-06; la excepción del mirador, de ENG-13/ART-08
- **Inputs:** la sección "Borde" del brief del Acto I.
- **Output:**
  - la franja antes del tope (25 % del radio, entre 4 y 25 m; 15 m en el paseo libre), donde la escena se oscurece con una viñeta suave;
  - el empuje: la velocidad hacia fuera baja hasta cerca de un 30 % en el tope;
  - el tope duro también en el paseo libre (400 m), sin oscuridad ni empuje en el sector del mirador;
  - la frase «Hasta aquí llega lo que puedo caminar...» en `voz_de_isi.al_llegar_al_borde_libre` de `acto1.json`, validada;
  - un segundo anillo en el modo debug donde empieza la franja.
- **Ojo:** la oscuridad es un multiplicador sobre la luz, no cambia `k` ni la paleta del cielo; sin postproceso caro en móvil.
- **Hecho cuando:** el autor llega al borde de cada capítulo y del paseo libre y lo nota antes de chocar.

**Arte y animación**

**ART-01 · Dirección de arte de la UI, estilo sketch** · M · P1 · depende de D7
- **Inputs:** la portada de "Astronauta": línea blanca a mano sobre negro, letras manuscritas, estrellas en cruz.
- **Output:**
  - tokens en `src/styles/tokens.css`;
  - una tipografía manuscrita;
  - un filtro de *boiling line* (SVG `feTurbulence` + `feDisplacementMap` a pocos fps, desactivado con *reduced motion*);
  - una página de prueba.
- **Hecho cuando:** el autor aprueba el prototipo en el teléfono.

**UI-02 · Intro y título** · M · P1 · depende de ART-01
- **Output:** una intro rediseñada con identidad de portada.

**UI-03 · Tarjetas, diario, final e invitación** · M · P1 · depende de ART-01
- **Output:** los componentes `MemoryCard`, `Journal` y `Ending` rediseñados, más la tarjeta de invitación a ffm.to. Sin cambiar el comportamiento de las tarjetas.

**ART-04 · Post-procesado** · M · P1
- **Output:** bloom suave, viñeta y grano, compatibles con el render retro de 460 px.
- **Hecho cuando:** mantiene 60 fps en el teléfono del autor, con un comparativo antes/después aprobado.

**ART-05 · Nave nueva** · L · P1 · depende de ENG-10, DIS-08
- **Output:** un modelo más grande, más roto y más detallado (vía polyfork, o mixto con procedural) y la revelación de cámara implementada.
- **Hecho cuando:** el momento se siente "wow" en la prueba del autor.

**ART-06 · Estrella distinguible** · S · P1
- **Output:**
  - un color y un brillo únicos en el cielo, con latido o destello;
  - una posición que se pueda mirar desde la fogata;
  - la guía sonora (AUD-04 o AUD-06).
- **Ojo:** no alterar el orden de `rng()` en `sky.ts`.
- **Hecho cuando:** se encuentra sin pista en menos de 30 s.

**ART-07 · Objetos de memoria actualizados** · M · P1 · depende de DIS-03, ENG-10
- **Inputs:** la tabla de objetos del brief del Acto I (DIS-03). Cinco modelos nuevos:
  - `thermos`: set de mate (termo, mate de madera, bombilla);
  - `photo`: foto pixelada, muy pequeña, donde se distinguen Isi joven, la familia y el gato;
  - `seeds`: walkie-talkie con antena;
  - `recorder`: cuaderno negro de tapa dura con el cohete y el planeta de la insignia;
  - `beacon`: rejilla del motor con polvo, que mantiene la luz roja que parpadea.
- **Output:** modelos coherentes con la lista aprobada, del tamaño y en la posición de los actuales.
- **Ojo:** el determinismo de `storyWorld.ts`.

**ART-11 · Modelos de los objetos ocultos** · M · P1 · depende de DIS-04, ENG-10
- **Inputs:** la tabla "Objetos ocultos" del brief del Acto I. Son cinco modelos: guitarra clásica, lápiz de insulina, foto del campanil de Concepción (imagen pixelada pequeña), arete alargado de hoja en cobre rojizo, y una carta.
- **Output:** los modelos con las reglas de ENG-10, más el destello de cercanía (visible a unos 30 m).

**ART-08 · Mirador** · M · P1 · depende de DIS-05
- **Output:** el lugar, su acceso y el encuadre con el planeta dominante.
- **Hecho cuando:** existe una captura comparable a las referencias del autor.

**ART-09 · Animación de sentarse junto al fuego** · S · P1 · depende de DIS-07
- **Output:** una animación de cámara (bajar, acomodarse, mirar al fuego y a la estrella), en primera persona, respetando *reduced motion*.

**Audio y sonido**

**AUD-01 · "Astronauta", versión juego** · L · P1 · depende de D6
- **Inputs:** la partitura de la voz principal, en MIDI, MusicXML o una imagen que Claude transcribe y el autor valida.
- **Output:**
  - los datos de la melodía en `src/content/`;
  - una voz sintetizada (cajita musical o pad) en `audio.ts`;
  - el ambiente bajando de volumen mientras suena.
- **Hecho cuando:** el autor reconoce la canción y aprueba la versión.

**AUD-02 · Pasos** · S · P1
- **Output:** pasos suaves que varían según la superficie (arena, pasto, roca), sincronizados con el cabeceo de la cámara.

**AUD-03 · Viento y silencio** · M · P1
- **Output:** una capa de viento y atmósfera que es el "silencio" del juego. Se usa antes de la nave (el resto de la música se calla) y crece en el mirador.

**AUD-04 · Sonido de la mirada** · S · P1
- **Output:** un tono que crece con el progreso de foco de `attention` y resuelve en la campanita actual.

**AUD-05 · Aviso de borde** · S · P1 · depende de DIS-06 y AUD-03
- **Output:** en la franja del borde, el viento de AUD-03 sube y el pad, la cajita y la canción bajan, hasta que en el tope solo queda el viento (sección "Borde" del brief).

**AUD-06 · Música por capítulo** · M · P1
- **Output:** el pad y las notas de cajita ganan capas en cada capítulo, sin reemplazar lo actual.

**AUD-08 · Arpegio de la guitarra oculta** · S · P1 · depende de DIS-04
- **Inputs:** el arpegio del brief del Acto I (sección "Sonido de la guitarra"): Sol4, Re4, La#3, Sol3, Re#3 y La#2, barrido de la 1.ª a la 6.ª cuerda.
- **Output:** un sonido de guitarra sintetizado en `audio.ts`, que reemplaza el de recuerdo solo para la guitarra.
- **Hecho cuando:** el autor aprueba el timbre y la velocidad del barrido.

**Cierre del release**

**REL-01 · Release 1** · S · P1 · depende de todo lo anterior
- **Output:** pase completo en el teléfono, notas de versión y URL pública.
- **Hecho cuando:** lint, typecheck, test, build y E2E pasan, y el autor juega el acto completo.

### Fase 2 — Release 2: Acto II "Despacio"

**DIS-09 · Brief del Acto II** · M · P0 de la fase
- **Inputs:** la letra completa de "Despacio" y un diálogo con el autor, usando la skill `generating-act-briefs`.
- **Output:** `docs/superpowers/specs/*-acto2-despacio-design.md`.

**DIS-10 · Mecánica propia del Acto II** · M · depende de DIS-09
- **Output:** un spec de la variación de mecánica que pida la canción.

**ENG-12 · Tracklist e infraestructura multi-acto** · L · depende de ENG-01
- **Output:** un menú tipo tracklist con desbloqueo en orden, carga de contenido por acto y migración del guardado.

**ART-10 · Identidad visual del Acto II** · L · depende de DIS-09
- **Output:** paleta, bioma y cielo propios (el cambio entre actos debe ser fuerte) y portada de "Despacio" como referencia de UI.

**AUD-07 · "Despacio", versión juego** · L · depende de la partitura de "Despacio"
- **Output:** la canción sintetizada y la invitación a `https://ffm.to/tiann-despacio`.

**DIS-11 · Textos del Acto II (autor)** · M · depende de DIS-09, ENG-12

**REL-02 · Release 2** · S

### Fase 3 — Actos 3 a 6 (con el álbum, ~marzo de 2027)

- Se repite el patrón de la Fase 2 por canción: brief → mecánica → identidad visual → canción en versión juego → textos del autor → release.
- Los hilos reservados se respetan: el despegue (si Isi se atreve a salir) se resuelve en el Acto 6 ("el regreso"), y a quién le habla Isi cuando transmite todavía no tiene acto asignado.

## Inputs que dependen del autor

- [x] Letra completa de "Astronauta" (para DIS-01 y DIS-03): está en el brief del Acto I.
- [ ] Partitura de la voz principal de "Astronauta" (para AUD-01).
- [x] Conectar el MCP polyfork en Claude Code (D5).
- [ ] Decisiones D3 y D7.
- [ ] Reescritura de textos (DIS-02).
- [ ] Letra y partitura de "Despacio", y portada (para la Fase 2).

## Orden sugerido para el Release 1

1. **Fase 0:** ENG-01, ENG-02, ENG-03, ENG-04, ENG-10 y DIS-01. Pueden ir en paralelo.
2. **Diseño:** DIS-03 → DIS-04, DIS-05, DIS-06, DIS-07 y DIS-08. Los specs son cortos y se aprueban rápido.
3. **Producción:** arte, UI y audio en paralelo. El autor reescribe textos (DIS-02) y escribe los de los ocultos (DIS-12) mientras tanto.
4. **Calidad:** ENG-06 a ENG-09 durante la producción; ENG-05 y REL-01 al final.
