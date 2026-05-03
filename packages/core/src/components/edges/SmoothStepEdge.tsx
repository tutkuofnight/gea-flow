import { getSmoothStepPath } from '@xyflow/system'
import type { EdgeProps } from '../../types'

export default function SmoothStepEdge(props: EdgeProps) {
  const path = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    borderRadius: 5,
  })[0]
  return (
    <g>
      <path class="gea-flow__edge-hit" d={path} fill="none" stroke="transparent" stroke-width="14" />
      <path
        class={`gea-flow__edge-path ${props.animated ? 'animated' : ''}`}
        d={path}
        fill="none"
        stroke={props.selected ? '#3b82f6' : '#b1b1b7'}
        stroke-width={props.selected ? 2.5 : 1.5}
      />
    </g>
  )
}
