# Pipeline de assets (polyfork)

Cómo entra un modelo 3D al juego. Nace de ENG-10.

## Resumen

**buscar → revisar licencia → descargar el .glb → revisar y optimizar → `public/models/` → registrar → cargar**

## 1. Buscar

- Con el MCP **polyfork** conectado en Claude Code, se busca con `search_assets`.
  - En móvil, filtra siempre con `max_triangles` (ver presupuesto abajo).
- Antes de elegir, abre el asset con `get_asset` y mira sus renders.
- Elige un modelo que ya tenga el **tamaño real** correcto (`size_m`, en metros). **No se reescala para "hacerlo calzar":** si no calza, se busca otro.
  - El origen está en el suelo (y = 0).
  - Se coloca con `field.groundAt(x, z)`, igual que los objetos de `storyWorld.ts`.
- Estilo: low-poly, flat shading y colores por vértice, sin texturas. Si el catálogo no tiene algo adecuado, se dice, y se usa `report_need` o se modela proceduralmente como hasta ahora.

## 2. Licencia

- Los modelos **low-poly** son gratis y se pueden incluir dentro del juego, sin atribución. Ver [polyfork.dev/licensing](https://polyfork.dev/licensing).
- **No** se permite:
  - redistribuir los archivos sueltos como assets;
  - usar las ediciones **HD** (requieren Pro y tienen otra licencia).
- **Ojo con el repo:** hoy es privado. Si algún día se hace público, los `.glb` quedarían descargables sueltos desde GitHub. Antes de hacerlo, hay que revisarlo, por ejemplo sacando `public/models/` del repo y descargándolos en CI.
- Aunque no se exige atribución, todo modelo se anota en `CREDITS.md`. El test lo exige.

## 3. Descargar

Usa el `.glb` autoral, no el `-preview.glb`: el preview no trae normales ni nombres de nodos.

```sh
curl -fL -o public/models/<id>.glb https://polyfork.dev/cdn/<id>.glb
```

El nombre del archivo es el id de polyfork. Así se puede rastrear el origen.

## 4. Revisar y optimizar

- Los modelos de polyfork ya vienen chicos: la roca de prueba pesa 17 KB y tiene 144 triángulos. Normalmente no hace falta tocarlos.
- **Prohibido Draco y meshopt.** Exigen decodificadores que no cargamos. El test rechaza cualquier `extensionsRequired`.
- Si un modelo pesa más de ~150 KB, se puede soldar y deduplicar sin cambiar el aspecto:

  ```sh
  npx @gltf-transform/cli weld public/models/<id>.glb public/models/<id>.glb
  npx @gltf-transform/cli dedup public/models/<id>.glb public/models/<id>.glb
  ```

  No uses `simplify` sin mirar el resultado: rompe las facetas del flat shading.

### Presupuesto de triángulos por objeto

Lo define `TRIANGLE_BUDGET` en `src/game/assets/models.ts`.

| Tipo | Máximo | Ejemplos |
|---|---|---|
| `prop` | 600 | rocas, plantas, escombros. Si se repiten, **instanciados** (ver abajo) |
| `story` | 2000 | los objetos de memoria que se miran de cerca |
| `hero` | 8000 | pieza única vista a escala: la nave (ART-05) |

Reglas móviles que siguen vigentes:
- **Sin sombras en tiempo real.** No se activa `castShadow` ni `receiveShadow`.
- **Un solo material.** El loader reemplaza el PBR del glTF por el Lambert con flat shading del juego.
- **Instancing.** Un modelo que aparece muchas veces no se clona por copia. Se toma su `geometry` y se usa `buildInstanced` (`src/game/three/helpers.ts`), como los props de los chunks.

## 5. Registrar

Agrega una entrada en `MODELS` (`src/game/assets/models.ts`), con estos campos:
- `file`: el nombre del archivo en `public/models/`;
- `kind`: `prop`, `story` o `hero`;
- `source`: el origen, por ejemplo `polyfork:<id>`.

Luego agrega una fila en `CREDITS.md`.

`src/game/assets/models.test.ts` falla si:
- hay un `.glb` en `public/models/` sin entrada en `MODELS`, o una entrada sin su archivo;
- un modelo supera el presupuesto de su tipo;
- algún primitivo no tiene colores por vértice, el modelo trae texturas o exige extensiones;
- el modelo no aparece en `CREDITS.md`.

## 6. Cargar en escena

```ts
import { modelUrl } from '../assets/models';
import { loadModel } from '../three/gltf';
import { disposeObject } from '../three/helpers';

const rock = await loadModel(modelUrl('testRock')); // THREE.Group, ya con el material del juego
rock.position.set(x, field.groundAt(x, z), z);
```

- **La carga es asíncrona y el arranque de `Game` es síncrono.** El modelo se agrega a la escena cuando llega. Si el acto se cerró antes (`dispose()`), hay que liberarlo con `disposeObject`. Ver `Game.placeTestModel`.
- **Determinismo:** la carga no consume `rng()`. Si un modelo reemplaza un objeto procedural, **no quites** las llamadas a `rng()` que ese objeto hacía en `chunks.ts`, `storyWorld.ts` o `sky.ts`: el resto del mundo se correría. El test de terreno (`terrain.test.ts`) debe seguir pasando.
- Cada `loadModel` devuelve su propia copia, y `dispose()` del acto la libera junto con el resto de la escena.

## Asset de prueba

En modo debug (`#debug`) aparece una roca de polyfork (`field-rock-5e37c6`) a unos pasos del saco de dormir, a un costado del camino hacia el fuego (se ve al despertar). Sirve para verificar que un modelo cargado se ve con el mismo flat shading y la misma niebla que el resto. Sin `#debug` no aparece.
