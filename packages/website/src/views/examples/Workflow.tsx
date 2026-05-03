import { Component } from '@geajs/core'
import { GeaFlow, Background, Controls, createFlowStore } from '@gea-flow/core'

const workflowStore = createFlowStore({
  nodes: [
    { id: 'start', position: { x: 60, y: 200 }, data: { label: '▶ Start' }, className: 'wf-node wf-node--start' },
    { id: 'idle', position: { x: 240, y: 200 }, data: { label: 'Idle' }, className: 'wf-node' },
    { id: 'running', position: { x: 460, y: 200 }, data: { label: 'Running' }, className: 'wf-node wf-node--running' },
    { id: 'done', position: { x: 700, y: 100 }, data: { label: '✓ Done' }, className: 'wf-node wf-node--done' },
    { id: 'error', position: { x: 700, y: 300 }, data: { label: '✕ Error' }, className: 'wf-node wf-node--error' },
    { id: 'retry', position: { x: 460, y: 380 }, data: { label: 'Retry' }, className: 'wf-node' },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'idle', type: 'smoothstep', label: 'init' },
    { id: 'e2', source: 'idle', target: 'running', type: 'smoothstep', animated: true, label: 'run' },
    { id: 'e3', source: 'running', target: 'done', type: 'smoothstep', animated: true, label: 'success' },
    { id: 'e4', source: 'running', target: 'error', type: 'smoothstep', label: 'fail' },
    { id: 'e5', source: 'error', target: 'retry', type: 'smoothstep' },
    { id: 'e6', source: 'retry', target: 'running', type: 'smoothstep', animated: true, label: 'again' },
  ],
})

export default class WorkflowExample extends Component {
  template() {
    return (
      <div class="example-canvas example-canvas--workflow">
        <GeaFlow store={workflowStore}>
          <Background variant="dots" gap={24} color="rgba(168, 85, 247, 0.2)" />
          <Controls />
        </GeaFlow>
      </div>
    )
  }
}
