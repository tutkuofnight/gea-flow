import { Component } from '@geajs/core'
import { GeaFlow, Background, Controls, createFlowStore } from '@gea-flow/core'

const root = { id: 'root', position: { x: 360, y: 220 }, data: { label: 'gea-flow' }, className: 'mm-node mm-node--root' }
const branches = [
  { id: 'a', position: { x: 80, y: 60 }, data: { label: 'Reactivity' }, className: 'mm-node mm-node--cyan' },
  { id: 'b', position: { x: 660, y: 60 }, data: { label: 'No Virtual DOM' }, className: 'mm-node mm-node--magenta' },
  { id: 'c', position: { x: 80, y: 380 }, data: { label: 'XYDrag' }, className: 'mm-node mm-node--purple' },
  { id: 'd', position: { x: 660, y: 380 }, data: { label: 'Multi-instance' }, className: 'mm-node mm-node--cyan' },
  { id: 'a1', position: { x: -120, y: 0 }, data: { label: 'Compile-time' }, className: 'mm-node mm-node--leaf' },
  { id: 'a2', position: { x: -120, y: 100 }, data: { label: 'Proxy stores' }, className: 'mm-node mm-node--leaf' },
  { id: 'b1', position: { x: 880, y: 0 }, data: { label: 'Surgical patches' }, className: 'mm-node mm-node--leaf' },
  { id: 'd1', position: { x: 880, y: 380 }, data: { label: 'Isolated stores' }, className: 'mm-node mm-node--leaf' },
]

const mindMapStore = createFlowStore({
  nodes: [root, ...branches],
  edges: [
    { id: 'r-a', source: 'root', target: 'a', type: 'bezier' },
    { id: 'r-b', source: 'root', target: 'b', type: 'bezier' },
    { id: 'r-c', source: 'root', target: 'c', type: 'bezier' },
    { id: 'r-d', source: 'root', target: 'd', type: 'bezier' },
    { id: 'a-1', source: 'a', target: 'a1', type: 'bezier' },
    { id: 'a-2', source: 'a', target: 'a2', type: 'bezier' },
    { id: 'b-1', source: 'b', target: 'b1', type: 'bezier' },
    { id: 'd-1', source: 'd', target: 'd1', type: 'bezier' },
  ],
})

export default class MindMapExample extends Component {
  template() {
    return (
      <div class="example-canvas example-canvas--mindmap">
        <GeaFlow store={mindMapStore}>
          <Background variant="dots" gap={20} color="rgba(244, 114, 182, 0.15)" />
          <Controls />
        </GeaFlow>
      </div>
    )
  }
}
