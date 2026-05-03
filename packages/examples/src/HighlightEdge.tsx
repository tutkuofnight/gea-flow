import { type EdgeProps } from '@gea-flow/core'

/**
 * Custom edge: gradient stroke with arrow + label.
 */
export default function HighlightEdge({
  defaultPath,
  selected,
  labelX,
  labelY,
  label,
  id,
}: EdgeProps) {
  const gid = `gradient-${id}`
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#3b82f6" />
        </linearGradient>
      </defs>
      <path class="gea-flow__edge-hit" d={defaultPath} fill="none" stroke="transparent" stroke-width="14" />
      <path
        d={defaultPath}
        fill="none"
        stroke={`url(#${gid})`}
        stroke-width={selected ? 3.5 : 2.5}
        stroke-linecap="round"
      />
      {label != null && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect x="-22" y="-9" width="44" height="18" rx="3" fill="#fff" stroke="#cbd5e1" />
          <text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="10" fill="#334155">
            {label}
          </text>
        </g>
      )}
    </g>
  )
}
