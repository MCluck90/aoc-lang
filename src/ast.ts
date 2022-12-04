export interface Identifier {
  __type: 'Identifier'
  value: string
}
export const createIdentifier = (value: string): Identifier => ({
  __type: 'Identifier',
  value,
})
export const isAIdentifier = (node: Node): node is Identifier =>
  node.__type === 'Identifier'

export interface Part1 {
  __type: 'Part1'
  body: Block
}
export const createPart1 = (body: Block): Part1 => ({
  __type: 'Part1',
  body,
})
export const isAPart1 = (node: Node): node is Part1 => node.__type === 'Part1'

export interface Part2 {
  __type: 'Part2'
  body: Block
}
export const createPart2 = (body: Block): Part2 => ({
  __type: 'Part2',
  body,
})
export const isAPart2 = (node: Node): node is Part2 => node.__type === 'Part2'

export interface NumberExpression {
  __type: 'NumberExpression'
  value: number
}
export const createNumberExpression = (value: number): NumberExpression => ({
  __type: 'NumberExpression',
  value,
})
export const isANumberExpression = (node: Node): node is NumberExpression =>
  node.__type === 'NumberExpression'

export interface BooleanExpression {
  __type: 'BooleanExpression'
  value: boolean
}
export const createBooleanExpression = (value: boolean): BooleanExpression => ({
  __type: 'BooleanExpression',
  value,
})

export interface StringExpression {
  __type: 'StringExpression'
  value: string
}
export const createStringExpression = (value: string): StringExpression => ({
  __type: 'StringExpression',
  value,
})

export interface PipeExpression {
  __type: 'PipeExpression'
  left: Expression
  right: Expression
}
export const createPipeExpression = (
  left: Expression,
  right: Expression
): PipeExpression => ({
  __type: 'PipeExpression',
  left,
  right,
})

export interface Parameter {
  __type: 'Parameter'
  name: Identifier
}
export const createParameter = (name: Identifier): Parameter => ({
  __type: 'Parameter',
  name,
})

export interface ParameterList {
  __type: 'ParameterList'
  parameters: Parameter[]
}
export const createParameterList = (
  parameters: Parameter[]
): ParameterList => ({
  __type: 'ParameterList',
  parameters,
})

export interface AOCFunction {
  __type: 'Function'
  parameterList: ParameterList
  body: Block
}
export const createFunction = (
  parameterList: ParameterList,
  body: Block
): AOCFunction => ({
  __type: 'Function',
  parameterList,
  body,
})
export const isAFunction = (node: Node): node is AOCFunction =>
  node.__type === 'Function'

export interface Argument {
  __type: 'Argument'
  value: Expression
}
export const createArgument = (value: Expression): Argument => ({
  __type: 'Argument',
  value,
})

export interface ArgumentList {
  __type: 'ArgumentList'
  arguments: Argument[]
}
export const createArgumentList = (_arguments: Argument[]): ArgumentList => ({
  __type: 'ArgumentList',
  arguments: _arguments,
})

export interface VariableAccess {
  __type: 'VariableAccess'
  left: Expression
  right?: Expression
}
export const createVariableAccess = (
  left: Expression,
  right?: Expression
): VariableAccess => ({
  __type: 'VariableAccess',
  left,
  right,
})
export const isAVariableAccess = (node: Node): node is VariableAccess =>
  node.__type === 'VariableAccess'

export interface FunctionCall {
  __type: 'FunctionCall'
  variable: VariableAccess
  argumentList: ArgumentList
}
export const createFunctionCall = (
  variable: VariableAccess,
  argumentList: ArgumentList
): FunctionCall => ({
  __type: 'FunctionCall',
  variable,
  argumentList,
})

export interface Block {
  __type: 'Block'
  expressions: Expression[]
}
export const createBlock = (expressions: Expression[]): Block => ({
  __type: 'Block',
  expressions,
})
export const isABlock = (node: Node): node is Block => node.__type === 'Block'

export interface Program {
  __type: 'Program'
  part1: Part1
  part2?: Part2
}
export const createProgram = (part1: Part1, part2?: Part2): Program => ({
  __type: 'Program',
  part1,
  part2,
})
export const isAProgram = (node: Node): node is Program =>
  node.__type === 'Program'

export type Expression =
  | Identifier
  | VariableAccess
  | NumberExpression
  | BooleanExpression
  | StringExpression
  | PipeExpression
  | AOCFunction
  | FunctionCall

export type Node = Part1 | Part2 | Expression | Block | Program
export const isANode = (node: unknown): node is Node =>
  node !== undefined &&
  node !== null &&
  typeof (node as any).__type === 'string'
