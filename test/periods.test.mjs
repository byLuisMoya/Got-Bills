// Comprobacion de la aritmetica de periodos: toda fecha del rango de una clave
// debe volver a esa misma clave, y los rangos deben encadenar sin huecos.
import { periodKeyOf, periodRange, daysInPeriod, periodRangeLabel, addMonths } from '../src/utils/dates.js'

let fails = 0
const ok = (cond, msg) => { if (!cond) { console.log('FALLO:', msg); fails++ } }
// Formateo LOCAL: toISOString() convierte a UTC y en el cambio de hora pierde
// o duplica un dia, que era lo que hacia fallar octubre y noviembre.
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const parse = (s) => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d) }
const iter = (a, b) => { const out = []; const d = parse(a); const end = parse(b)
  while (d <= end) { out.push(iso(d)); d.setDate(d.getDate()+1) } return out }

for (const cut of [1, 5, 15, 16, 25, 28]) {
  for (let m = 0; m < 26; m++) {
    const key = addMonths('2025-01', m)
    const { start, end } = periodRange(key, cut)

    // 1) toda fecha del rango pertenece al periodo
    for (const iso of iter(start, end)) {
      ok(periodKeyOf(iso, cut) === key, `corte ${cut}: ${iso} deberia caer en ${key}, cae en ${periodKeyOf(iso, cut)}`)
    }
    // 2) el dia anterior al inicio pertenece al periodo anterior
    const prev = parse(start); prev.setDate(prev.getDate() - 1)
    ok(periodKeyOf(iso(prev), cut) === addMonths(key, -1),
       `corte ${cut}: la vispera de ${start} deberia ser ${addMonths(key,-1)}`)
    // 3) el rango encadena con el siguiente sin hueco ni solape
    const next = periodRange(addMonths(key, 1), cut)
    const dayAfterEnd = parse(end); dayAfterEnd.setDate(dayAfterEnd.getDate() + 1)
    ok(next.start === iso(dayAfterEnd),
       `corte ${cut}: ${key} acaba en ${end} pero el siguiente empieza en ${next.start}`)
    // 4) la longitud declarada coincide con la real
    ok(daysInPeriod(key, cut) === iter(start, end).length,
       `corte ${cut} ${key}: daysInPeriod=${daysInPeriod(key,cut)} real=${iter(start,end).length}`)
  }
}

console.log(`corte 25 · agosto 2026 -> ${periodKeyOf('2026-08-29', 25)} (${periodRangeLabel(periodKeyOf('2026-08-29',25), 25)})`)
console.log(`corte 25 · 24 ago 2026 -> ${periodKeyOf('2026-08-24', 25)} (${periodRangeLabel(periodKeyOf('2026-08-24',25), 25)})`)
console.log(`corte  5 · 29 ago 2026 -> ${periodKeyOf('2026-08-29', 5)} (${periodRangeLabel(periodKeyOf('2026-08-29',5), 5)})`)
console.log(`corte  1 · 29 ago 2026 -> ${periodKeyOf('2026-08-29', 1)} (${periodRangeLabel(periodKeyOf('2026-08-29',1), 1)})`)
console.log(fails ? `\n${fails} comprobaciones fallidas` : '\nTodas las comprobaciones OK')
process.exit(fails ? 1 : 0)
