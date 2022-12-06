import {
  createArgumentList,
  createBinaryExpression,
  createBlock,
  createBooleanExpression,
  createFunctionExpression,
  createFunctionCall,
  createIdentifier,
  createNumberExpression,
  createParameter,
  createParameterList,
  createPart1,
  createProgram,
  createStringExpression,
  createUnaryExpression,
  createVariableAccess,
  isANumberExpression,
  createArgument,
} from '../src/ast'
import { parseAOC, _expression } from '../src/parser'
import {
  assertFailedParse,
  assertNodeType,
  assertSuccessfulParse,
} from './test-utils'

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
          createFunctionExpression(
            createParameterList([
              createParameter(createIdentifier('x')),
              createParameter(createIdentifier('y')),
            ]),
            createBlock([createVariableAccess(createIdentifier('x'))])
          ),
        ])
      ),
      null
    )
  )
})

it('should be able to parse a solution to day 1 part 1', () => {
  const program = parseAOC(`
    part_1 {
      readByLine()
      |> groupByLineBreak
      |> map((group) => { group |> map(int) |> reduce(add) })
      |> sortDescending
      |> pop
    }
  `)
  assertSuccessfulParse(program)

  const readByLine = createFunctionCall(
    createVariableAccess(createIdentifier('readByLine')),
    createArgumentList([])
  )
  const groupByLineBreak = createVariableAccess(
    createIdentifier('groupByLineBreak')
  )
  const lambda = createFunctionExpression(
    createParameterList([createParameter(createIdentifier('group'))]),
    createBlock([
      createBinaryExpression(
        createBinaryExpression(
          createVariableAccess(createIdentifier('group')),
          '|>',
          createFunctionCall(
            createVariableAccess(createIdentifier('map')),
            createArgumentList([
              createArgument(createVariableAccess(createIdentifier('int'))),
            ])
          )
        ),
        '|>',
        createFunctionCall(
          createVariableAccess(createIdentifier('reduce')),
          createArgumentList([
            createArgument(createVariableAccess(createIdentifier('add'))),
          ])
        )
      ),
    ])
  )
  const mapCall = createFunctionCall(
    createVariableAccess(createIdentifier('map')),
    createArgumentList([createArgument(lambda)])
  )
  const sortDescending = createVariableAccess(
    createIdentifier('sortDescending')
  )
  const pop = createVariableAccess(createIdentifier('pop'))

  expect(program.part1.body.expressions).toEqual([
    createBinaryExpression(
      createBinaryExpression(
        createBinaryExpression(
          createBinaryExpression(readByLine, '|>', groupByLineBreak),
          '|>',
          mapCall
        ),
        '|>',
        sortDescending
      ),
      '|>',
      pop
    ),
  ])
})

it('should be able to parse a single function call', () => {
  const program = parseAOC(`
    part_1 {
      readByLine()
    }
  `)
  assertSuccessfulParse(program)
})

describe('expressions', () => {
  it('should be able to parse numbers', () => {
    const program = parseAOC(`
      part_1 {
        100
        123.45
        9_001
      }
    `)
    assertSuccessfulParse(program)
    expect(program.part1.body.expressions).toEqual([
      createNumberExpression(100),
      createNumberExpression(123.45),
      createNumberExpression(9001),
    ])
  })

  it('should be able to parse booleans', () => {
    const program = parseAOC(`
      part_1 {
        true
        false
      }
    `)
    assertSuccessfulParse(program)
    expect(program.part1.body.expressions).toEqual([
      createBooleanExpression(true),
      createBooleanExpression(false),
    ])
  })

  it('should be able to parse strings', () => {
    const program = parseAOC(`
      part_1 {
        'Hello'
        "world"
      }
    `)
    assertSuccessfulParse(program)
    expect(program.part1.body.expressions).toEqual([
      createStringExpression('Hello'),
      createStringExpression('world'),
    ])
  })

  it('should be able to parse negative numbers', () => {
    const program = parseAOC(`
      part_1 {
        -1.25
      }
    `)
    assertSuccessfulParse(program)
    expect(program.part1.body.expressions).toEqual([
      createUnaryExpression('-', createNumberExpression(1.25)),
    ])
  })

  it('should be able to parse negation', () => {
    const program = parseAOC(`
      part_1 {
        !true
        !false
      }
    `)
    assertSuccessfulParse(program)
    expect(program.part1.body.expressions).toEqual([
      createUnaryExpression('!', createBooleanExpression(true)),
      createUnaryExpression('!', createBooleanExpression(false)),
    ])
  })

  it('should be able to parse multiplication', () => {
    const program = parseAOC(`
      part_1 {
        1 * 2
        1 * 2 * 3 * 4 * 5
      }
    `)
    assertSuccessfulParse(program)
    expect(program.part1.body.expressions).toEqual([
      createBinaryExpression(
        createNumberExpression(1),
        '*',
        createNumberExpression(2)
      ),
      createBinaryExpression(
        createBinaryExpression(
          createBinaryExpression(
            createBinaryExpression(
              createNumberExpression(1),
              '*',
              createNumberExpression(2)
            ),
            '*',
            createNumberExpression(3)
          ),
          '*',
          createNumberExpression(4)
        ),
        '*',
        createNumberExpression(5)
      ),
    ])
  })

  it('should be able to parse division', () => {
    const program = parseAOC(`
      part_1 {
        1 / 2
        1 / 2 / 3 / 4 / 5
      }
    `)
    assertSuccessfulParse(program)
    expect(program.part1.body.expressions).toEqual([
      createBinaryExpression(
        createNumberExpression(1),
        '/',
        createNumberExpression(2)
      ),
      createBinaryExpression(
        createBinaryExpression(
          createBinaryExpression(
            createBinaryExpression(
              createNumberExpression(1),
              '/',
              createNumberExpression(2)
            ),
            '/',
            createNumberExpression(3)
          ),
          '/',
          createNumberExpression(4)
        ),
        '/',
        createNumberExpression(5)
      ),
    ])
  })

  it('should be able to parse comparisons', () => {
    const program = parseAOC(`
      part_1 {
        1 < 2;
        1 > 2;
        1 <= 2;
        1 >= 2
      }
    `)
    assertSuccessfulParse(program)
    expect(program.part1.body.expressions).toEqual([
      createBinaryExpression(
        createNumberExpression(1),
        '<',
        createNumberExpression(2)
      ),
      createBinaryExpression(
        createNumberExpression(1),
        '>',
        createNumberExpression(2)
      ),
      createBinaryExpression(
        createNumberExpression(1),
        '<=',
        createNumberExpression(2)
      ),
      createBinaryExpression(
        createNumberExpression(1),
        '>=',
        createNumberExpression(2)
      ),
    ])
  })

  it('should be able to parse equality', () => {
    const program = parseAOC(`
      part_1 {
        1 == 2;
        1 != 2
      }
    `)
    assertSuccessfulParse(program)
    expect(program.part1.body.expressions).toEqual([
      createBinaryExpression(
        createNumberExpression(1),
        '==',
        createNumberExpression(2)
      ),
      createBinaryExpression(
        createNumberExpression(1),
        '!=',
        createNumberExpression(2)
      ),
    ])
  })

  it('should be able to parse pipelines', () => {
    const program = parseAOC(`
      part_1 {
        1 |> 2;
        1 |> 2 |> 3 |> 4 |> 5
      }
    `)
    assertSuccessfulParse(program)
    assertSuccessfulParse(program)
    expect(program.part1.body.expressions).toEqual([
      createBinaryExpression(
        createNumberExpression(1),
        '|>',
        createNumberExpression(2)
      ),
      createBinaryExpression(
        createBinaryExpression(
          createBinaryExpression(
            createBinaryExpression(
              createNumberExpression(1),
              '|>',
              createNumberExpression(2)
            ),
            '|>',
            createNumberExpression(3)
          ),
          '|>',
          createNumberExpression(4)
        ),
        '|>',
        createNumberExpression(5)
      ),
    ])
  })

  it('should be able to parse function calls', () => {
    const program = parseAOC(`
      part_1 {
        readByLine()
      }
    `)
    assertSuccessfulParse(program)
    expect(program.part1.body.expressions).toEqual([
      createFunctionCall(
        createVariableAccess(createIdentifier('readByLine')),
        createArgumentList([])
      ),
    ])
  })

  it('should be able to parse function expressions', () => {
    const program = parseAOC(`
      part_1 {
        (x, y) => { x + y }
      }
    `)
    assertSuccessfulParse(program)
    expect(program.part1.body.expressions).toEqual([
      createFunctionExpression(
        createParameterList([
          createParameter(createIdentifier('x')),
          createParameter(createIdentifier('y')),
        ]),
        createBlock([
          createBinaryExpression(
            createVariableAccess(createIdentifier('x')),
            '+',
            createVariableAccess(createIdentifier('y'))
          ),
        ])
      ),
    ])
  })
})

it('should be able to parse a part 2', () => {
  const program = parseAOC(`
    part_1 {}
    part_2 {}
  `)
  assertSuccessfulParse(program)
  expect(program.part2).not.toBe(null)
})

it('should require a part 1 before a part 2', () => {
  const program = parseAOC(`
    part_2 {}
  `)
  assertFailedParse(program)
})
