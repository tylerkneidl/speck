import type { Options } from 'roughjs/bin/core'
import type { NotebookColors } from './colors'

/**
 * Sizes a canvas's backing store to its CSS box at the device pixel ratio, and returns a context
 * that draws in CSS pixels.
 */
export function fitCanvas(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1
  const { width, height } = canvas.getBoundingClientRect()
  const w = Math.round(width * dpr)
  const h = Math.round(height * dpr)
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, width, height, dpr }
}

/**
 * Draws something once into an offscreen canvas, to blit every frame instead of redrawing it.
 * Callers rebuild it when the size or theme changes.
 */
export function createLayer(
  width: number,
  height: number,
  dpr: number,
  draw: (ctx: CanvasRenderingContext2D, layer: HTMLCanvasElement) => void,
): HTMLCanvasElement {
  const layer = document.createElement('canvas')
  layer.width = Math.round(width * dpr)
  layer.height = Math.round(height * dpr)
  const ctx = layer.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  draw(ctx, layer)
  return layer
}

/**
 * Rough.js options for a neat pen stroke. A fixed seed makes a shape draw the same wobble every
 * frame, so moving sketches don't shimmer.
 */
export function pen(colors: NotebookColors, seed: number, extra: Options = {}): Options {
  return { roughness: 0.7, bowing: 0.6, seed, stroke: colors.ink, strokeWidth: 1.6, ...extra }
}
