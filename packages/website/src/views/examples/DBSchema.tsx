import { Component } from '@geajs/core'
import { GeaFlow, Background, Controls, createFlowStore, Handle, Position, type NodeProps } from '@gea-flow/core'

interface Column {
  name: string
  type: string
  kind: 'pk' | 'fk' | 'unique' | 'plain'
}

interface TableData extends Record<string, unknown> {
  name: string
  columns: Column[]
  fkCount: number
  pkCount: number
}

const COLUMN_ICONS: Record<Column['kind'], string> = {
  pk: '🗝',
  fk: '🔗',
  unique: '✦',
  plain: '#',
}

function ColumnRow({ tableId, col }: { tableId: string; col: Column }) {
  return (
    <div class={`db-col db-col--${col.kind}`} data-col={col.name}>
      <Handle type="target" position={Position.Left} id={col.name} />
      <span class={`db-col__icon db-col__icon--${col.kind}`}>{COLUMN_ICONS[col.kind]}</span>
      <span class="db-col__name">{col.name}</span>
      <span class="db-col__type">{col.type}</span>
      <Handle type="source" position={Position.Right} id={col.name} />
    </div>
  )
}

function TableNode({ data, id, selected }: NodeProps<TableData>) {
  return (
    <div class={`db-table ${selected ? 'db-table--selected' : ''}`}>
      <div class="db-table__header">
        <span class="db-table__header-icon">▦</span>
        <span class="db-table__header-name">{data.name}</span>
      </div>
      <div class="db-table__body">
        {data.columns.map((col) => (
          <ColumnRow key={col.name} tableId={id} col={col} />
        ))}
      </div>
      <div class="db-table__footer">
        <span class="db-table__footer-count">{data.columns.length} columns</span>
        <span class="db-table__footer-stat">
          {data.pkCount > 0 ? <span class="db-table__chip db-table__chip--pk">🗝 {data.pkCount}</span> : null}
          {data.fkCount > 0 ? <span class="db-table__chip db-table__chip--fk">🔗 {data.fkCount}</span> : null}
        </span>
      </div>
    </div>
  )
}

const usersCols: Column[] = [
  { name: 'id', type: 'serial?', kind: 'pk' },
  { name: 'email', type: 'varchar', kind: 'unique' },
  { name: 'name', type: 'text', kind: 'plain' },
  { name: 'avatarUrl', type: 'text?', kind: 'plain' },
  { name: 'createdAt', type: 'timestamp?', kind: 'plain' },
]

const categoriesCols: Column[] = [
  { name: 'id', type: 'serial?', kind: 'pk' },
  { name: 'name', type: 'varchar', kind: 'plain' },
  { name: 'slug', type: 'varchar', kind: 'plain' },
]

const postsCols: Column[] = [
  { name: 'id', type: 'serial?', kind: 'pk' },
  { name: 'title', type: 'varchar', kind: 'plain' },
  { name: 'content', type: 'text?', kind: 'plain' },
  { name: 'authorId', type: 'integer?', kind: 'fk' },
  { name: 'categoryId', type: 'integer?', kind: 'fk' },
  { name: 'isPublished', type: 'boolean?', kind: 'plain' },
  { name: 'createdAt', type: 'timestamp?', kind: 'plain' },
]

const commentsCols: Column[] = [
  { name: 'id', type: 'serial?', kind: 'pk' },
  { name: 'content', type: 'text', kind: 'plain' },
  { name: 'postId', type: 'integer?', kind: 'fk' },
  { name: 'userId', type: 'integer?', kind: 'fk' },
  { name: 'createdAt', type: 'timestamp?', kind: 'plain' },
]

const nodeTypes = { table: TableNode }

const dbStore = createFlowStore({
  nodes: [
    {
      id: 'users',
      type: 'table',
      position: { x: 80, y: 40 },
      data: { name: 'users', columns: usersCols, pkCount: 1, fkCount: 0 },
    },
    {
      id: 'categories',
      type: 'table',
      position: { x: 540, y: 40 },
      data: { name: 'categories', columns: categoriesCols, pkCount: 1, fkCount: 0 },
    },
    {
      id: 'posts',
      type: 'table',
      position: { x: 80, y: 360 },
      data: { name: 'posts', columns: postsCols, pkCount: 1, fkCount: 2 },
    },
    {
      id: 'comments',
      type: 'table',
      position: { x: 540, y: 380 },
      data: { name: 'comments', columns: commentsCols, pkCount: 1, fkCount: 2 },
    },
  ],
  edges: [
    {
      id: 'fk-posts-author',
      source: 'users',
      sourceHandle: 'id',
      target: 'posts',
      targetHandle: 'authorId',
      type: 'smoothstep',
      className: 'db-edge db-edge--fk',
    },
    {
      id: 'fk-posts-category',
      source: 'categories',
      sourceHandle: 'id',
      target: 'posts',
      targetHandle: 'categoryId',
      type: 'smoothstep',
      className: 'db-edge db-edge--fk',
    },
    {
      id: 'fk-comments-post',
      source: 'posts',
      sourceHandle: 'id',
      target: 'comments',
      targetHandle: 'postId',
      type: 'smoothstep',
      className: 'db-edge db-edge--fk',
    },
    {
      id: 'fk-comments-user',
      source: 'users',
      sourceHandle: 'id',
      target: 'comments',
      targetHandle: 'userId',
      type: 'smoothstep',
      className: 'db-edge db-edge--fk',
    },
  ],
  defaultViewport: { x: 0, y: 0, zoom: 0.85 },
})

export default class DBSchemaExample extends Component {
  template() {
    return (
      <div class="example-canvas example-canvas--db">
        <GeaFlow store={dbStore} nodeTypes={nodeTypes}>
          <Background variant="dots" gap={28} color="rgba(134, 239, 172, 0.18)" />
          <Controls />
        </GeaFlow>
      </div>
    )
  }
}
