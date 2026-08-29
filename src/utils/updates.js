import { Capacitor } from '@capacitor/core'

/*
 * Aviso de version nueva. Es lo unico de toda la app que toca la red, y por eso
 * el manifest lleva el permiso de INTERNET.
 *
 * Lo que sale del movil: nada. Es un GET a la API publica de GitHub, sin
 * cabeceras propias, sin cuerpo y sin cookies; GitHub ve la IP de la peticion y
 * poco mas. Ni los movimientos ni los ajustes se envian a ningun sitio.
 */

const REPO = 'byLuisMoya/Got-Bills'
const API = `https://api.github.com/repos/${REPO}/releases/latest`
export const RELEASES_URL = `https://github.com/${REPO}/releases/latest`

/** Una comprobacion al dia basta: es una app que se actualiza cada mucho. */
const CHECK_EVERY_MS = 24 * 60 * 60 * 1000
const TIMEOUT_MS = 8000

// Vite lo sustituye por la version de package.json al compilar. El guardia es
// para que el modulo se pueda importar tambien desde node (los tests).
export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

/** Compara '1.10.0' con '1.9.3' por numero, no por texto. Devuelve >0 si a es mayor. */
export function compareVersions (a, b) {
  const parts = (v) => String(v).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0)
  const [x, y] = [parts(a), parts(b)]
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0)
    if (d) return d
  }
  return 0
}

/**
 * Consulta la ultima release publicada.
 * @returns {Promise<{version, url, notes} | null>} null si no hay nada mas nuevo.
 */
export async function fetchLatestRelease () {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(API, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    })
    if (!res.ok) throw new Error(`GitHub respondio ${res.status}`)
    const data = await res.json()
    const version = String(data.tag_name || '').replace(/^v/, '')
    if (!version) return null
    return { version, url: data.html_url || RELEASES_URL, notes: data.body || '' }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Comprobacion de fondo al abrir la app.
 * @param settings ajustes reactivos (se anota ahi la fecha del ultimo intento)
 * @param {boolean} force ignora el limite de una vez al dia (boton manual)
 */
export async function checkForUpdate (settings, { force = false } = {}) {
  if (!force) {
    if (!settings.updateCheck) return null
    const last = Number(settings.lastUpdateCheck) || 0
    if (Date.now() - last < CHECK_EVERY_MS) return null
  }

  let release
  try {
    release = await fetchLatestRelease()
  } catch {
    // Sin cobertura, en modo avion o con GitHub caido no se molesta al usuario:
    // esto es un extra, no algo que la app necesite para funcionar.
    return null
  }

  // Solo se anota cuando la consulta ha salido bien, para reintentar manana
  // si hoy no habia red.
  settings.lastUpdateCheck = Date.now()
  if (!release) return null
  if (compareVersions(release.version, APP_VERSION) <= 0) return null
  if (!force && settings.skippedVersion === release.version) return null
  return release
}

/** Abre la pagina de descarga en el navegador del sistema, fuera de la app. */
export function openDownloadPage (url = RELEASES_URL) {
  if (Capacitor.isNativePlatform()) window.open(url, '_blank')
  else window.open(url, '_blank', 'noopener,noreferrer')
}
