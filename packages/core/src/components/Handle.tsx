import { Component } from '@geajs/core'
import { ConnectionMode, XYHandle, type Connection, type ConnectionState as XYConnectionState } from '@xyflow/system'
import { findFlowStoreForElement } from './GeaFlow'
import type { FlowStore } from '../store/FlowStore'
import type { HandleType, Position } from '../types'
import { buildNodeLookup } from '../utils/build-node-lookup'

interface HandleProps {
  type: HandleType
  position: Position
  id?: string | null
  isConnectable?: boolean
  isConnectableStart?: boolean
  isConnectableEnd?: boolean
  onConnect?: (conn: Connection) => void
}

function mapConnectionState(state: XYConnectionState): Partial<import('../types').ConnectionDragState> {
  if (!state.inProgress) {
    return {
      inProgress: false,
      isValid: null,
      from: null,
      to: null,
      fromNodeId: null,
      fromHandleId: null,
      fromHandleType: null,
      fromPosition: null,
      toNodeId: null,
      toHandleId: null,
      toHandleType: null,
      toPosition: null,
    }
  }
  return {
    inProgress: true,
    isValid: state.isValid,
    from: state.from,
    to: state.to,
    fromNodeId: state.fromHandle.nodeId,
    fromHandleId: state.fromHandle.id ?? null,
    fromHandleType: state.fromHandle.type,
    fromPosition: state.fromPosition,
    toNodeId: state.toNode?.id ?? null,
    toHandleId: state.toHandle?.id ?? null,
    toHandleType: state.toHandle?.type ?? null,
    toPosition: state.toPosition,
  }
}

export default class Handle extends Component<HandleProps> {
  handleEl: HTMLDivElement | null = null
  nodeId: string | null = null
  flowStore: FlowStore | null = null
  resizeObs: ResizeObserver | null = null

  template({ type, position, id, isConnectable, isConnectableStart, isConnectableEnd }: HandleProps) {
    const canConnect = isConnectable !== false
    const canStart = canConnect && isConnectableStart !== false
    const canEnd = canConnect && isConnectableEnd !== false
    const cls = [
      'gea-flow__handle',
      `gea-flow__handle-${position}`,
      type, // 'source' | 'target' — required by xyflow getHandleType
      canStart ? 'connectablestart' : '',
      canEnd ? 'connectableend' : '',
      canConnect ? 'connectable' : '',
      'nopan',
      'nodrag',
    ].filter(Boolean).join(' ')
    return (
      <div
        ref={this.handleEl as never}
        class={cls}
        data-handleid={id ?? ''}
        data-handletype={type}
        data-handlepos={position}
        data-id={id ?? ''}
        pointerdown={this.onPointerDown}
      />
    )
  }

  onAfterRender(): void {
    // Custom user nodes are mounted into NodeWrapper's content slot via the
    // Outlet pattern; their handle elements may not yet be attached to that
    // slot when this fires. Defer one microtask so closest('.gea-flow__node')
    // resolves the parent node element.
    queueMicrotask(() => this.bindToNode())
  }

  bindToNode(): void {
    if (!this.handleEl) return
    const nodeEl = this.handleEl.closest('.gea-flow__node') as HTMLElement | null
    if (!nodeEl) return
    this.nodeId = nodeEl.dataset.id ?? null
    if (!this.nodeId) return

    this.flowStore = findFlowStoreForElement(this.handleEl)
    if (!this.flowStore) return

    // xyflow's isValidHandle inspects data-nodeid on the target handle
    this.handleEl.setAttribute('data-nodeid', this.nodeId)

    this.measure(nodeEl)
    this.resizeObs = new ResizeObserver(() => this.measure(nodeEl))
    this.resizeObs.observe(nodeEl)
    this.resizeObs.observe(this.handleEl)
  }

  measure(nodeEl: HTMLElement): void {
    if (!this.handleEl || !this.nodeId || !this.flowStore) return
    const nRect = nodeEl.getBoundingClientRect()
    const hRect = this.handleEl.getBoundingClientRect()
    const zoom = this.flowStore.transform[2] || 1
    this.flowStore.registerHandle(this.nodeId, {
      id: this.props.id ?? null,
      type: this.props.type,
      position: this.props.position,
      x: (hRect.x - nRect.x) / zoom,
      y: (hRect.y - nRect.y) / zoom,
      width: hRect.width / zoom,
      height: hRect.height / zoom,
    })
  }

  onPointerDown = (e: PointerEvent) => {
    if (this.props.isConnectable === false) return
    const flowStore = this.flowStore
    if (!this.nodeId || !flowStore || !flowStore.paneEl || !this.handleEl) return
    e.stopPropagation()
    XYHandle.onPointerDown(e, {
      autoPanOnConnect: false,
      connectionMode: ConnectionMode.Strict,
      connectionRadius: 25,
      domNode: flowStore.paneEl,
      handleId: this.props.id ?? null,
      nodeId: this.nodeId,
      isTarget: this.props.type === 'target',
      nodeLookup: buildNodeLookup(flowStore.nodes, flowStore.handleBoundsByNode),
      lib: 'gea',
      flowId: null,
      handleDomNode: this.handleEl,
      getTransform: () => flowStore.transform,
      getFromHandle: () =>
        flowStore.connection.inProgress && flowStore.connection.fromNodeId
          ? {
              id: flowStore.connection.fromHandleId,
              nodeId: flowStore.connection.fromNodeId,
              type: flowStore.connection.fromHandleType ?? 'source',
              position: flowStore.connection.fromPosition!,
              x: 0,
              y: 0,
              width: 0,
              height: 0,
            }
          : null,
      panBy: async () => false,
      updateConnection: (state) => flowStore.setConnection(mapConnectionState(state)),
      cancelConnection: () => flowStore.resetConnection(),
      onConnect: (conn) => {
        flowStore.connect(conn)
        this.props.onConnect?.(conn)
      },
    })
  }

  dispose(): void {
    this.resizeObs?.disconnect()
    if (this.nodeId && this.flowStore) {
      this.flowStore.unregisterHandle(this.nodeId, this.props.id ?? null, this.props.type)
    }
    super.dispose()
  }
}
