# Got Bills

App Android para llevar gastos e ingresos **en local**, con los gráficos que el
banco no te da: reparto por categorías, evolución mes a mes, saldo acumulado del
mes y presupuestos.

No hay servidor, ni cuentas, ni analítica. La APK **no pide el permiso de
internet**: todo vive en el `localStorage` del WebView, dentro del móvil.

| Resumen | Análisis | Alta rápida |
|---|---|---|
| Balance del mes, saldo día a día, donut de categorías con su tabla, presupuestos | Ingresos vs gastos por mes, ahorro acumulado, medias y mejor/peor mes | Importe, tipo, categoría, fecha y nota en una pantalla |

## Stack

- **Vue 3** (`<script setup>`) + **Ionic 8** para los componentes móviles
- **Capacitor 6** para empaquetar la web como app nativa Android
- **Chart.js 4** para el donut, las barras y las líneas
- **Vite 5** para el build

Sin backend, sin base de datos y sin estado global más allá de un `reactive()`
que se persiste solo (`src/store/useStore.js`).

## Cómo está montado

```
src/
  store/
    db.js          persistencia en localStorage, migración y export/import
    useStore.js    estado reactivo + todos los agregados (totales, reparto, tendencias)
    sheet.js       estado del formulario de alta/edición, compartido entre pantallas
  charts/          Chart.js: donut, barras agrupadas y línea de saldo
  components/      piezas de UI (fila de movimiento, medidor de presupuesto, ...)
  views/           las cuatro pestañas + categorías
  theme/
    palette.js     paleta categórica de 8 huecos, validada para daltonismo
    variables.css  tokens de color (tema oscuro y claro)
  utils/           formato de dinero y fechas, copia de seguridad
```

Dos decisiones que explican casi todo el código:

- **Los importes se guardan en céntimos** (enteros). Sumar cientos de `float`
  acaba enseñando `1234,5600000001` en el balance.
- **Las categorías guardan un índice de paleta, no un hex.** Así el mismo color
  se re-escalona al pasar de tema oscuro a claro en vez de quedarse apagado, y
  los ocho colores están validados: separación bajo daltonismo (ΔE ≥ 8 en OKLab)
  y contraste contra las dos superficies reales de la app.

## Requisitos para compilar

- Node 20+
- JDK 17 (`brew install openjdk@17`)
- Android SDK con `platforms;android-34` y `build-tools;34.0.0`
  (`brew install --cask android-commandlinetools`)

Crea `android/local.properties` apuntando a tu SDK:

```properties
sdk.dir=/opt/homebrew/share/android-commandlinetools
```

Y exporta el JDK antes de compilar:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

## Comandos

```bash
npm install
npm run dev        # la app en el navegador, con recarga en caliente
npm run apk        # build web + sync + APK de release firmada
npm run apk:debug  # APK de depuración
npm run icons      # regenera iconos y splash desde assets/*.png
```

La APK sale en `android/app/build/outputs/apk/release/app-release.apk`.
Para instalarla: pásala al móvil y ábrela, o `adb install -r <ruta>`.

## Firma — léelo antes de instalar

La APK se firma con `android/keystore/gotbills-release.jks`, y sus contraseñas
están en `android/keystore.properties`. **Los dos están en `.gitignore` y no se
suben al repo.**

Android sólo deja instalar una actualización encima si está firmada con la misma
clave. Si pierdes ese keystore tendrás que **desinstalar** la app para poner una
versión nueva, **y al desinstalar se borran los datos**. Guarda una copia de esa
carpeta fuera del proyecto.

Si clonas el repo sin el keystore, Gradle firma el release con la clave de
depuración para que el build no falle: sirve para probar, no para actualizar una
instalación existente.

## Copias de seguridad

Los datos **no** entran en el backup de Google (`allowBackup="false"`,
a propósito: son datos financieros). La copia se hace a mano desde
**Ajustes → Exportar copia de seguridad**, que genera un JSON reimportable.
También hay exportación a CSV para abrirlo en Excel o Sheets.

## Notas

- `minSdk 22` (Android 5.1) — funciona en cualquier móvil razonablemente actual.
- El release va con `minifyEnabled false`: R8 sobre Capacitor necesita reglas
  `keep` por plugin y el ahorro (~1 MB) no compensa un release que sólo falla
  ya instalado en el móvil.
- Los recursos generados (`res/mipmap-*`, `res/drawable-*`) **sí** se versionan:
  sin ellos un clon recién hecho no compila.
