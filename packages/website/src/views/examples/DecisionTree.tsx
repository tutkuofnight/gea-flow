import { Component } from '@geajs/core'
import { GeaFlow, Background, Controls, createFlowStore } from '@gea-flow/core'

const dtStore = createFlowStore({
  nodes: [
    { id: 'root', position: { x: 360, y: 30 }, data: { label: 'is_image?' }, className: 'dt-node dt-node--decision' },
    { id: 'l1', position: { x: 160, y: 160 }, data: { label: 'has_face?' }, className: 'dt-node dt-node--decision' },
    { id: 'l2', position: { x: 580, y: 160 }, data: { label: 'is_text?' }, className: 'dt-node dt-node--decision' },
    { id: 'leaf-portrait', position: { x: 40, y: 320 }, data: { label: '🧑 Portrait' }, className: 'dt-node dt-node--leaf' },
    { id: 'leaf-scene', position: { x: 240, y: 320 }, data: { label: '🌄 Scene' }, className: 'dt-node dt-node--leaf' },
    { id: 'leaf-doc', position: { x: 480, y: 320 }, data: { label: '📄 Document' }, className: 'dt-node dt-node--leaf' },
    { id: 'leaf-other', position: { x: 700, y: 320 }, data: { label: '❓ Other' }, className: 'dt-node dt-node--leaf' },
  ],
  edges: [
    { id: 'r-yes', source: 'root', target: 'l1', type: 'step', label: 'yes' },
    { id: 'r-no', source: 'root', target: 'l2', type: 'step', label: 'no' },
    { id: 'l1-yes', source: 'l1', target: 'leaf-portrait', type: 'step', label: 'yes' },
    { id: 'l1-no', source: 'l1', target: 'leaf-scene', type: 'step', label: 'no' },
    { id: 'l2-yes', source: 'l2', target: 'leaf-doc', type: 'step', label: 'yes' },
    { id: 'l2-no', source: 'l2', target: 'leaf-other', type: 'step', label: 'no' },
  ],
})

export default class DecisionTreeExample extends Component {
  template() {
    return (
      <div class="example-canvas example-canvas--decision">
        <GeaFlow store={dtStore}>
          <Background variant="cross" gap={36} color="rgba(34, 211, 238, 0.15)" />
          <Controls />
        </GeaFlow>
      </div>
    )
  }
}
