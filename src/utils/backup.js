import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { toISO } from './dates'
import { fromCents } from './format'

const stamp = () => toISO(new Date())

/**
 * Guarda un texto y lo ofrece al usuario.
 * En Android escribe en Documentos y abre el menu de compartir (lo unico que
 * saca el archivo de la app); en el navegador cae a una descarga normal.
 */
export async function saveAndShare (filename, text, mimeType) {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(new Blob([text], { type: mimeType }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return { path: filename, shared: false }
  }

  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: text,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true
  })

  try {
    await Share.share({ title: filename, url: uri, dialogTitle: 'Guardar copia de seguridad' })
    return { path: uri, shared: true }
  } catch {
    // El usuario cerro el menu de compartir: el archivo ya esta escrito igualmente.
    return { path: uri, shared: false }
  }
}

export const backupName = (ext) => `got-bills-${stamp()}.${ext}`

/** CSV con separador ';' y coma decimal: es lo que espera Excel en español. */
export function toCSV (state, categoriesById) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = [['Fecha', 'Tipo', 'Categoria', 'Importe', 'Nota'].join(';')]
  const sorted = [...state.transactions].sort((a, b) => a.date.localeCompare(b.date))
  for (const t of sorted) {
    rows.push([
      t.date,
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      esc(categoriesById[t.categoryId]?.name || 'Sin categoría'),
      String(fromCents(t.amount).toFixed(2)).replace('.', ','),
      esc(t.note)
    ].join(';'))
  }
  return '﻿' + rows.join('\r\n')
}

/** Lee un archivo elegido con <input type="file">. */
export const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
