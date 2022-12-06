import * as fs from 'fs'
import * as path from 'path'
import {
  Argument,
  BinaryExpression,
  Block,
  BooleanExpression,
  Expression,
  FunctionCall,
  FunctionExpression,
  Identifier,
  isAnArgument,
  isAFunctionExpression,
  isAIdentifier,
  isANode,
  NumberExpression,
  Program,
  StringExpression,
  UnaryExpression,
  VariableAccess,
  isAVariableAccess,
} from './ast'

class Scope {
  private values: Map<string, unknown> = new Map()
  constructor(private readonly parent?: Scope) {}

  getValue(identifier: string): unknown {
    if (this.values.has(identifier)) {
      return this.values.get(identifier)
    }

    return this.parent?.getValue(identifier)
  }

  setValue(identifier: string, value: unknown) {
    this.values.set(identifier, value)
  }
}

const globalScope = new Scope()

export class Interpreter {
  constructor(day: string, private readonly program: Program) {
    globalScope.setValue('readByLine', () => {
      const p = path.join(process.cwd(), 'data', `${day}.txt`)
      return fs.readFileSync(p).toString().split('\n')
    })

    globalScope.setValue('pop', (array: any[]) => array.pop())

    globalScope.setValue('sortDescending', (array: any[]) => {
      const copy = [...array]
      if (copy.length === 0) {
        return copy
      }
      const isNumbers = typeof copy[0] === 'number'
      copy.sort((a, b) => {
        if (isNumbers) {
          return a - b
        }
        if (a < b) {
          return 1
        } else if (a > b) {
          return -1
        } else {
          return 0
        }
      })
      return copy
    })

    globalScope.setValue(
      'map',
      (fnArg: Argument<FunctionExpression>) => (array: any[]) =>
        array.map((element) =>
          this.executeFunction(fnArg.value as any, [element])
        )
    )

    globalScope.setValue(
      'reduce',
      (fnArg: Argument<FunctionExpression>) => (array: any[]) =>
        array.reduce((acc, element) =>
          this.executeFunction(fnArg.value as any, [acc, element])
        )
    )

    globalScope.setValue('int', parseInt)
    globalScope.setValue('add', (x: number) => (y: number) => x + y)

    globalScope.setValue('groupByLineBreak', (lines: string[]) => {
      const groups: string[][] = []
      let group: string[] = []
      for (const line of lines) {
        if (line === '' && group.length > 0) {
          groups.push(group)
          group = []
        } else {
          group.push(line)
        }
      }
      if (group.length > 0) {
        groups.push(group)
      }
      return groups
    })
  }

  execute() {
    this.visitProgram(this.program)
  }

  private visitProgram(program: Program) {
    console.log('Part 1')
    console.log(this.visitBlock(program.part1.body))

    if (program.part2) {
      console.log('Part 2')
      console.log(this.visitBlock(program.part2.body))
    }
  }

  private visitBlock(block: Block): unknown {
    let lastExpression = null
    for (const expression of block.expressions) {
      lastExpression = this.visitExpression(expression)
    }
    return lastExpression
  }

  private visitExpression(expression: Expression) {
    return this[`visit${expression.__type}`](expression as any)
  }

  private visitIdentifier(identifier: Identifier) {
    const result = globalScope.getValue(identifier.value)
    if (result === undefined) {
      throw new Error(`Unrecognized variable: ${identifier.value}`)
    }
    return result
  }

  private visitVariableAccess(variableAccess: VariableAccess): any {
    if (isAIdentifier(variableAccess.left)) {
      return this.visitIdentifier(variableAccess.left)
    }
    throw new Error('Unhandled variable access case')
  }

  private visitUnaryExpression(expression: UnaryExpression): any {
    switch (expression.operator) {
      case '!':
        return !this.visitExpression(expression.value)
      case '-':
        return -this.visitExpression(expression.value)
    }
  }

  private visitBinaryExpression({
    left,
    operator,
    right,
  }: BinaryExpression): any {
    switch (operator) {
      case '!=':
        return this.visitExpression(left) !== this.visitExpression(right)
      case '==':
        return this.visitExpression(left) === this.visitExpression(right)
      case '*':
        return this.visitExpression(left) * this.visitExpression(right)
      case '/':
        return this.visitExpression(left) / this.visitExpression(right)
      case '+':
        return this.visitExpression(left) + this.visitExpression(right)
      case '-':
        return this.visitExpression(left) - this.visitExpression(right)
      case '<':
        return this.visitExpression(left) < this.visitExpression(right)
      case '<=':
        return this.visitExpression(left) <= this.visitExpression(right)
      case '>':
        return this.visitExpression(left) > this.visitExpression(right)
      case '>=':
        return this.visitExpression(left) >= this.visitExpression(right)
      case '|':
        return this.visitExpression(right)(this.visitExpression(left))
    }
  }

  private visitBooleanExpression(expression: BooleanExpression) {
    return expression.value
  }

  private visitStringExpression(expression: StringExpression) {
    return expression.value
  }

  private visitFunctionExpression(func: FunctionExpression) {
    return func
  }

  private visitFunctionCall(call: FunctionCall) {
    const func = this.visitVariableAccess(call.variable)
    return this.executeFunction(func as any, call.argumentList.arguments)
  }

  private visitNumberExpression(num: NumberExpression) {
    return num.value
  }

  private executeFunction(
    node: Node | ((...args: any[]) => any),
    args: unknown[]
  ): any {
    if (isANode(node)) {
      if (isAFunctionExpression(node)) {
        // TODO: Create a new scope
        for (let i = 0; i < node.parameterList.parameters.length; i++) {
          const parameter = node.parameterList.parameters[i]
          const argument = args[i]
          globalScope.setValue(
            parameter.name.value,
            isAnArgument(argument)
              ? this.visitExpression(argument.value)
              : argument
          )
        }
        return this.visitBlock(node.body)
      } else if (isAVariableAccess(node)) {
        return this.executeFunction(this.visitVariableAccess(node), args)
      } else {
        throw new Error(`Unhandled node type: ${node.__type}`)
      }
    }

    const result = (node as any).call(null, args[0])
    return args
      .slice(1)
      .reduce(
        (result, arg) => this.executeFunction(result as any, [arg]),
        result
      )
  }
}
