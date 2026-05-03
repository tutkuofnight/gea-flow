import { Store } from '@geajs/core'
import { getNodesBounds, getViewportForBounds, type PanZoomInstance, type Transform } from '@xyflow/system'
import {
  noConnection,
  type ConnectionDragState,
  type Connection,
  type FlowCallbacks,
  type GeaEdge,
  type GeaNode,
  type HandleEntry,
  type NodeHandleBounds,
  type SelectionSummary,
  type XYPosition,
} from '../types'

export interface NodeDimensions {
  id: string
  width: number
  height: number
}

export interface FlowStoreInit {
  nodes?: GeaNode[]
  edges?: GeaEdge[]
  minZoom?: number
  maxZoom?: number
  defaultViewport?: { x: number; y: number; zoom: number }
}

/**
 * Internal reactive state container. Extends Gea's Store so that all property
 * mutations fire reactivity. NEVER expose this directly — it must be wrapped
 * in FlowStore so users can store FlowStore on other Store instances without
 * triggering Gea's "proxy unwrap on Store SET" behavior.
 */
/** Selection box (lasso) drag state, in world coordinates. */
export interface LassoState {
  active: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
}

const idleLasso: LassoState = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 }

class FlowStoreData extends Store {
  nodes: GeaNode[] = []
  edges: GeaEdge[] = []
  transform: Transform = [0, 0, 1]
  width = 0
  height = 0
  minZoom = 0.5
  maxZoom = 2
  nodesDraggable = true
  panOnDrag = true
  zoomOnScroll = true
  zoomOnPinch = true
  zoomOnDoubleClick = true
  handleBoundsByNode: Record<string, NodeHandleBounds> = {}
  connection: ConnectionDragState = { ...noConnection }
  paneEl: HTMLDivElement | null = null
  lasso: LassoState = { ...idleLasso }
  // Drag config (mirrors XYDrag store-items expectations)
  snapGrid: [number, number] = [15, 15]
  snapToGrid = false
  autoPanOnNodeDrag = true
  selectNodesOnDrag = true
  nodeDragThreshold = 1
}

let flowIdCounter = 0

/**
 * Public flow store. Plain class (NOT extending Store) so it can be safely
 * assigned as a property of another Store-derived class without losing
 * reactivity. All reactive state lives on the inner `_d: FlowStoreData`.
 */
export class FlowStore {
  /** @internal */
  readonly _d: FlowStoreData
  readonly id: string

  constructor(init?: FlowStoreInit) {
    this._d = new FlowStoreData()
    this.id = `gea-flow-${++flowIdCounter}`
    if (init?.nodes) this._d.nodes = init.nodes
    if (init?.edges) this._d.edges = init.edges
    if (init?.minZoom != null) this._d.minZoom = init.minZoom
    if (init?.maxZoom != null) this._d.maxZoom = init.maxZoom
    if (init?.defaultViewport) {
      const { x, y, zoom } = init.defaultViewport
      this._d.transform = [x, y, zoom]
    }
  }

  // --- forwarding accessors so users keep `store.nodes`, `store.transform`, etc. ---

  get nodes(): GeaNode[] { return this._d.nodes }
  set nodes(v: GeaNode[]) { this._d.nodes = v }

  get edges(): GeaEdge[] { return this._d.edges }
  set edges(v: GeaEdge[]) { this._d.edges = v }

  get transform(): Transform { return this._d.transform }
  set transform(v: Transform) { this._d.transform = v }

  get width(): number { return this._d.width }
  set width(v: number) { this._d.width = v }

  get height(): number { return this._d.height }
  set height(v: number) { this._d.height = v }

  get minZoom(): number { return this._d.minZoom }
  set minZoom(v: number) { this._d.minZoom = v }

  get maxZoom(): number { return this._d.maxZoom }
  set maxZoom(v: number) { this._d.maxZoom = v }

  get nodesDraggable(): boolean { return this._d.nodesDraggable }
  set nodesDraggable(v: boolean) { this._d.nodesDraggable = v }

  get panOnDrag(): boolean { return this._d.panOnDrag }
  set panOnDrag(v: boolean) { this._d.panOnDrag = v }

  get zoomOnScroll(): boolean { return this._d.zoomOnScroll }
  set zoomOnScroll(v: boolean) { this._d.zoomOnScroll = v }

  get zoomOnPinch(): boolean { return this._d.zoomOnPinch }
  set zoomOnPinch(v: boolean) { this._d.zoomOnPinch = v }

  get zoomOnDoubleClick(): boolean { return this._d.zoomOnDoubleClick }
  set zoomOnDoubleClick(v: boolean) { this._d.zoomOnDoubleClick = v }

  get snapGrid(): [number, number] { return this._d.snapGrid }
  set snapGrid(v: [number, number]) { this._d.snapGrid = v }
  get snapToGrid(): boolean { return this._d.snapToGrid }
  set snapToGrid(v: boolean) { this._d.snapToGrid = v }
  get autoPanOnNodeDrag(): boolean { return this._d.autoPanOnNodeDrag }
  set autoPanOnNodeDrag(v: boolean) { this._d.autoPanOnNodeDrag = v }
  get selectNodesOnDrag(): boolean { return this._d.selectNodesOnDrag }
  set selectNodesOnDrag(v: boolean) { this._d.selectNodesOnDrag = v }
  get nodeDragThreshold(): number { return this._d.nodeDragThreshold }
  set nodeDragThreshold(v: number) { this._d.nodeDragThreshold = v }

  get handleBoundsByNode(): Record<string, NodeHandleBounds> { return this._d.handleBoundsByNode }
  get connection(): ConnectionDragState { return this._d.connection }
  get paneEl(): HTMLDivElement | null { return this._d.paneEl }
  set paneEl(v: HTMLDivElement | null) { this._d.paneEl = v }

  get lasso(): LassoState { return this._d.lasso }

  setLasso(next: Partial<LassoState>): void {
    this._d.lasso = { ...this._d.lasso, ...next }
  }
  resetLasso(): void {
    this._d.lasso = { ...idleLasso }
  }

  /** Set by GeaFlow on mount; gives Controls access to pan/zoom helpers. */
  panZoom: PanZoomInstance | null = null

  /** Flow-level callbacks; populated by GeaFlow from its props. */
  callbacks: FlowCallbacks = {}

  /** Track previous selection signature so we can deduplicate onSelectionChange. */
  private _lastSelectionKey = ''

  private fireSelectionChange(): void {
    const cb = this.callbacks.onSelectionChange
    if (!cb) return
    const selectedNodes = this._d.nodes.filter((n) => n.selected)
    const selectedEdges = this._d.edges.filter((e) => e.selected)
    const key = `${selectedNodes.map((n) => n.id).join(',')}|${selectedEdges.map((e) => e.id).join(',')}`
    if (key === this._lastSelectionKey) return
    this._lastSelectionKey = key
    const summary: SelectionSummary = { nodes: selectedNodes, edges: selectedEdges }
    cb(summary)
  }

  private _edgeIdCounter = 0

  /** Add a connection (creating an edge with auto-id) and fire onConnect. */
  connect(connection: Connection): GeaEdge {
    const id = `e-${connection.source}-${connection.target}-${++this._edgeIdCounter}`
    const edge: GeaEdge = { id, ...connection }
    this._d.edges.push(edge)
    this.callbacks.onConnect?.(connection)
    return edge
  }

  zoomIn(factor = 1.2): void {
    this.panZoom?.scaleBy(factor)
  }
  zoomOut(factor = 1.2): void {
    this.panZoom?.scaleBy(1 / factor)
  }
  setViewport(viewport: { x: number; y: number; zoom: number }): void {
    this.panZoom?.setViewport(viewport)
  }
  fitView(opts: { padding?: number; minZoom?: number; maxZoom?: number } = {}): void {
    if (!this.panZoom) return
    if (this._d.nodes.length === 0) return
    const padding = opts.padding ?? 0.1
    const bounds = getNodesBounds(this._d.nodes)
    const width = this._d.width || 800
    const height = this._d.height || 600
    const viewport = getViewportForBounds(
      bounds,
      width,
      height,
      opts.minZoom ?? this._d.minZoom,
      opts.maxZoom ?? this._d.maxZoom,
      padding,
    )
    this.panZoom.setViewport(viewport)
  }

  // --- mutations ---

  setNodes(nodes: GeaNode[]): void {
    this._d.nodes = nodes
  }

  addNodes(nodes: GeaNode[]): void {
    for (const n of nodes) this._d.nodes.push(n)
  }

  setEdges(edges: GeaEdge[]): void {
    this._d.edges = edges
  }

  addEdges(edges: GeaEdge[]): void {
    for (const e of edges) this._d.edges.push(e)
  }

  updateNodePosition(id: string, position: XYPosition): void {
    const idx = this._d.nodes.findIndex((n) => n.id === id)
    if (idx === -1) return
    const prev = this._d.nodes[idx]
    this._d.nodes[idx] = { ...prev, position: { x: position.x, y: position.y } }
  }

  /**
   * Set the `dragging` flag on the given nodes. Other nodes are untouched.
   * Custom node components can read `props.dragging` to render drag-time UI.
   */
  setNodesDragging(ids: Iterable<string>, dragging: boolean): void {
    const idSet = ids instanceof Set ? ids : new Set(ids)
    for (let i = 0; i < this._d.nodes.length; i++) {
      const n = this._d.nodes[i]
      if (!idSet.has(n.id)) continue
      if (!!n.dragging === dragging) continue
      this._d.nodes[i] = { ...n, dragging }
    }
  }

  updateNodeDimensions(updates: NodeDimensions[]): void {
    for (const { id, width, height } of updates) {
      const node = this.findNode(id)
      if (!node) continue
      const current = node.measured
      if (current && current.width === width && current.height === height) continue
      node.measured = { width, height }
    }
  }

  findNode(id: string): GeaNode | undefined {
    return this._d.nodes.find((n) => n.id === id)
  }

  // --- selection ---

  selectNode(id: string, opts: { multi?: boolean } = {}): void {
    const idx = this._d.nodes.findIndex((n) => n.id === id)
    if (idx === -1) return
    if (opts.multi) {
      const cur = this._d.nodes[idx]
      this._d.nodes[idx] = { ...cur, selected: !cur.selected }
    } else {
      for (let i = 0; i < this._d.nodes.length; i++) {
        const n = this._d.nodes[i]
        const shouldBe = i === idx
        if (!!n.selected !== shouldBe) {
          this._d.nodes[i] = { ...n, selected: shouldBe }
        }
      }
      for (let i = 0; i < this._d.edges.length; i++) {
        const e = this._d.edges[i]
        if (e.selected) this._d.edges[i] = { ...e, selected: false }
      }
    }
    this.fireSelectionChange()
  }

  selectEdge(id: string, opts: { multi?: boolean } = {}): void {
    const idx = this._d.edges.findIndex((e) => e.id === id)
    if (idx === -1) return
    if (opts.multi) {
      const cur = this._d.edges[idx]
      this._d.edges[idx] = { ...cur, selected: !cur.selected }
    } else {
      for (let i = 0; i < this._d.edges.length; i++) {
        const e = this._d.edges[i]
        const shouldBe = i === idx
        if (!!e.selected !== shouldBe) {
          this._d.edges[i] = { ...e, selected: shouldBe }
        }
      }
      for (let i = 0; i < this._d.nodes.length; i++) {
        const n = this._d.nodes[i]
        if (n.selected) this._d.nodes[i] = { ...n, selected: false }
      }
    }
    this.fireSelectionChange()
  }

  clearSelection(): void {
    for (let i = 0; i < this._d.nodes.length; i++) {
      const n = this._d.nodes[i]
      if (n.selected) this._d.nodes[i] = { ...n, selected: false }
    }
    for (let i = 0; i < this._d.edges.length; i++) {
      const e = this._d.edges[i]
      if (e.selected) this._d.edges[i] = { ...e, selected: false }
    }
    this.fireSelectionChange()
  }

  /** Select every node (Cmd/Ctrl+A). Edges are left untouched. */
  selectAllNodes(): void {
    let changed = 0
    for (let i = 0; i < this._d.nodes.length; i++) {
      const n = this._d.nodes[i]
      if (!n.selected) {
        this._d.nodes[i] = { ...n, selected: true }
        changed++
      }
    }
    if (changed > 0) this.fireSelectionChange()
  }

  /**
   * Select all nodes whose bounding rect intersects the given world-space rect.
   * If `additive`, merges with current selection; otherwise replaces.
   */
  selectInRect(
    rect: { x: number; y: number; width: number; height: number },
    opts: { additive?: boolean } = {},
  ): void {
    const additive = opts.additive ?? false
    let changed = 0
    for (let i = 0; i < this._d.nodes.length; i++) {
      const n = this._d.nodes[i]
      const w = n.measured?.width ?? 150
      const h = n.measured?.height ?? 40
      const intersects =
        n.position.x < rect.x + rect.width &&
        n.position.x + w > rect.x &&
        n.position.y < rect.y + rect.height &&
        n.position.y + h > rect.y
      const shouldBe = intersects ? true : additive ? !!n.selected : false
      if (!!n.selected !== shouldBe) {
        this._d.nodes[i] = { ...n, selected: shouldBe }
        changed++
      }
    }
    if (!additive) {
      for (let i = 0; i < this._d.edges.length; i++) {
        const e = this._d.edges[i]
        if (e.selected) {
          this._d.edges[i] = { ...e, selected: false }
          changed++
        }
      }
    }
    if (changed > 0) this.fireSelectionChange()
  }

  deleteSelected(): { nodes: GeaNode[]; edges: GeaEdge[] } {
    const removedNodes = this._d.nodes.filter((n) => n.selected)
    const removedNodeIds = new Set(removedNodes.map((n) => n.id))
    const remainingNodes = this._d.nodes.filter((n) => !n.selected)
    const removedEdges = this._d.edges.filter(
      (e) => e.selected || removedNodeIds.has(e.source) || removedNodeIds.has(e.target),
    )
    const remainingEdges = this._d.edges.filter(
      (e) => !e.selected && !removedNodeIds.has(e.source) && !removedNodeIds.has(e.target),
    )

    if (removedNodes.length) this._d.nodes = remainingNodes
    if (removedEdges.length) this._d.edges = remainingEdges
    if (removedNodes.length || removedEdges.length) this.fireSelectionChange()
    return { nodes: removedNodes, edges: removedEdges }
  }

  // --- handle registry ---

  registerHandle(nodeId: string, entry: HandleEntry): void {
    const current = this._d.handleBoundsByNode[nodeId] ?? { source: null, target: null }
    const list = current[entry.type] ?? []
    const filtered = list.filter((h) => h.id !== entry.id)
    filtered.push(entry)
    this._d.handleBoundsByNode = {
      ...this._d.handleBoundsByNode,
      [nodeId]: { ...current, [entry.type]: filtered },
    }
  }

  unregisterHandle(nodeId: string, handleId: string | null, type: HandleEntry['type']): void {
    const current = this._d.handleBoundsByNode[nodeId]
    if (!current) return
    const list = current[type]
    if (!list) return
    const next = list.filter((h) => h.id !== handleId)
    const nextNodeBounds: NodeHandleBounds = {
      ...current,
      [type]: next.length ? next : null,
    }
    if (!nextNodeBounds.source && !nextNodeBounds.target) {
      const { [nodeId]: _drop, ...rest } = this._d.handleBoundsByNode
      this._d.handleBoundsByNode = rest
    } else {
      this._d.handleBoundsByNode = { ...this._d.handleBoundsByNode, [nodeId]: nextNodeBounds }
    }
  }

  // --- connection state ---

  setConnection(next: Partial<ConnectionDragState>): void {
    this._d.connection = { ...this._d.connection, ...next }
  }

  resetConnection(): void {
    this._d.connection = { ...noConnection }
  }
}

/** Factory for power-mode users who want to keep an explicit reference to the store. */
export function createFlowStore(init?: FlowStoreInit): FlowStore {
  return new FlowStore(init)
}
