export { default as GeaFlow } from './components/GeaFlow'
export { default as Handle } from './components/Handle'
export { default as Background } from './components/Background'
export type { BackgroundVariant } from './components/Background'
export { default as Controls } from './components/Controls'
export { default as MiniMap } from './components/MiniMap'
export { FlowStore, createFlowStore } from './store/FlowStore'
export type { FlowStoreInit, NodeDimensions } from './store/FlowStore'
export { Position } from './types'
export type {
  GeaNode,
  GeaNodeData,
  GeaEdge,
  XYPosition,
  Viewport,
  Transform,
  Connection,
  HandleType,
  ConnectionDragState,
  HandleEntry,
  NodeHandleBounds,
  NodeProps,
  NodeComponent,
  NodeTypes,
  EdgeProps,
  EdgeComponent,
  EdgeTypes,
  FlowCallbacks,
  SelectionSummary,
} from './types'

export const VERSION = '0.0.3'
