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
  isAFunctionExpression,
  isAIdentifier,
  isANode,
  Node,
  NumberExpression,
  Program,
  StringExpression,
  UnaryExpression,
  VariableAccess,
  isAVariableAccess,
} from './ast'

const isCallable = (
  value: unknown
): value is ((...args: any[]) => any) & Function => typeof value === 'function'

class Scope {
  private values: Map<string, unknown> = new Map()
  constructor(public readonly parent?: Scope) {}

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

export class Interpreter {
  private activeScope: Scope

  constructor(day: string, private readonly program: Program) {
    this.activeScope = new Scope()
    this.activeScope.setValue('readByLine', () => {
      const p = path.join(process.cwd(), 'data', `${day}.txt`)
      return fs.readFileSync(p).toString().split('\n')
    })

    this.activeScope.setValue('pop', (array: unknown[]) => array.pop())

    this.activeScope.setValue('sortDescending', (array: unknown[]) => {
      const copy = [...array]
      if (copy.length === 0) {
        return copy
      }
      const isNumbers = typeof copy[0] === 'number'
      if (isNumbers) {
        copy.sort((a, b) => (a as number) - (b as number))
      } else {
        copy.sort()
      }
      return copy
    })

    this.activeScope.setValue(
      'map',
      (fnArg: Argument<FunctionExpression>) => (array: unknown[]) =>
        array.map((element) => this.executeFunction(fnArg.value, [element]))
    )

    this.activeScope.setValue(
      'reduce',
      (fnArg: Argument<FunctionExpression>) => (array: unknown[]) =>
        array.reduce((acc, element) =>
          this.executeFunction(fnArg.value, [acc, element])
        )
    )

    this.activeScope.setValue('int', parseInt)
    this.activeScope.setValue('add', (x: number) => (y: number) => x + y)

    this.activeScope.setValue('groupByLineBreak', (lines: string[]) => {
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

  private pushScope() {
    this.activeScope = new Scope(this.activeScope)
  }

  private popScope() {
    const parent = this.activeScope.parent
    if (!parent) {
      throw new Error('Attempted to exit global scope')
    }
    this.activeScope = parent
  }

  private visitProgram(program: Program) {
    console.log('Part 1')
    this.pushScope()
    console.log(this.visitBlock(program.part1.body))
    this.popScope()

    if (program.part2) {
      console.log('Part 2')
      this.pushScope()
      console.log(this.visitBlock(program.part2.body))
      this.popScope()
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
    const result = this.activeScope.getValue(identifier.value)
    if (result === undefined) {
      throw new Error(`Unrecognized variable: ${identifier.value}`)
    }
    return result
  }

  private visitVariableAccess(variableAccess: VariableAccess) {
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
    const fn = (...args: any[]) => {
      this.pushScope()
      for (let i = 0; i < func.parameterList.parameters.length; i++) {
        const parameter = func.parameterList.parameters[i]
        const argument = args[i]
        this.activeScope.setValue(parameter.name.value, argument)
      }
      const result = this.visitBlock(func.body)
      this.popScope()
      return result
    }
    return fn
  }

  private visitFunctionCall(call: FunctionCall) {
    const func = this.visitVariableAccess(call.variable)
    return this.executeFunction(func as any, call.argumentList.arguments)
  }

  private visitNumberExpression(num: NumberExpression) {
    return num.value
  }

  private executeFunction(
    node: Node | (((...args: any[]) => any) & Function),
    args: unknown[]
  ): any {
    if (isANode(node)) {
      if (isAFunctionExpression(node)) {
        return this.executeFunction(this.visitFunctionExpression(node), args)
      } else if (isAVariableAccess(node)) {
        const value = this.visitVariableAccess(node)
        if (isCallable(value) || isAFunctionExpression(value)) {
          return this.executeFunction(value, args)
        }

        // TODO: Create stringify function for variable accesses
        throw new Error(`Cannot call "${node.left} as a function`)
      } else {
        throw new Error(`Unhandled node type: ${node.__type}`)
      }
    } else if (typeof node === 'function') {
      const result = node.call(null, args[0])
      return args
        .slice(1)
        .reduce(
          (result, arg) =>
            isCallable(result) || isANode(result)
              ? this.executeFunction(result, [arg])
              : result,
          result
        )
    } else {
      console.error(node)
      throw new Error(`Unhandled function execution`)
    }
  }
}
