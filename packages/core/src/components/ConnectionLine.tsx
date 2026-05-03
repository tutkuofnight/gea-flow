import { Component } from '@geajs/core'
import { getBezierPath, Position } from '@xyflow/system'
import type { FlowStore } from '../store/FlowStore'
import type { HandleEntry } from '../types'

interface ConnectionLineProps {
  flowStore: FlowStore
}

function oppositePosition(p: Position): Position {
  switch (p) {
    case Position.Top: return Position.Bottom
    case Position.Bottom: return Position.Top
    case Position.Left: return Position.Right
    case Position.Right: return Position.Left
  }
}

function pickHandle(
  list: HandleEntry[] | null | undefined,
  handleId: string | null,
): HandleEntry | undefined {
  if (!list || list.length === 0) return undefined
  if (handleId == null) return list[0]
  return list.find((h) => h.id === handleId) ?? list[0]
}

function computeConnectionPath(flowStore: FlowStore): { d: string; invalid: boolean } | null {
  const { connection, handleBoundsByNode, nodes } = flowStore
  if (!connection.inProgress || !connection.fromNodeId || !connection.to) return null
  const fromNode = nodes.find((n) => n.id === connection.fromNodeId)
  if (!fromNode) return null
  const fromBounds = handleBoundsByNode[connection.fromNodeId]
  const fromHandle = pickHandle(
    connection.fromHandleType === 'target' ? fromBounds?.target : fromBounds?.source,
    connection.fromHandleId,
  )
  if (!fromHandle) return null
  const sx = fromNode.position.x + fromHandle.x + fromHandle.width / 2
  const sy = fromNode.position.y + fromHandle.y + fromHandle.height / 2
  // xyflow reports `connection.to` as container-relative *screen* pixels (no
  // zoom applied), while the SVG we render into lives inside the viewport
  // transform and so expects world-space coords. Convert.
  const [vx, vy, zoom] = flowStore.transform
  const tx = (connection.to.x - vx) / zoom
  const ty = (connection.to.y - vy) / zoom
  const [d] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: fromHandle.position,
    targetX: tx,
    targetY: ty,
    targetPosition: oppositePosition(fromHandle.position),
  })
  return { d, invalid: connection.isValid === false }
}

export default class ConnectionLine extends Component<ConnectionLineProps> {
  template({ flowStore }: ConnectionLineProps) {
    const result = computeConnectionPath(flowStore)
    return (
      <g class={`gea-flow__connection-line ${result?.invalid ? 'invalid' : ''}`}>
        {result && (
          <path
            d={result.d}
            fill="none"
            stroke={result.invalid ? '#ef4444' : '#3b82f6'}
            stroke-width="1.5"
            stroke-dasharray="5 3"
          />
        )}
      </g>
    )
  }
}
