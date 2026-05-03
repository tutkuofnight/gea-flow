import { createFlowStore } from '@gea-flow/core'

// Power-mode store: imported by both App.tsx and the toolbar that mutates from outside.
export const pipelineStore = createFlowStore({
  nodes: [
    {
      id: '1',
      type: 'status',
      position: { x: 60, y: 50 },
      data: { title: 'Fetch source', subtitle: 'GET /api/items', status: 'done' },
    },
    {
      id: '2',
      type: 'status',
      position: { x: 60, y: 220 },
      data: { title: 'Transform', subtitle: 'normalize fields', status: 'running' },
    },
    {
      id: '3',
      type: 'status',
      position: { x: 320, y: 140 },
      data: { title: 'Validate', subtitle: 'schema check', status: 'idle' },
    },
  ],
  edges: [
    { id: 'e1-2', source: '1', target: '2', animated: true, type: 'smoothstep' },
    { id: 'e2-3', source: '2', target: '3', type: 'highlight', label: 'check' },
  ],
})
