import { getStraightPath } from '@xyflow/system'
import type { EdgeProps } from '../../types'

export default function StraightEdge({ sourceX, sourceY, targetX, targetY, selected, animated }: EdgeProps) {
  const path = getStraightPath({ sourceX, sourceY, targetX, targetY })[0]
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
