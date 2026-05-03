import { getSmoothStepPath } from '@xyflow/system'
import type { EdgeProps } from '../../types'

export default function StepEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  animated,
}: EdgeProps) {
  const path = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 0,
  })[0]
  return (
    <g>
      <path class="gea-flow__edge-hit" d={path} fill="none" stroke="transparent" stroke-width="14" />
      <path
        class={`gea-flow__edge-path ${animated ? 'animated' : ''}`}
        d={path}
        fill="none"
        stroke={selected ? '#3b82f6' : '#b1b1b7'}
        stroke-width={selected ? 2.5 : 1.5}
      />
    </g>
  )
}
