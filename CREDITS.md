# Créditos

## Modelos 3D

Los modelos de `public/models/` vienen de [Polyfork](https://polyfork.dev). La licencia de los modelos low-poly ([polyfork.dev/licensing](https://polyfork.dev/licensing)) permite:
- usarlos en proyectos comerciales, modificados o no;
- incluirlos dentro del juego;
- no exige atribución. Se listan igual por trazabilidad.

Lo que no permite es redistribuir los archivos sueltos como assets. Ver `docs/assets.md`.

| Archivo | Asset de Polyfork | Uso |
|---|---|---|
| `field-rock-5e37c6.glb` | [Field rock](https://polyfork.dev/asset/field-rock-5e37c6) (`field-rock-5e37c6`) | Asset de prueba de ENG-10; solo aparece en `#debug` |

## Tipografías

Las tipografías de `public/fonts/` se distribuyen bajo la [SIL Open Font License 1.1](https://openfontlicense.org). Cada carpeta lleva su `OFL.txt`.

| Carpeta | Tipografía | Autor | Origen | Notas |
|---|---|---|---|---|
| `glacial-indifference/` | Glacial Indifference (Regular, Bold, Italic) | Alfredo Marco Pradil · [Hanken Design Co.](https://hanken.co/products/glacial-indifference) | [Font Squirrel](https://www.fontsquirrel.com/fonts/glacial-indifference), v1.01 (2015) | Versión modificada, con la misma licencia OFL, que no reserva el nombre. Se le agregaron `¿ ¡ « » ·`, que no traía, armados con sus propios trazos, y se convirtió a `.woff2`. Se regenera con `scripts/fonts/patch_glacial_indifference.py`. |
| `caveat/` | Caveat (variable, 400–700) | The Caveat Project Authors · [Impallari Type](https://github.com/googlefonts/caveat) | [Google Fonts](https://fonts.google.com/specimen/Caveat), v23 | El archivo `.woff2` tal como lo sirve Google Fonts, en su subconjunto `latin` (cubre el español). Sin modificar. |
| `belleza/` | Belleza (Regular) | The Belleza Project Authors · [Eduardo Tunni](https://github.com/etunni/belleza) | [Google Fonts](https://fonts.google.com/specimen/Belleza), v18 | El archivo `.woff2` tal como lo sirve Google Fonts, en su subconjunto `latin` (cubre el español). Sin modificar. |
