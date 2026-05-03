import { Component } from '@geajs/core'
import { mount, createDisposer } from '@geajs/core/compiler-runtime'
import { XYDrag, infiniteExtent, type XYDragInstance } from '@xyflow/system'
import type { FlowStore } from '../store/FlowStore'
import type { GeaNode, NodeComponent, NodeTypes } from '../types'
import DefaultNode from './DefaultNode'
import { buildNodeLookup } from '../utils/build-node-lookup'

const warnedNodeTypes = new Set<string>()
function resolveNodeType(nodeTypes: NodeTypes, type: string): NodeComponent {
  const direct = nodeTypes[type]
  if (direct) return direct as NodeComponent
  if (!warnedNodeTypes.has(type)) {
    warnedNodeTypes.add(type)
    console.warn(`[gea-flow] No node type "${type}" registered; falling back to "default".`)
  }
  return (nodeTypes.default ?? DefaultNode) as NodeComponent
}

interface NodeWrapperProps {
  node: GeaNode
  flowStore: FlowStore
  nodeTypes: NodeTypes
}

interface MountedUserNode {
  instance: { dispose?: () => void; el?: Element | null } | null
  disposer: { dispose: () => void }
  domNode: Element | null
  type: string
}

export default class NodeWrapper extends Component<NodeWrapperProps> {
  nodeEl: HTMLDivElement | null = null
  contentSlot: HTMLDivElement | null = null
  resizeObserver: ResizeObserver | null = null
  mounted: MountedUserNode | null = null
  dragInstance: XYDragInstance | null = null

  template({ node }: NodeWrapperProps) {
    return (
      <div
        ref={this.nodeEl as never}
        class={`gea-flow__node ${node.selected ? 'selected' : ''} ${node.dragging ? 'dragging' : ''} ${node.className ?? ''}`}
        data-id={node.id}
        style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)` }}
        click={this.onClick}
      >
        <div ref={this.contentSlot as never} class="gea-flow__node-content" />
      </div>
    )
  }

  onClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement | null)?.closest('.nodrag, .gea-flow__handle')) return
    const multi = e.shiftKey || e.metaKey || e.ctrlKey
    this.props.flowStore.selectNode(this.props.node.id, { multi })
    e.stopPropagation()
  }

  onAfterRender(): void {
    if (!this.nodeEl || !this.contentSlot) return
    const id = this.props.node.id
    const flowStore = this.props.flowStore

    this.mountUserNode()

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.nodeEl) return
      const { offsetWidth, offsetHeight } = this.nodeEl
      flowStore.updateNodeDimensions([{ id, width: offsetWidth, height: offsetHeight }])
    })
    this.resizeObserver.observe(this.nodeEl)

    // Wire up XYDrag — handles multi-select drag, snap-to-grid, auto-pan,
    // and drag threshold. Replaces our previous bespoke pointer handlers.
    let activeDragIds: string[] = []
    this.dragInstance = XYDrag({
      onDragStart: (_e, dragItems) => {
        activeDragIds = Array.from(dragItems.keys())
        flowStore.setNodesDragging(activeDragIds, true)
      },
      onDragStop: () => {
        if (activeDragIds.length === 0) return
        flowStore.setNodesDragging(activeDragIds, false)
        activeDragIds = []
      },
      getStoreItems: () => ({
        nodes: flowStore.nodes,
        nodeLookup: buildNodeLookup(flowStore.nodes, flowStore.handleBoundsByNode),
        edges: flowStore.edges,
        nodeExtent: infiniteExtent,
        snapGrid: flowStore.snapGrid,
        snapToGrid: flowStore.snapToGrid,
        nodeOrigin: [0, 0],
        multiSelectionActive: false,
        domNode: flowStore.paneEl,
        transform: flowStore.transform,
        autoPanOnNodeDrag: flowStore.autoPanOnNodeDrag,
        nodesDraggable: flowStore.nodesDraggable,
        selectNodesOnDrag: flowStore.selectNodesOnDrag,
        nodeDragThreshold: flowStore.nodeDragThreshold,
        panBy: async ({ x, y }) => {
          const pz = flowStore.panZoom
          if (!pz) return false
          const [tx, ty, zoom] = flowStore.transform
          await pz.setViewport({ x: tx + x, y: ty + y, zoom })
          return true
        },
        unselectNodesAndEdges: () => flowStore.clearSelection(),
        updateNodePositions: (dragItems) => {
          for (const [dragId, item] of dragItems) {
            flowStore.updateNodePosition(dragId, item.position)
          }
        },
      }),
    })
    this.dragInstance.update({
      domNode: this.nodeEl,
      nodeId: id,
      isSelectable: true,
      nodeClickDistance: 0,
      noDragClassName: 'nodrag',
    })
  }

  mountUserNode(): void {
    if (!this.contentSlot) return
    const type = this.props.node.type ?? 'default'
    const NodeComponentClass = resolveNodeType(this.props.nodeTypes, type)

    const thunks: Record<string, () => unknown> = {
      id: () => this.props.node.id,
      data: () => this.props.node.data,
      selected: () => !!this.props.node.selected,
      dragging: () => !!this.props.node.dragging,
      type: () => this.props.node.type ?? 'default',
      node: () => this.props.node,
    }

    const disposer = createDisposer()
    const result = mount(
      NodeComponentClass as never,
      this.contentSlot,
      thunks,
      disposer,
      undefined as never,
      this as never,
    ) as { dispose?: () => void; el?: Element | null } | undefined

    const domNode =
      (result && (result as { el?: Element | null }).el) ?? this.contentSlot.firstElementChild

    this.mounted = { instance: result ?? null, disposer, domNode, type }
  }

  dispose(): void {
    this.dragInstance?.destroy()
    this.dragInstance = null
    this.resizeObserver?.disconnect()
    if (this.mounted) {
      this.mounted.instance?.dispose?.()
      this.mounted.disposer.dispose()
      this.mounted.domNode?.parentNode?.removeChild(this.mounted.domNode)
      this.mounted = null
    }
    super.dispose()
  }
}
