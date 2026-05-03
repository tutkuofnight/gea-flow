import { Handle, Position, type NodeProps } from '@gea-flow/core'

interface StatusData extends Record<string, unknown> {
  title: string
  subtitle: string
  status: 'idle' | 'running' | 'done' | 'error'
}

export default function StatusNode({ data, selected }: NodeProps<StatusData>) {
  return (
    <div class={`status-node status-node--${data.status} ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div class="status-node__header">
        <span class={`status-node__dot status-node__dot--${data.status}`} />
        <strong>{data.title}</strong>
      </div>
      <div class="status-node__subtitle">{data.subtitle}</div>
      <div class="status-node__footer">{data.status}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
