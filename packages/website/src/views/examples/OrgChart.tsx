import { Component } from '@geajs/core'
import { GeaFlow, Background, Controls, createFlowStore } from '@gea-flow/core'

const orgStore = createFlowStore({
  nodes: [
    { id: 'ceo', position: { x: 360, y: 20 }, data: { label: '👑 CEO' }, className: 'oc-node oc-node--ceo' },
    { id: 'cto', position: { x: 100, y: 160 }, data: { label: '🛠 CTO' }, className: 'oc-node oc-node--c' },
    { id: 'cpo', position: { x: 360, y: 160 }, data: { label: '🎯 CPO' }, className: 'oc-node oc-node--c' },
    { id: 'cfo', position: { x: 620, y: 160 }, data: { label: '💰 CFO' }, className: 'oc-node oc-node--c' },
    { id: 'eng1', position: { x: 0, y: 320 }, data: { label: 'Frontend' }, className: 'oc-node' },
    { id: 'eng2', position: { x: 200, y: 320 }, data: { label: 'Backend' }, className: 'oc-node' },
    { id: 'pm1', position: { x: 360, y: 320 }, data: { label: 'Growth' }, className: 'oc-node' },
    { id: 'fin1', position: { x: 620, y: 320 }, data: { label: 'Accounting' }, className: 'oc-node' },
  ],
  edges: [
    { id: 'e1', source: 'ceo', target: 'cto', type: 'smoothstep' },
    { id: 'e2', source: 'ceo', target: 'cpo', type: 'smoothstep' },
    { id: 'e3', source: 'ceo', target: 'cfo', type: 'smoothstep' },
    { id: 'e4', source: 'cto', target: 'eng1', type: 'smoothstep' },
    { id: 'e5', source: 'cto', target: 'eng2', type: 'smoothstep' },
    { id: 'e6', source: 'cpo', target: 'pm1', type: 'smoothstep' },
    { id: 'e7', source: 'cfo', target: 'fin1', type: 'smoothstep' },
  ],
})

export default class OrgChartExample extends Component {
  template() {
    return (
      <div class="example-canvas example-canvas--org">
        <GeaFlow store={orgStore}>
          <Background variant="dots" gap={24} color="rgba(168, 85, 247, 0.18)" />
          <Controls />
        </GeaFlow>
      </div>
    )
  }
}
