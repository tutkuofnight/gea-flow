import { Component } from '@geajs/core'
import { XYMinimap, getNodesBounds, infiniteExtent } from '@xyflow/system'
import { findFlowStoreForElement } from './GeaFlow'
import type { FlowStore } from '../store/FlowStore'
import type { GeaNode } from '../types'

interface MiniMapProps {
  width?: number
  height?: number
  nodeColor?: string | ((node: GeaNode) => string)
  maskColor?: string
  pannable?: boolean
  zoomable?: boolean
}

const DEFAULT_W = 150
const DEFAULT_H = 40
const PADDING = 50
const SVG_NS = 'http://www.w3.org/2000/svg'

export default class MiniMap extends Component<MiniMapProps> {
  rootEl: SVGSVGElement | null = null
  rectsLayer: SVGGElement | null = null
  maskEl: SVGPathElement | null = null
  flowStore: FlowStore | null = null
  minimap: ReturnType<typeof XYMinimap> | null = null
  observerRemovers: Array<() => void> = []
  rectByNodeId = new Map<string, SVGRectElement>()

  template() {
    const width = this.props.width ?? 200
    const height = this.props.height ?? 150
    return (
      <svg
        ref={this.rootEl as never}
        class="gea-flow__minimap nopan nodrag"
        width={width}
        height={height}
      >
        <path ref={this.maskEl as never} class="gea-flow__minimap-mask" pointer-events="none" />
        <g ref={this.rectsLayer as never} />
      </svg>
    )
  }

  onAfterRender(): void {
    queueMicrotask(() => {
      if (!this.rootEl) return
      this.flowStore = findFlowStoreForElement(this.rootEl)
      if (!this.flowStore) return
      // GeaFlow may not have wired panZoom yet (sibling onAfterRender ordering).
      // Try once; if missing, observe `paneEl` (which is set right before
      // panZoom in GeaFlow) and retry.
      if (this.flowStore.panZoom) {
        this.bind()
      } else {
        const remove = this.flowStore._d.observe('paneEl', () => {
          if (this.flowStore?.panZoom && !this.minimap) {
            this.bind()
            remove()
          }
        })
        this.observerRemovers.push(remove)
        // Best-effort: retry once on the next frame too.
        requestAnimationFrame(() => {
          if (this.flowStore?.panZoom && !this.minimap) this.bind()
        })
      }
    })
  }

  bind(): void {
    if (!this.rootEl || !this.flowStore?.panZoom) return

    this.minimap = XYMinimap({
      domNode: this.rootEl as unknown as HTMLDivElement,
      panZoom: this.flowStore.panZoom,
      getTransform: () => this.flowStore!.transform,
      getViewScale: () => {
        const t = this.flowStore!.transform
        const paneW = this.flowStore!.width || 1
        const visibleWorldWidth = paneW / t[2]
        const minimapPx = this.props.width ?? 200
        return visibleWorldWidth / minimapPx
      },
    })
    this.applyMinimapUpdate()
    this.redraw()

    const fs = this.flowStore
    const trigger = () => {
      this.applyMinimapUpdate()
      this.redraw()
    }
    this.observerRemovers.push(
      fs._d.observe('width', trigger),
      fs._d.observe('height', trigger),
      fs._d.observe('nodes', trigger),
      fs._d.observe('transform', trigger),
    )
  }

  /**
   * Imperative SVG management: nodes are rendered as <rect>s inside a single
   * <g>, bypassing keyedList's HTML wrapper that breaks SVG bbox computation.
   */
  redraw(): void {
    if (!this.rootEl || !this.rectsLayer || !this.maskEl || !this.flowStore) return
    const fs = this.flowStore
    const nodes = fs.nodes
    const transform = fs.transform
    const paneW = fs.width
    const paneH = fs.height

    const nodeBounds = nodes.length
      ? getNodesBounds(nodes)
      : { x: 0, y: 0, width: 0, height: 0 }
    const viewBB = {
      x: -transform[0] / transform[2],
      y: -transform[1] / transform[2],
      width: paneW / transform[2],
      height: paneH / transform[2],
    }
    const minX = Math.min(nodeBounds.x, viewBB.x) - PADDING
    const minY = Math.min(nodeBounds.y, viewBB.y) - PADDING
    const maxX = Math.max(nodeBounds.x + nodeBounds.width, viewBB.x + viewBB.width) + PADDING
    const maxY = Math.max(nodeBounds.y + nodeBounds.height, viewBB.y + viewBB.height) + PADDING
    const bbWidth = maxX - minX
    const bbHeight = maxY - minY

    this.rootEl.setAttribute('viewBox', `${minX} ${minY} ${bbWidth} ${bbHeight}`)

    const maskColor = this.props.maskColor ?? 'rgba(240, 240, 240, 0.6)'
    this.maskEl.setAttribute(
      'd',
      `M${minX},${minY}h${bbWidth}v${bbHeight}h${-bbWidth}z M${viewBB.x},${viewBB.y}h${viewBB.width}v${viewBB.height}h${-viewBB.width}z`,
    )
    this.maskEl.setAttribute('fill', maskColor)
    this.maskEl.setAttribute('fill-rule', 'evenodd')

    const nodeColor = this.props.nodeColor ?? '#cbd5e1'
    const seen = new Set<string>()
    for (const n of nodes) {
      seen.add(n.id)
      let rect = this.rectByNodeId.get(n.id)
      if (!rect) {
        rect = document.createElementNS(SVG_NS, 'rect') as SVGRectElement
        rect.setAttribute('class', 'gea-flow__minimap-node')
        rect.setAttribute('stroke', 'transparent')
        rect.setAttribute('rx', '3')
        this.rectsLayer.appendChild(rect)
        this.rectByNodeId.set(n.id, rect)
      }
      rect.setAttribute('x', String(n.position.x))
      rect.setAttribute('y', String(n.position.y))
      rect.setAttribute('width', String(n.measured?.width ?? DEFAULT_W))
      rect.setAttribute('height', String(n.measured?.height ?? DEFAULT_H))
      rect.setAttribute('fill', typeof nodeColor === 'function' ? nodeColor(n) : nodeColor)
    }
    for (const [id, rect] of this.rectByNodeId) {
      if (!seen.has(id)) {
        rect.remove()
        this.rectByNodeId.delete(id)
      }
    }
  }

  applyMinimapUpdate(): void {
    if (!this.minimap || !this.flowStore) return
    this.minimap.update({
      translateExtent: infiniteExtent,
      width: this.flowStore.width,
      height: this.flowStore.height,
      pannable: this.props.pannable !== false,
      zoomable: this.props.zoomable !== false,
    })
  }

  dispose(): void {
    for (const remove of this.observerRemovers) remove()
    this.observerRemovers = []
    this.minimap?.destroy()
    this.rectByNodeId.clear()
    super.dispose()
  }
}
