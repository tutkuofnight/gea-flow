import type {
  NodeBase,
  EdgeBase,
  XYPosition,
  Viewport,
  Transform,
  Connection,
  HandleType,
  Position,
} from '@xyflow/system'

export type GeaNodeData = Record<string, unknown>

export interface GeaNode<TData extends GeaNodeData = GeaNodeData>
  extends Omit<NodeBase<TData>, 'measured'> {
  measured?: { width: number; height: number }
}

export interface GeaEdge extends EdgeBase {
  label?: string | number
}

/** Single handle measurement, node-local coordinates. */
export interface HandleEntry {
  id: string | null
  type: HandleType
  position: Position
  /** Handle bounds relative to the node origin. */
  x: number
  y: number
  width: number
  height: number
}

export interface NodeHandleBounds {
  source: HandleEntry[] | null
  target: HandleEntry[] | null
}

/** Connection drag state; exposed in store so ConnectionLine can render. */
export interface ConnectionDragState {
  inProgress: boolean
  isValid: boolean | null
  fromNodeId: string | null
  fromHandleId: string | null
  fromHandleType: HandleType | null
  fromPosition: Position | null
  /** World-space start point. */
  from: XYPosition | null
  /** World-space current pointer position. */
  to: XYPosition | null
  toNodeId: string | null
  toHandleId: string | null
  toHandleType: HandleType | null
  toPosition: Position | null
}

export const noConnection: ConnectionDragState = {
  inProgress: false,
  isValid: null,
  fromNodeId: null,
  fromHandleId: null,
  fromHandleType: null,
  fromPosition: null,
  from: null,
  to: null,
  toNodeId: null,
  toHandleId: null,
  toHandleType: null,
  toPosition: null,
}

/**
 * Props passed to a custom node component. The user implements:
 *   function MyNode({ id, data, selected }: NodeProps<MyData>) { ... }
 *
 * `node` is the full underlying GeaNode reference (the same object stored in
 * the FlowStore); mutating its `data` propagates reactively. Prefer the flat
 * `id`/`data`/`selected`/... fields for read-only consumption.
 */
export interface NodeProps<TData extends GeaNodeData = GeaNodeData> {
  id: string
  data: TData
  selected: boolean
  dragging: boolean
  type: string
  node: GeaNode<TData>
}

/**
 * A custom node component. Either a class (extends Gea Component) or a function
 * component — Gea compiles both to the same internal class form.
 */
export type NodeComponent<TData extends GeaNodeData = GeaNodeData> =
  | { new (...args: any[]): { render: (parent: Element) => void; dispose: () => void } }
  | ((props: NodeProps<TData>) => unknown)

export type NodeTypes = Record<string, NodeComponent>

/**
 * Props passed to a custom edge component. The user implements:
 *   function MyEdge({ id, sourceX, sourceY, targetX, targetY, selected }: EdgeProps<MyData>) { ... }
 */
export interface EdgeProps<TData extends Record<string, unknown> = Record<string, unknown>> {
  id: string
  source: string
  target: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  data?: TData
  selected: boolean
  animated: boolean
  label?: string | number | null
  /** Computed path string for the default geometry. Useful for hit-area path. */
  defaultPath: string
  labelX: number
  labelY: number
}

export type EdgeComponent<TData extends Record<string, unknown> = Record<string, unknown>> =
  | { new (...args: any[]): { render: (parent: Element) => void; dispose: () => void } }
  | ((props: EdgeProps<TData>) => unknown)

export type EdgeTypes = Record<string, EdgeComponent>

/**
 * Selection summary passed to onSelectionChange.
 */
export interface SelectionSummary {
  nodes: GeaNode[]
  edges: GeaEdge[]
}

/**
 * Flow-level callbacks. All optional. Stored on FlowStore.callbacks so
 * descendants can fire them without prop drilling.
 */
export interface FlowCallbacks {
  /** Fires when the user creates an edge by dragging from one handle to another. */
  onConnect?: (connection: Connection) => void
  /** Fires whenever the nodes array changes (added, removed, moved, selected, etc.). */
  onNodesChange?: (nodes: GeaNode[]) => void
  /** Fires whenever the edges array changes. */
  onEdgesChange?: (edges: GeaEdge[]) => void
  /** Fires when the set of selected nodes/edges changes. */
  onSelectionChange?: (selection: SelectionSummary) => void
}

export type { XYPosition, Viewport, Transform, Connection, HandleType }
export { Position } from '@xyflow/system'
