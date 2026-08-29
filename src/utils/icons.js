// Set curado de iconos para categorias. Se importan uno a uno a proposito:
// `import * as icons from 'ionicons/icons'` mete ~1300 SVG en el bundle de la APK.
import {
  cart, home, flash, carSport, restaurant, gameController, medkit, bagHandle,
  repeat, ellipsisHorizontal, briefcase, sparkles, returnDownBack, airplane,
  barbell, beer, bicycle, bed, book, bus, cafe, cash, school, construct,
  cut, desktop, fastFood, film, fitness, footsteps, gift, glasses, hammer,
  headset, heart, iceCream, key, leaf, library, musicalNotes, paw, phonePortrait,
  pizza, pricetag, receipt, shirt, subway, ticket, train, trendingUp, umbrella,
  wallet, wifi, wine, colorPalette, pawOutline, card, shieldCheckmark, cellular
} from 'ionicons/icons'

/** Clave estable guardada en cada categoria -> icono de ionicons. */
export const ICONS = {
  cart, home, flash, 'car-sport': carSport, restaurant, 'game-controller': gameController,
  medkit, 'bag-handle': bagHandle, repeat, 'ellipsis-horizontal': ellipsisHorizontal,
  briefcase, sparkles, 'return-down-back': returnDownBack, airplane, barbell, beer,
  bicycle, bed, book, bus, cafe, cash, school, construct, cut, desktop,
  'fast-food': fastFood, film, fitness, footsteps, gift, glasses, hammer, headset,
  heart, 'ice-cream': iceCream, key, leaf, library, 'musical-notes': musicalNotes,
  paw, 'phone-portrait': phonePortrait, pizza, pricetag, receipt, shirt, subway,
  ticket, train, 'trending-up': trendingUp, umbrella, wallet, wifi, wine,
  'color-palette': colorPalette, card, 'shield-checkmark': shieldCheckmark, cellular
}

export const ICON_KEYS = Object.keys(ICONS)

export const iconFor = (key) => ICONS[key] || pricetag
