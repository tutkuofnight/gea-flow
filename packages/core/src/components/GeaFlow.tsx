import { Component } from '@geajs/core'
import { XYPanZoom, infiniteExtent, type PanZoomInstance } from '@xyflow/system'
import { FlowStore } from '../store/FlowStore'
import type { Connection, EdgeTypes, GeaEdge, GeaNode, NodeTypes, SelectionSummary } from '../types'
import NodeRenderer from './NodeRenderer'
import EdgeRenderer from './EdgeRenderer'
import { BUILTIN_NODE_TYPES } from './builtin-node-types'
import { BUILTIN_EDGE_TYPES } from './builtin-edge-types'
import { validateTypeRegistry } from '../utils/validate-component'

interface GeaFlowProps {
  /** Power-mode: pass an externally-created store so you can mutate it from outside. */
  store?: FlowStore
  /** Easy-mode: initial nodes (used only when `store` is not provided). */
  nodes?: GeaNode[]
  /** Easy-mode: initial edges (used only when `store` is not provided). */
  edges?: GeaEdge[]
  /** Custom node renderers, keyed by `node.type`. Merged with built-ins. */
  nodeTypes?: NodeTypes
  /** Custom edge renderers, keyed by `edge.type`. Merged with built-ins. */
  edgeTypes?: EdgeTypes
  minZoom?: number
  maxZoom?: number
  defaultViewport?: { x: number; y: number; zoom: number }
  children?: any

  // --- Callbacks ---
  /** Fires once after mount; gives access to the underlying FlowStore. */
  onInit?: (store: FlowStore) => void
  /** Fires when the user creates an edge by dragging from a handle. */
  onConnect?: (connection: Connection) => void
  /** Fires when the nodes array changes (added, removed, moved, selected, etc.). */
  onNodesChange?: (nodes: GeaNode[]) => void
  /** Fires when the edges array changes. */
  onEdgesChange?: (edges: GeaEdge[]) => void
  /** Fires when the set of selected nodes/edges changes. */
  onSelectionChange?: (selection: SelectionSummary) => void
}

/**
 * Module-level registry: flow id → FlowStore. Populated synchronously in
 * `created()` so descendants can look up the store as soon as their elements
 * exist in the DOM (no microtask deferral required).
 */
const flowStoreRegistry = new Map<string, FlowStore>()

/**
 * Look up the FlowStore attached to the GeaFlow root element that contains `el`.
 * Used by descendants (e.g. <Handle/>) that don't receive the store via props.
 */
export function findFlowStoreForElement(el: Element | null | undefined): FlowStore | null {
  if (!el) return null
  const root = el.closest('.gea-flow') as HTMLElement | null
  if (!root) return null
  const id = root.dataset.flowId
  if (!id) return null
  return flowStoreRegistry.get(id) ?? null
}

export default class GeaFlow extends Component<GeaFlowProps> {
  // FlowStore is a plain class — safe to assign on a Component (Store) without unwrap.
  flowStore: FlowStore = new FlowStore()
  resolvedNodeTypes: NodeTypes = BUILTIN_NODE_TYPES
  resolvedEdgeTypes: EdgeTypes = BUILTIN_EDGE_TYPES
  containerEl: HTMLDivElement | null = null
  viewportEl: HTMLDivElement | null = null
  panZoom: PanZoomInstance | null = null
  resizeObserver: ResizeObserver | null = null
  observerRemovers: Array<() => void> = []
  /** Suppresses the synthetic click that follows a lasso pointerup. */
  suppressNextPaneClick = false

  created(props: GeaFlowProps): void {
    if (props.store) {
      this.flowStore = props.store
    } else {
      if (props.nodes) this.flowStore.setNodes(props.nodes)
      if (props.edges) this.flowStore.setEdges(props.edges)
    }
    if (props.nodeTypes) {
      validateTypeRegistry(props.nodeTypes, 'node', new Set(Object.keys(BUILTIN_NODE_TYPES)))
      this.resolvedNodeTypes = { ...BUILTIN_NODE_TYPES, ...props.nodeTypes }
    }
    if (props.edgeTypes) {
      validateTypeRegistry(props.edgeTypes, 'edge', new Set(Object.keys(BUILTIN_EDGE_TYPES)))
      this.resolvedEdgeTypes = { ...BUILTIN_EDGE_TYPES, ...props.edgeTypes }
    }
    this.flowStore.callbacks = {
      onConnect: props.onConnect,
      onNodesChange: props.onNodesChange,
      onEdgesChange: props.onEdgesChange,
      onSelectionChange: props.onSelectionChange,
    }
    if (props.minZoom != null) this.flowStore.minZoom = props.minZoom
    if (props.maxZoom != null) this.flowStore.maxZoom = props.maxZoom
    if (props.defaultViewport) {
      const { x, y, zoom } = props.defaultViewport
      this.flowStore.transform = [x, y, zoom]
    }
    // Register synchronously so descendants can resolve the store the moment
    // their elements are inserted into the DOM tree (no microtask race).
    flowStoreRegistry.set(this.flowStore.id, this.flowStore)
  }

  template({ children }: GeaFlowProps) {
    const lasso = this.flowStore.lasso
    const lassoMinX = Math.min(lasso.startX, lasso.currentX)
    const lassoMinY = Math.min(lasso.startY, lasso.currentY)
    const lassoW = Math.abs(lasso.currentX - lasso.startX)
    const lassoH = Math.abs(lasso.currentY - lasso.startY)
    return (
      <div
        ref={this.containerEl as never}
        class="gea-flow"
        data-flow-id={this.flowStore.id}
        tabIndex={0}
        click={this.onPaneClick}
        keydown={this.onKeyDown}
      >
        <div
          ref={this.viewportEl as never}
          class="gea-flow__viewport"
          style={{
            transform: `translate(${this.flowStore.transform[0]}px, ${this.flowStore.transform[1]}px) scale(${this.flowStore.transform[2]})`,
            transformOrigin: '0 0',
          }}
        >
          <EdgeRenderer flowStore={this.flowStore} edgeTypes={this.resolvedEdgeTypes} />
          <NodeRenderer flowStore={this.flowStore} nodeTypes={this.resolvedNodeTypes} />
          {lasso.active && (
            <div
              class="gea-flow__selection-box"
              style={{
                transform: `translate(${lassoMinX}px, ${lassoMinY}px)`,
                width: `${lassoW}px`,
                height: `${lassoH}px`,
              }}
            />
          )}
        </div>
        {children}
      </div>
    )
  }

  // Capture-phase pointerdown handler — runs BEFORE d3-zoom's listener so we can
  // hijack shift+drag for lasso selection without d3-zoom starting a pan.
  onCanvasPointerDownCapture = (e: PointerEvent) => {
    if (!e.shiftKey || e.button !== 0) return
    const t = e.target as HTMLElement | null
    if (!t) return
    if (t.closest('.gea-flow__node, .gea-flow__edge, .gea-flow__handle, .gea-flow__controls, .gea-flow__minimap, .nopan')) return
    e.stopPropagation()
    e.preventDefault()
    this.startLasso(e)
  }

  startLasso(e: PointerEvent): void {
    if (!this.containerEl) return
    const rect = this.containerEl.getBoundingClientRect()
    const [tx, ty, zoom] = this.flowStore.transform
    const worldX = (e.clientX - rect.left - tx) / zoom
    const worldY = (e.clientY - rect.top - ty) / zoom
    this.flowStore.setLasso({ active: true, startX: worldX, startY: worldY, currentX: worldX, currentY: worldY })
    document.addEventListener('pointermove', this.onLassoMove, true)
    document.addEventListener('pointerup', this.onLassoEnd, true)
    document.addEventListener('pointercancel', this.onLassoEnd, true)
  }

  onLassoMove = (e: PointerEvent) => {
    if (!this.flowStore.lasso.active || !this.containerEl) return
    const rect = this.containerEl.getBoundingClientRect()
    const [tx, ty, zoom] = this.flowStore.transform
    const worldX = (e.clientX - rect.left - tx) / zoom
    const worldY = (e.clientY - rect.top - ty) / zoom
    this.flowStore.setLasso({ currentX: worldX, currentY: worldY })
  }

  onLassoEnd = (_e: PointerEvent) => {
    document.removeEventListener('pointermove', this.onLassoMove, true)
    document.removeEventListener('pointerup', this.onLassoEnd, true)
    document.removeEventListener('pointercancel', this.onLassoEnd, true)
    const lasso = this.flowStore.lasso
    if (!lasso.active) return
    const minX = Math.min(lasso.startX, lasso.currentX)
    const minY = Math.min(lasso.startY, lasso.currentY)
    const w = Math.abs(lasso.currentX - lasso.startX)
    const h = Math.abs(lasso.currentY - lasso.startY)
    if (w >= 2 && h >= 2) {
      this.flowStore.selectInRect({ x: minX, y: minY, width: w, height: h })
      // Block the synthetic click that follows pointerup so the pane handler
      // doesn't immediately clearSelection().
      this.suppressNextPaneClick = true
    }
    this.flowStore.resetLasso()
  }

  onAfterRender(): void {
    if (!this.containerEl) return

    this.flowStore.paneEl = this.containerEl
    ;(this.containerEl as unknown as { __geaFlowStore: FlowStore }).__geaFlowStore = this.flowStore

    this.containerEl.addEventListener('pointerdown', this.onCanvasPointerDownCapture, true)

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.containerEl) return
      const { width, height } = this.containerEl.getBoundingClientRect()
      this.flowStore.width = width
      this.flowStore.height = height
    })
    this.resizeObserver.observe(this.containerEl)
    const initial = this.containerEl.getBoundingClientRect()
    this.flowStore.width = initial.width
    this.flowStore.height = initial.height

    const [tx, ty, tz] = this.flowStore.transform
    this.panZoom = this.flowStore.panZoom = XYPanZoom({
      domNode: this.containerEl,
      minZoom: this.flowStore.minZoom,
      maxZoom: this.flowStore.maxZoom,
      translateExtent: infiniteExtent,
      viewport: { x: tx, y: ty, zoom: tz },
      onDraggingChange: () => {},
    })

    // Subscribe to nodes/edges array mutations and forward to user callbacks.
    if (this.flowStore.callbacks.onNodesChange) {
      const remove = this.flowStore._d.observe('nodes', (nodes) => {
        this.flowStore.callbacks.onNodesChange?.(nodes as GeaNode[])
      })
      this.observerRemovers.push(remove)
    }
    if (this.flowStore.callbacks.onEdgesChange) {
      const remove = this.flowStore._d.observe('edges', (edges) => {
        this.flowStore.callbacks.onEdgesChange?.(edges as GeaEdge[])
      })
      this.observerRemovers.push(remove)
    }

    // Fire onInit once the store is fully wired.
    this.props.onInit?.(this.flowStore)

    this.panZoom.update({
      noWheelClassName: 'nowheel',
      noPanClassName: 'nopan',
      preventScrolling: true,
      panOnScroll: false,
      panOnDrag: this.flowStore.panOnDrag,
      panOnScrollMode: 'free' as never,
      panOnScrollSpeed: 0.5,
      userSelectionActive: false,
      zoomOnPinch: this.flowStore.zoomOnPinch,
      zoomOnScroll: this.flowStore.zoomOnScroll,
      zoomOnDoubleClick: this.flowStore.zoomOnDoubleClick,
      zoomActivationKeyPressed: false,
      lib: 'gea',
      connectionInProgress: false,
      paneClickDistance: 0,
      onTransformChange: (transform) => {
        this.flowStore.transform = transform
      },
    })
  }

  onPaneClick = (e: MouseEvent) => {
    if (this.suppressNextPaneClick) {
      this.suppressNextPaneClick = false
      return
    }
    const t = e.target as HTMLElement | null
    if (!t) return
    if (t.closest('.gea-flow__node, .gea-flow__edge, .gea-flow__handle')) return
    this.flowStore.clearSelection()
  }

  onKeyDown = (e: KeyboardEvent) => {
    // Don't intercept when the user is typing in a form field.
    const ae = (typeof document !== 'undefined' ? document.activeElement : null) as HTMLElement | null
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const removed = this.flowStore.deleteSelected()
      if (removed.nodes.length || removed.edges.length) e.preventDefault()
      return
    }
    if ((e.key === 'a' || e.key === 'A') && (e.metaKey || e.ctrlKey)) {
      this.flowStore.selectAllNodes()
      e.preventDefault()
    }
  }

  dispose(): void {
    if (this.containerEl) {
      this.containerEl.removeEventListener('pointerdown', this.onCanvasPointerDownCapture, true)
    }
    document.removeEventListener('pointermove', this.onLassoMove, true)
    document.removeEventListener('pointerup', this.onLassoEnd, true)
    document.removeEventListener('pointercancel', this.onLassoEnd, true)
    this.resizeObserver?.disconnect()
    this.panZoom?.destroy()
    this.flowStore.panZoom = null
    for (const remove of this.observerRemovers) remove()
    this.observerRemovers = []
    flowStoreRegistry.delete(this.flowStore.id)
    super.dispose()
  }
}
