import { reactive } from 'vue'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { addTransaction, updateTransaction, removeTransaction } from './useStore'

// Confirmacion tactil al guardar/borrar. En navegador el plugin no existe y
// simplemente no pasa nada, por eso el catch vacio.
const tap = (style) => Haptics.impact({ style }).catch(() => {})

/**
 * Estado del formulario de alta/edicion. Vive fuera de las vistas porque el
 * modal se pinta una sola vez (en las tabs) y cualquier pantalla puede abrirlo.
 */
export const sheet = reactive({ open: false, transaction: null, defaultDate: '' })

export const openNew = (date = '') => {
  sheet.transaction = null
  sheet.defaultDate = date
  sheet.open = true
}

export const openEdit = (tx) => {
  sheet.transaction = tx
  sheet.open = true
}

export const closeSheet = () => {
  sheet.open = false
  sheet.transaction = null
}

export const saveFromSheet = (data) => {
  if (sheet.transaction) updateTransaction(sheet.transaction.id, data)
  else addTransaction(data)
  tap(ImpactStyle.Light)
  closeSheet()
}

export const deleteFromSheet = (tx) => {
  if (tx) removeTransaction(tx.id)
  tap(ImpactStyle.Medium)
  closeSheet()
}
