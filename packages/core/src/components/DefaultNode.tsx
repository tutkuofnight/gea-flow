import { Position } from '../types'
import type { GeaNode } from '../types'
import Handle from './Handle'

interface DefaultNodeProps {
  node: GeaNode
}

export default function DefaultNode({ node }: DefaultNodeProps) {
  const data = node.data as { label?: string }
  const label = data?.label ?? node.id
  return (
    <div class="gea-flow__default-node">
      <Handle type="target" position={Position.Top} />
      <span class="gea-flow__default-node-label">{label}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
