import { state } from '@/store/useStore'
import { lightMode } from './palette'

const media = window.matchMedia('(prefers-color-scheme: light)')

export const isLight = () => {
  const pref = state.settings.theme
  return pref === 'light' || (pref === 'auto' && media.matches)
}

export { lightMode }

export function applyTheme () {
  const light = isLight()
  lightMode.value = light
  document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark')
  document.documentElement.style.colorScheme = light ? 'light' : 'dark'
}

/** Colores vivos del tema, leidos del CSS para no duplicar la paleta en JS. */
export function themeColors () {
  const css = getComputedStyle(document.documentElement)
  const v = (name, fallback) => (css.getPropertyValue(name) || fallback).trim()
  return {
    text: v('--gb-text', '#eef2ff'),
    dim: v('--gb-text-dim', '#a3aec9'),
    faint: v('--gb-text-faint', '#6b7896'),
    line: v('--gb-line', 'rgba(255,255,255,.08)'),
    surface: v('--gb-surface', '#171e35'),
    tooltipBg: v('--gb-surface-2', '#1e2742'),
    income: v('--gb-income', '#34d399'),
    expense: v('--gb-expense', '#fb7185'),
    accent: v('--gb-accent', '#818cf8')
  }
}

export const onSystemThemeChange = (fn) => {
  media.addEventListener('change', fn)
  return () => media.removeEventListener('change', fn)
}
