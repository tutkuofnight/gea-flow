import { Component } from '@geajs/core'
import { findFlowStoreForElement } from './GeaFlow'
import type { FlowStore } from '../store/FlowStore'

export type BackgroundVariant = 'dots' | 'cross' | 'lines'

interface BackgroundProps {
  variant?: BackgroundVariant
  /** Spacing between pattern repetitions in world units. */
  gap?: number
  /** Pattern stroke/dot color. */
  color?: string
  /** Pattern stroke width or dot radius (world units, scales with zoom). */
  size?: number
}

const SVG_NS = 'http://www.w3.org/2000/svg'

let backgroundIdCounter = 0

/**
 * Renders a tiling pattern that follows the viewport's pan/zoom.
 * Place inside <GeaFlow>:
 *   <GeaFlow>
 *     <Background variant="dots" gap={20} />
 *   </GeaFlow>
 *
 * Uses imperative DOM updates against the `<pattern>` element rather than
 * Gea reactivity: the parent flow store is resolved post-render via DOM walk,
 * which puts our reactive bindings out of sync with template evaluation.
 */
export default class Background extends Component<BackgroundProps> {
  rootEl: SVGSVGElement | null = null
  patternEl: SVGPatternElement | null = null
  flowStore: FlowStore | null = null
  observerRemovers: Array<() => void> = []
  patternId = `gea-flow-bg-${++backgroundIdCounter}`

  template() {
    const variant = this.props.variant ?? 'dots'
    return (
      <svg
        ref={this.rootEl as never}
        class={`gea-flow__background gea-flow__background--${variant}`}
      >
        <pattern
          ref={this.patternEl as never}
          id={this.patternId}
          patternUnits="userSpaceOnUse"
        />
        <rect width="100%" height="100%" fill={`url(#${this.patternId})`} />
      </svg>
    )
  }

  onAfterRender(): void {
    if (!this.rootEl) return
    queueMicrotask(() => {
      if (!this.rootEl || !this.patternEl) return
      this.flowStore = findFlowStoreForElement(this.rootEl)
      if (!this.flowStore) return
      this.redraw()
      const fs = this.flowStore
      this.observerRemovers.push(fs._d.observe('transform', () => this.redraw()))
    })
  }

  redraw(): void {
    if (!this.patternEl || !this.flowStore) return
    const variant = this.props.variant ?? 'dots'
    const gap = this.props.gap ?? 20
    const color = this.props.color ?? '#d8d8d8'
    const size = this.props.size ?? 1
    const [tx, ty, zoom] = this.flowStore.transform
    const scaledGap = gap * zoom
    const scaledSize = size * zoom

    this.patternEl.setAttribute('x', String(tx))
    this.patternEl.setAttribute('y', String(ty))
    this.patternEl.setAttribute('width', String(scaledGap))
    this.patternEl.setAttribute('height', String(scaledGap))

    while (this.patternEl.firstChild) this.patternEl.removeChild(this.patternEl.firstChild)
    if (variant === 'dots') {
      const c = document.createElementNS(SVG_NS, 'circle')
      c.setAttribute('cx', String(scaledGap / 2))
      c.setAttribute('cy', String(scaledGap / 2))
      c.setAttribute('r', String(scaledSize))
      c.setAttribute('fill', color)
      this.patternEl.appendChild(c)
    } else if (variant === 'cross') {
      const path = document.createElementNS(SVG_NS, 'path')
      const half = scaledGap / 2
      const arm = 4 * zoom
      path.setAttribute(
        'd',
        `M ${half - arm},${half} l ${arm * 2},0 M ${half},${half - arm} l 0,${arm * 2}`,
      )
      path.setAttribute('stroke', color)
      path.setAttribute('stroke-width', String(scaledSize))
      this.patternEl.appendChild(path)
    } else if (variant === 'lines') {
      const path = document.createElementNS(SVG_NS, 'path')
      path.setAttribute(
        'd',
        `M 0,${scaledGap} L ${scaledGap},${scaledGap} M ${scaledGap},0 L ${scaledGap},${scaledGap}`,
      )
      path.setAttribute('stroke', color)
      path.setAttribute('stroke-width', String(scaledSize))
      path.setAttribute('fill', 'none')
      this.patternEl.appendChild(path)
    }
  }

  dispose(): void {
    for (const remove of this.observerRemovers) remove()
    this.observerRemovers = []
    super.dispose()
  }
}
