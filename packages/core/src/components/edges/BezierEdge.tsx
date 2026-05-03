import type { EdgeProps } from '../../types'

export default function BezierEdge({ defaultPath, selected, animated }: EdgeProps) {
  return (
    <g>
      <path class="gea-flow__edge-hit" d={defaultPath} fill="none" stroke="transparent" stroke-width="14" />
      <path
        class={`gea-flow__edge-path ${animated ? 'animated' : ''}`}
        d={defaultPath}
        fill="none"
        stroke={selected ? '#3b82f6' : '#b1b1b7'}
        stroke-width={selected ? 2.5 : 1.5}
      />
    </g>
  )
}
