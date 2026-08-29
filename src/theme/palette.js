/**
 * Paleta categorica de 8 huecos, validada para daltonismo contra las dos
 * superficies de la app (#171e35 oscuro / #ffffff claro).
 *
 * Las categorias guardan el INDICE del hueco, no un hex: asi el mismo color
 * "azul" se re-escalona al cambiar de tema en lugar de quedarse apagado.
 * En modo claro tres huecos quedan por debajo de 3:1 de contraste; por eso
 * toda grafica de esta app lleva siempre leyenda con nombre e importe, y el
 * color nunca es el unico canal que identifica una categoria.
 */

import { ref } from 'vue'

/**
 * Modo claro activo. Vive aqui (y no en theme.js) para que el store pueda
 * resolver colores sin crear un ciclo de imports con el propio store.
 */
export const lightMode = ref(false)

export const SLOTS = [
  { key: 'blue',    name: 'Azul',     light: '#2a78d6', dark: '#3987e5' },
  { key: 'orange',  name: 'Naranja',  light: '#eb6834', dark: '#d95926' },
  { key: 'aqua',    name: 'Agua',     light: '#1baf7a', dark: '#199e70' },
  { key: 'yellow',  name: 'Ámbar',    light: '#eda100', dark: '#c98500' },
  { key: 'magenta', name: 'Magenta',  light: '#e87ba4', dark: '#d55181' },
  { key: 'green',   name: 'Verde',    light: '#008300', dark: '#008300' },
  { key: 'violet',  name: 'Violeta',  light: '#4a3aa7', dark: '#9085e9' },
  { key: 'red',     name: 'Rojo',     light: '#e34948', dark: '#e66767' }
]

export const SLOT_COUNT = SLOTS.length

export const slotColor = (slot, light = false) => {
  const s = SLOTS[((slot | 0) % SLOT_COUNT + SLOT_COUNT) % SLOT_COUNT]
  return light ? s.light : s.dark
}

/** Gris de "Otros": deliberadamente sin color, para que no compita con las categorias. */
export const OTHER_COLOR = (light) => (light ? '#898781' : '#7a8299')

/** Elige el hueco menos usado, para no repetir color hasta agotar la paleta. */
export function nextFreeSlot (categories) {
  const used = new Array(SLOT_COUNT).fill(0)
  for (const c of categories) used[((c.slot | 0) % SLOT_COUNT + SLOT_COUNT) % SLOT_COUNT] += 1
  let best = 0
  for (let i = 1; i < SLOT_COUNT; i++) if (used[i] < used[best]) best = i
  return best
}
