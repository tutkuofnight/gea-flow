import type { EdgeTypes } from '../types'
import BezierEdge from './edges/BezierEdge'
import StraightEdge from './edges/StraightEdge'
import SmoothStepEdge from './edges/SmoothStepEdge'
import StepEdge from './edges/StepEdge'

export const BUILTIN_EDGE_TYPES: EdgeTypes = {
  default: BezierEdge as never,
  bezier: BezierEdge as never,
  straight: StraightEdge as never,
  smoothstep: SmoothStepEdge as never,
  step: StepEdge as never,
}
