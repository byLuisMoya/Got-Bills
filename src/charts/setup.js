// Registro minimo de Chart.js: solo los controladores que la app usa, para no
// arrastrar al bundle de la APK las 30 piezas que no pintamos nunca.
import {
  Chart,
  ArcElement, DoughnutController,
  BarController, BarElement,
  LineController, LineElement, PointElement, Filler,
  CategoryScale, LinearScale, Tooltip
} from 'chart.js'

Chart.register(
  ArcElement, DoughnutController,
  BarController, BarElement,
  LineController, LineElement, PointElement, Filler,
  CategoryScale, LinearScale, Tooltip
)

Chart.defaults.font.family =
  "Roboto, system-ui, -apple-system, 'Segoe UI', sans-serif"
Chart.defaults.font.size = 11
Chart.defaults.animation.duration = 420
Chart.defaults.animation.easing = 'easeOutCubic'
Chart.defaults.maintainAspectRatio = false

export { Chart }

/** Tooltip comun: el color va en el cuadradito, nunca en el texto. */
export const tooltipStyle = (c) => ({
  enabled: true,
  backgroundColor: c.tooltipBg,
  borderColor: c.line,
  borderWidth: 1,
  titleColor: c.text,
  bodyColor: c.dim,
  titleFont: { weight: '600', size: 12 },
  bodyFont: { size: 12 },
  padding: 10,
  cornerRadius: 10,
  displayColors: true,
  boxWidth: 8,
  boxHeight: 8,
  boxPadding: 5,
  usePointStyle: true
})

/** Eje de valores discreto y recesivo: rejilla solida de 1px, nunca discontinua. */
export const valueAxis = (c, formatter) => ({
  border: { display: false },
  grid: { color: c.line, drawTicks: false, lineWidth: 1 },
  ticks: {
    color: c.faint,
    padding: 8,
    maxTicksLimit: 4,
    font: { size: 10 },
    callback: formatter
  }
})

export const categoryAxis = (c) => ({
  border: { display: false },
  grid: { display: false },
  ticks: { color: c.faint, font: { size: 10 }, padding: 6, maxRotation: 0, autoSkipPadding: 6 }
})
