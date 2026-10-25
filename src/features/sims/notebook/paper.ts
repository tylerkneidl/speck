import type { NotebookColors } from './colors'

/** Graph-paper grid: thin lines every `cell` px, heavier every `majorEvery` cells. */
export function drawGraphPaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: NotebookColors,
  cell = 20,
  majorEvery = 5,
) {
  ctx.fillStyle = colors.page
  ctx.fillRect(0, 0, width, height)
  ctx.lineWidth = 1
  for (let i = 0; i * cell <= width; i++) line(ctx, i * cell + 0.5, 0, i * cell + 0.5, height, i)
  for (let j = 0; j * cell <= height; j++) line(ctx, 0, j * cell + 0.5, width, j * cell + 0.5, j)

  function line(
    c: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    i: number,
  ) {
    c.strokeStyle = i % majorEvery === 0 ? colors.gridMajor : colors.gridMinor
    c.beginPath()
    c.moveTo(x0, y0)
    c.lineTo(x1, y1)
    c.stroke()
  }
}

/** CSS background for a notebook page element, matching drawGraphPaper's minor grid. */
export function paperBackground(colors: NotebookColors, cell = 20) {
  return {
    backgroundColor: colors.page,
    backgroundImage: `linear-gradient(${colors.gridMinor} 1px, transparent 1px), linear-gradient(90deg, ${colors.gridMinor} 1px, transparent 1px)`,
    backgroundSize: `${cell}px ${cell}px`,
  }
}
