import DBSchemaExample from './DBSchema'
import WorkflowExample from './Workflow'
import PipelineExample from './Pipeline'
import MindMapExample from './MindMap'
import DecisionTreeExample from './DecisionTree'
import OrgChartExample from './OrgChart'

export interface ExampleEntry {
  slug: string
  title: string
  blurb: string
  tag: string
  Component: any
}

export const examples: ExampleEntry[] = [
  {
    slug: 'db-schema',
    title: 'DB Schema Visualizer',
    blurb: 'Postgres tables with column-level handles and dashed foreign-key edges.',
    tag: 'showcase',
    Component: DBSchemaExample,
  },
  {
    slug: 'workflow',
    title: 'Workflow / State Machine',
    blurb: 'Idle → Running → Done / Error transitions with animated edges.',
    tag: 'state',
    Component: WorkflowExample,
  },
  {
    slug: 'pipeline',
    title: 'ETL Pipeline',
    blurb: 'Multi-stage pipeline with sources, transforms and sinks.',
    tag: 'data',
    Component: PipelineExample,
  },
  {
    slug: 'mind-map',
    title: 'Mind Map',
    blurb: 'Radial branching from a central topic with smooth edges.',
    tag: 'thinking',
    Component: MindMapExample,
  },
  {
    slug: 'decision-tree',
    title: 'Decision Tree',
    blurb: 'Yes / No branching for a small ML routing rule.',
    tag: 'logic',
    Component: DecisionTreeExample,
  },
  {
    slug: 'org-chart',
    title: 'Org Chart',
    blurb: 'Top-down hierarchy with rounded step edges.',
    tag: 'people',
    Component: OrgChartExample,
  },
]

export function findExample(slug: string | undefined): ExampleEntry {
  if (!slug) return examples[0]
  return examples.find((e) => e.slug === slug) ?? examples[0]
}
