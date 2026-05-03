import { Component } from '@geajs/core'
import { GeaFlow, Background, Controls, MiniMap, createFlowStore } from '@gea-flow/core'

const pipelineStore = createFlowStore({
  nodes: [
    { id: 's1', position: { x: 40, y: 60 }, data: { label: '🛢 Postgres' }, className: 'pl-node pl-node--source' },
    { id: 's2', position: { x: 40, y: 180 }, data: { label: '📡 Kafka' }, className: 'pl-node pl-node--source' },
    { id: 's3', position: { x: 40, y: 300 }, data: { label: '📂 S3 raw' }, className: 'pl-node pl-node--source' },
    { id: 't1', position: { x: 280, y: 80 }, data: { label: 'normalize' }, className: 'pl-node pl-node--transform' },
    { id: 't2', position: { x: 280, y: 220 }, data: { label: 'enrich' }, className: 'pl-node pl-node--transform' },
    { id: 't3', position: { x: 520, y: 160 }, data: { label: 'aggregate' }, className: 'pl-node pl-node--transform' },
    { id: 'k1', position: { x: 760, y: 80 }, data: { label: '📈 Metabase' }, className: 'pl-node pl-node--sink' },
    { id: 'k2', position: { x: 760, y: 240 }, data: { label: '❄ Snowflake' }, className: 'pl-node pl-node--sink' },
  ],
  edges: [
    { id: 'p1', source: 's1', target: 't1', type: 'smoothstep', animated: true },
    { id: 'p2', source: 's2', target: 't1', type: 'smoothstep', animated: true },
    { id: 'p3', source: 's3', target: 't2', type: 'smoothstep' },
    { id: 'p4', source: 't1', target: 't3', type: 'smoothstep', animated: true },
    { id: 'p5', source: 't2', target: 't3', type: 'smoothstep' },
    { id: 'p6', source: 't3', target: 'k1', type: 'smoothstep', animated: true },
    { id: 'p7', source: 't3', target: 'k2', type: 'smoothstep', animated: true },
  ],
})

export default class PipelineExample extends Component {
  template() {
    return (
      <div class="example-canvas example-canvas--pipeline">
        <GeaFlow store={pipelineStore}>
          <Background variant="lines" gap={32} color="rgba(34, 211, 238, 0.1)" />
          <Controls />
          <MiniMap />
        </GeaFlow>
      </div>
    )
  }
}
