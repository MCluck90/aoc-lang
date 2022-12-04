import {
  createArgument,
  createArgumentList,
  createBlock,
  createFunction,
  createFunctionCall,
  createIdentifier,
  createParameter,
  createParameterList,
  createPart1,
  createPipeExpression,
  createProgram,
  createVariableAccess,
  isANumberExpression,
} from '../src/ast'
import { parseAOC } from '../src/parser'
import { assertNodeType, assertSuccessfulParse } from './test-utils'

it('should be able to parse an empty part_1 section', () => {
  const program = parseAOC(`part_1 {}`)
  assertSuccessfulParse(program)
  expect(program.part1.body.expressions).toHaveLength(0)
})

it('should be able to parse a part_1 with a single identifier', () => {
  const program = parseAOC(`part_1 { readByLine }`)
  assertSuccessfulParse(program)
  expect(program.part1.body.expressions).toHaveLength(1)
  const expression = program.part1.body.expressions[0]
  assertNodeType(expression, 'VariableAccess')
  const { left, right } = expression
  assertNodeType(left, 'Identifier')
  expect(right).toBeUndefined()
  expect(left.value).toBe('readByLine')
})

it('should be able to parse a part_1 with a single number', () => {
  const program = parseAOC(`part_1 { 12_345.678 }`)
  assertSuccessfulParse(program)
  expect(program.part1.body.expressions).toHaveLength(1)
  expect(isANumberExpression(program.part1.body.expressions[0])).toBe(true)
})

it('should be able to parse a part_1 with multiple expressions', () => {
  const program = parseAOC(`
    part_1 {
      12_345.678
      someIdentifier
      12_345.678
      someIdentifier
    }
  `)
  assertSuccessfulParse(program)
  expect(program.part1.body.expressions).toHaveLength(4)
})

it('should be able to parse piped expressions', () => {
  const program = parseAOC(`
    part_1 {
      readByLine
      | groupByLineBreak
    }
  `)
  assertSuccessfulParse(program)
  expect(program).toEqual(
    createProgram(
      createPart1(
        createBlock([
          createPipeExpression(
            createVariableAccess(createIdentifier('readByLine')),
            createVariableAccess(createIdentifier('groupByLineBreak'))
          ),
        ])
      )
    )
  )
})

it('should be able to parse function calls', () => {
  const program = parseAOC(`
    part_1 {
      add(1, 2)
    }
  `)
  assertSuccessfulParse(program)
  expect(program.part1.body.expressions).toHaveLength(1)
  const functionCall = program.part1.body.expressions[0]
  assertNodeType(functionCall, 'FunctionCall')
  assertNodeType(functionCall.variable.left, 'Identifier')
  expect(functionCall.variable.left.value).toBe('add')
  assertNodeType(
    functionCall.argumentList.arguments[0].value,
    'NumberExpression'
  )
  assertNodeType(
    functionCall.argumentList.arguments[1].value,
    'NumberExpression'
  )
})

it('should be able to parse anonymous functions', () => {
  const program = parseAOC(`
    part_1 {
      (x, y) => { x }
    }
  `)
  assertSuccessfulParse(program)
  expect(program).toEqual(
    createProgram(
      createPart1(
        createBlock([
          createFunction(
            createParameterList([
              createParameter(createIdentifier('x')),
              createParameter(createIdentifier('y')),
            ]),
            createBlock([createVariableAccess(createIdentifier('x'))])
          ),
        ])
      )
    )
  )
})

it('shold be able to parse a solution to day 1 part 1', () => {
  const program = parseAOC(`
    part_1 {
      readByLine
      | groupByLineBreak
      | map((group) => { group | map(int) | reduce(add) })
      | sortDescending
      | pop
    }
  `)
  assertSuccessfulParse(program)
})

it('should be able to parse a single function call', () => {
  const program = parseAOC(`
    part_1 {
      readByLine()
    }
  `)
  assertSuccessfulParse(program)
})
