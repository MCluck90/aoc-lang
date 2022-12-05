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
export const isABooleanExpression = (node: Node): node is BooleanExpression =>
  node.__type === 'BooleanExpression'

export interface StringExpression {
  __type: 'StringExpression'
  value: string
}
export const createStringExpression = (value: string): StringExpression => ({
  __type: 'StringExpression',
  value,
})
export const isAStringExpression = (node: Node): node is StringExpression =>
  node.__type === 'StringExpression'

export interface UnaryExpression {
  __type: 'UnaryExpression'
  operator: UnaryOperator
  value: Expression
}
export const createUnaryExpression = (
  operator: UnaryOperator,
  value: Expression
): UnaryExpression => ({
  __type: 'UnaryExpression',
  operator,
  value,
})
export const isAUnaryExpression = (node: Node): node is UnaryExpression =>
  node.__type === 'UnaryExpression'

export type UnaryOperator = '-' | '!'

export type BinaryOperator =
  | '/'
  | '*'
  | '+'
  | '-'
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | '|'
export interface BinaryExpression {
  __type: 'BinaryExpression'
  left: Expression
  operator: BinaryOperator
  right: Expression
}
export const createBinaryExpression = (
  left: Expression,
  operator: BinaryOperator,
  right: Expression
): BinaryExpression => ({
  __type: 'BinaryExpression',
  left,
  operator,
  right,
})
export const isABinaryExpression = (node: Node): node is BinaryExpression =>
  node.__type === 'BinaryExpression'

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

export interface FunctionExpression {
  __type: 'Function'
  parameterList: ParameterList
  body: Block
}
export const createFunctionExpression = (
  parameterList: ParameterList,
  body: Block
): FunctionExpression => ({
  __type: 'Function',
  parameterList,
  body,
})
export const isAFunction = (node: Node): node is FunctionExpression =>
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
export const isAFunctionCall = (node: Node): node is FunctionCall =>
  node.__type === 'FunctionCall'

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
  | FunctionExpression
  | FunctionCall
  | BinaryExpression
  | UnaryExpression
export const isAExpression = (value: unknown): value is Expression => {
  if (value === undefined || value === null) {
    return false
  }

  const node = value as Node
  return (
    isAIdentifier(node) ||
    isAVariableAccess(node) ||
    isANumberExpression(node) ||
    isABooleanExpression(node) ||
    isAStringExpression(node) ||
    isAFunction(node) ||
    isAFunctionCall(node) ||
    isABinaryExpression(node) ||
    isAUnaryExpression(node)
  )
}

export type Node = Part1 | Part2 | Expression | Block | Program
export const isANode = (node: unknown): node is Node =>
  node !== undefined &&
  node !== null &&
  typeof (node as any).__type === 'string'
