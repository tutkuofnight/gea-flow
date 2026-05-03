import { Component, Store } from '@geajs/core'
import { mount, createDisposer } from '@geajs/core/compiler-runtime'
import { getBezierPath, Position } from '@xyflow/system'
import type { FlowStore } from '../store/FlowStore'
import type { EdgeTypes, GeaEdge, GeaNode, HandleEntry, NodeHandleBounds } from '../types'
import ConnectionLine from './ConnectionLine'
import EdgeWrapper from './EdgeWrapper'

interface EdgeRendererProps {
  flowStore: FlowStore
  edgeTypes: EdgeTypes
}

const DEFAULT_W = 150
const DEFAULT_H = 40
const SVG_NS = 'http://www.w3.org/2000/svg'

function pickHandle(
  list: HandleEntry[] | null | undefined,
  handleId: string | null | undefined,
): HandleEntry | undefined {
  if (!list || list.length === 0) return undefined
  if (handleId == null) return list[0]
  return list.find((h) => h.id === handleId) ?? list[0]
}

function endpointFor(
  node: GeaNode,
  bounds: NodeHandleBounds | undefined,
  side: 'source' | 'target',
  handleId: string | null | undefined,
  fallbackPosition: Position,
): { x: number; y: number; position: Position } {
  const w = node.measured?.width ?? DEFAULT_W
  const h = node.measured?.height ?? DEFAULT_H
  const handle = pickHandle(side === 'source' ? bounds?.source : bounds?.target, handleId)
  if (handle) {
    return {
      x: node.position.x + handle.x + handle.width / 2,
      y: node.position.y + handle.y + handle.height / 2,
      position: handle.position,
    }
  }
  if (fallbackPosition === Position.Bottom) {
    return { x: node.position.x + w / 2, y: node.position.y + h, position: Position.Bottom }
  }
  if (fallbackPosition === Position.Top) {
    return { x: node.position.x + w / 2, y: node.position.y, position: Position.Top }
  }
  if (fallbackPosition === Position.Right) {
    return { x: node.position.x + w, y: node.position.y + h / 2, position: Position.Right }
  }
  return { x: node.position.x, y: node.position.y + h / 2, position: Position.Left }
}

interface EdgeGeometry {
  edge: GeaEdge
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  defaultPath: string
  labelX: number
  labelY: number
}

/**
 * Reactive geometry slot. We mutate fields on this Store between ticks; the
 * EdgeWrapper child reads them through prop thunks, and Gea's proxy observers
 * patch the path/label DOM automatically when any field changes.
 *
 * `edge` is intentionally not a Store field — Gea's SET trap unwraps proxies
 * when assigning to a Store, which would strip our reactive GeaEdge.
 */
class EdgeGeomBox extends Store {
  sourceX = 0
  sourceY = 0
  targetX = 0
  targetY = 0
  sourcePosition: Position = Position.Bottom
  targetPosition: Position = Position.Top
  defaultPath = ''
  labelX = 0
  labelY = 0
}

function computeEdgeGeometries(flowStore: FlowStore): EdgeGeometry[] {
  const lookup = new Map(flowStore.nodes.map((n) => [n.id, n]))
  const out: EdgeGeometry[] = []
  for (const edge of flowStore.edges) {
    const source = lookup.get(edge.source)
    const target = lookup.get(edge.target)
    if (!source || !target) continue
    const s = endpointFor(source, flowStore.handleBoundsByNode[source.id], 'source', edge.sourceHandle, Position.Bottom)
    const t = endpointFor(target, flowStore.handleBoundsByNode[target.id], 'target', edge.targetHandle, Position.Top)
    const [d, lx, ly] = getBezierPath({
      sourceX: s.x, sourceY: s.y, sourcePosition: s.position,
      targetX: t.x, targetY: t.y, targetPosition: t.position,
    })
    out.push({
      edge, sourceX: s.x, sourceY: s.y, targetX: t.x, targetY: t.y,
      sourcePosition: s.position, targetPosition: t.position,
      defaultPath: d, labelX: lx, labelY: ly,
    })
  }
  return out
}

interface EdgeMount {
  gEl: SVGGElement
  disposer: { dispose: () => void }
  /** Reactive geometry slot (mutated each tick by parent observer). */
  geom: EdgeGeomBox
  /** Latest edge ref; swapped by the parent and read by the child via thunk. */
  edgeRef: { current: GeaEdge }
}

/**
 * Edge rendering bypasses Gea's keyedList iteration because that produces
 * <span style="display:contents"> wrappers that break SVG rendering (children
 * stay in the SVG namespace but get a 0×0 bbox). We manage children of a single
 * <g> imperatively, mounting one EdgeWrapper per edge into pre-created SVG <g>s.
 */
export default class EdgeRenderer extends Component<EdgeRendererProps> {
  edgesContainer: SVGGElement | null = null
  mounted = new Map<string, EdgeMount>()
  observerRemovers: Array<() => void> = []

  template() {
    return (
      <svg class="gea-flow__edges" width="100%" height="100%">
        <g ref={this.edgesContainer as never} />
        <ConnectionLine flowStore={this.props.flowStore} />
      </svg>
    )
  }

  onAfterRender(): void {
    if (!this.edgesContainer) return
    this.update()
    const fs = this.props.flowStore
    const trigger = () => this.update()
    this.observerRemovers.push(
      fs._d.observe('edges', trigger),
      fs._d.observe('nodes', trigger),
      fs._d.observe('handleBoundsByNode', trigger),
    )
  }

  update(): void {
    if (!this.edgesContainer) return
    const fs = this.props.flowStore
    const geometries = computeEdgeGeometries(fs)
    const seen = new Set<string>()

    for (const geom of geometries) {
      seen.add(geom.edge.id)
      const existing = this.mounted.get(geom.edge.id)
      if (existing) {
        // Hot-swap fields on the reactive box. Each assignment fires a Store
        // SET, which patches the bound DOM in EdgeWrapper.
        existing.edgeRef.current = geom.edge
        const b = existing.geom
        if (b.sourceX !== geom.sourceX) b.sourceX = geom.sourceX
        if (b.sourceY !== geom.sourceY) b.sourceY = geom.sourceY
        if (b.targetX !== geom.targetX) b.targetX = geom.targetX
        if (b.targetY !== geom.targetY) b.targetY = geom.targetY
        if (b.sourcePosition !== geom.sourcePosition) b.sourcePosition = geom.sourcePosition
        if (b.targetPosition !== geom.targetPosition) b.targetPosition = geom.targetPosition
        if (b.defaultPath !== geom.defaultPath) b.defaultPath = geom.defaultPath
        if (b.labelX !== geom.labelX) b.labelX = geom.labelX
        if (b.labelY !== geom.labelY) b.labelY = geom.labelY
      } else {
        const gEl = document.createElementNS(SVG_NS, 'g') as SVGGElement
        this.edgesContainer.appendChild(gEl)
        const disposer = createDisposer()
        const box = new EdgeGeomBox()
        box.sourceX = geom.sourceX
        box.sourceY = geom.sourceY
        box.targetX = geom.targetX
        box.targetY = geom.targetY
        box.sourcePosition = geom.sourcePosition
        box.targetPosition = geom.targetPosition
        box.defaultPath = geom.defaultPath
        box.labelX = geom.labelX
        box.labelY = geom.labelY
        const edgeRef = { current: geom.edge }
        mount(
          EdgeWrapper as never,
          gEl,
          {
            edge: () => edgeRef.current,
            flowStore: () => fs,
            edgeTypes: () => this.props.edgeTypes,
            sourceX: () => box.sourceX,
            sourceY: () => box.sourceY,
            targetX: () => box.targetX,
            targetY: () => box.targetY,
            sourcePosition: () => box.sourcePosition,
            targetPosition: () => box.targetPosition,
            defaultPath: () => box.defaultPath,
            labelX: () => box.labelX,
            labelY: () => box.labelY,
          },
          disposer,
          undefined as never,
          this as never,
        )
        this.mounted.set(geom.edge.id, { gEl, disposer, geom: box, edgeRef })
      }
    }

    for (const [id, entry] of this.mounted) {
      if (!seen.has(id)) {
        entry.disposer.dispose()
        entry.gEl.remove()
        this.mounted.delete(id)
      }
    }
  }

  dispose(): void {
    for (const remove of this.observerRemovers) remove()
    this.observerRemovers = []
    for (const entry of this.mounted.values()) {
      entry.disposer.dispose()
      entry.gEl.remove()
    }
    this.mounted.clear()
    super.dispose()
  }
}
