// El comparador de versiones decide si sale el aviso de actualizar. Comparar
// como texto diria que "1.9.3" es mayor que "1.10.0", y el aviso no saldria
// nunca a partir de la decima minor.
import { compareVersions } from '../src/utils/updates.js'

let fails = 0
const ok = (cond, msg) => { if (!cond) { console.log('FALLO:', msg); fails++ } }

const mayor = [
  ['1.1.0', '1.0.0'],
  ['1.10.0', '1.9.3'],   // el caso que rompe la comparacion por texto
  ['2.0.0', '1.99.99'],
  ['v1.1.0', '1.0.9'],   // con y sin la 'v' del tag de git
  ['1.0.1', '1.0.0'],
  ['1.1', '1.0.5']       // menos partes de las esperadas
]
const iguales = [['1.0.0', '1.0.0'], ['v1.0.0', '1.0.0'], ['1.0', '1.0.0']]

for (const [a, b] of mayor) {
  ok(compareVersions(a, b) > 0, `${a} deberia ser mayor que ${b}`)
  ok(compareVersions(b, a) < 0, `${b} deberia ser menor que ${a}`)
}
for (const [a, b] of iguales) {
  ok(compareVersions(a, b) === 0, `${a} y ${b} deberian ser iguales`)
}
// Basura por la API no debe provocar un aviso fantasma.
ok(compareVersions('', '1.0.0') < 0, 'una version vacia no puede ser mas nueva')
ok(compareVersions('no-es-una-version', '1.0.0') < 0, 'texto suelto no puede ser mas nuevo')

console.log(fails ? `\n${fails} comprobaciones fallidas` : 'Comparador de versiones OK')
process.exit(fails ? 1 : 0)
