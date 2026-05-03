import { Component } from '@geajs/core'
import { mount, createDisposer } from '@geajs/core/compiler-runtime'
import type { Position } from '@xyflow/system'
import type { FlowStore } from '../store/FlowStore'
import type { EdgeComponent, EdgeTypes, GeaEdge } from '../types'
import BezierEdge from './edges/BezierEdge'

const warnedEdgeTypes = new Set<string>()
function resolveEdgeType(edgeTypes: EdgeTypes, type: string): EdgeComponent {
  const direct = edgeTypes[type]
  if (direct) return direct as EdgeComponent
  if (!warnedEdgeTypes.has(type)) {
    warnedEdgeTypes.add(type)
    console.warn(`[gea-flow] No edge type "${type}" registered; falling back to "default".`)
  }
  return (edgeTypes.default ?? BezierEdge) as EdgeComponent
}

interface EdgeWrapperProps {
  edge: GeaEdge
  flowStore: FlowStore
  edgeTypes: EdgeTypes
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

interface MountedEdge {
  instance: { dispose?: () => void } | null
  disposer: { dispose: () => void }
}

export default class EdgeWrapper extends Component<EdgeWrapperProps> {
  groupEl: SVGGElement | null = null
  contentSlot: SVGGElement | null = null
  mounted: MountedEdge | null = null

  template({ edge }: EdgeWrapperProps) {
    return (
      <g
        ref={this.groupEl as never}
        class={`gea-flow__edge ${edge.selected ? 'selected' : ''} ${edge.animated ? 'animated' : ''} ${edge.className ?? ''}`}
        data-id={edge.id}
        click={this.onClick}
      >
        <g ref={this.contentSlot as never} class="gea-flow__edge-slot" />
      </g>
    )
  }

  onClick = (e: MouseEvent) => {
    const multi = e.shiftKey || e.metaKey || e.ctrlKey
    this.props.flowStore.selectEdge(this.props.edge.id, { multi })
    e.stopPropagation()
  }

  onAfterRender(): void {
    if (!this.contentSlot) return
    this.mountUserEdge()
  }

  mountUserEdge(): void {
    if (!this.contentSlot) return
    const type = this.props.edge.type ?? 'default'
    const EdgeClass = resolveEdgeType(this.props.edgeTypes, type)

    const thunks: Record<string, () => unknown> = {
      id: () => this.props.edge.id,
      source: () => this.props.edge.source,
      target: () => this.props.edge.target,
      sourceX: () => this.props.sourceX,
      sourceY: () => this.props.sourceY,
      targetX: () => this.props.targetX,
      targetY: () => this.props.targetY,
      sourcePosition: () => this.props.sourcePosition,
      targetPosition: () => this.props.targetPosition,
      data: () => this.props.edge.data,
      selected: () => !!this.props.edge.selected,
      animated: () => !!this.props.edge.animated,
      label: () => (this.props.edge as { label?: unknown }).label as string | number | null | undefined,
      defaultPath: () => this.props.defaultPath,
      labelX: () => this.props.labelX,
      labelY: () => this.props.labelY,
    }

    const disposer = createDisposer()
    const result = mount(
      EdgeClass as never,
      this.contentSlot,
      thunks,
      disposer,
      undefined as never,
      this as never,
    ) as { dispose?: () => void } | undefined

    this.mounted = { instance: result ?? null, disposer }
  }

  dispose(): void {
    if (this.mounted) {
      this.mounted.instance?.dispose?.()
      this.mounted.disposer.dispose()
      this.mounted = null
    }
    super.dispose()
  }
}
