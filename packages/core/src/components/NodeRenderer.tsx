import { Component } from '@geajs/core'
import type { FlowStore } from '../store/FlowStore'
import type { NodeTypes } from '../types'
import NodeWrapper from './NodeWrapper'

interface NodeRendererProps {
  flowStore: FlowStore
  nodeTypes: NodeTypes
}

export default class NodeRenderer extends Component<NodeRendererProps> {
  template({ flowStore, nodeTypes }: NodeRendererProps) {
    const { nodes } = flowStore
    return (
      <div class="gea-flow__nodes">
        {nodes.map((node) => (
          <NodeWrapper key={node.id} node={node} flowStore={flowStore} nodeTypes={nodeTypes} />
        ))}
      </div>
    )
  }
}
