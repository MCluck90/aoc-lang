import {
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
import { createGlobalScope } from './global'
import { Scope } from './scope'

const isCallable = (
  value: unknown
): value is ((...args: any[]) => any) & Function => typeof value === 'function'

export class Interpreter {
  activeScope: Scope

  constructor(day: string, readonly program: Program) {
    this.activeScope = createGlobalScope(day, this)
  }

  execute() {
    return this.visitProgram(this.program)
  }

  pushScope() {
    this.activeScope = new Scope(this.activeScope)
  }

  popScope() {
    const parent = this.activeScope.parent
    if (!parent) {
      throw new Error('Attempted to exit global scope')
    }
    this.activeScope = parent
  }

  visitProgram(program: Program): { part1: unknown; part2: unknown } {
    this.pushScope()
    const part1 = this.visitBlock(program.part1.body)
    this.popScope()

    let part2
    if (program.part2) {
      this.pushScope()
      part2 = this.visitBlock(program.part2.body)
      this.popScope()
    }
    return { part1, part2 }
  }

  visitBlock(block: Block): unknown {
    let lastExpression = null
    for (const expression of block.expressions) {
      lastExpression = this.visitExpression(expression)
    }
    return lastExpression
  }

  visitExpression(expression: Expression) {
    return this[`visit${expression.__type}`](expression as any)
  }

  visitIdentifier(identifier: Identifier) {
    const result = this.activeScope.getValue(identifier.value)
    if (result === undefined) {
      throw new Error(`Unrecognized variable: ${identifier.value}`)
    }
    return result
  }

  visitVariableAccess(variableAccess: VariableAccess) {
    if (isAIdentifier(variableAccess.left)) {
      return this.visitIdentifier(variableAccess.left)
    }
    throw new Error('Unhandled variable access case')
  }

  visitUnaryExpression(expression: UnaryExpression): any {
    switch (expression.operator) {
      case '!':
        return !this.visitExpression(expression.value)
      case '-':
        return -this.visitExpression(expression.value)
    }
  }

  visitBinaryExpression({ left, operator, right }: BinaryExpression): any {
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
      case '|>':
        return this.visitExpression(right)(this.visitExpression(left))
    }
  }

  visitBooleanExpression(expression: BooleanExpression) {
    return expression.value
  }

  visitStringExpression(expression: StringExpression) {
    return expression.value
  }

  visitFunctionExpression(func: FunctionExpression) {
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

  visitFunctionCall(call: FunctionCall) {
    const func = this.visitVariableAccess(call.variable)
    return this.executeFunction(func as any, call.argumentList.arguments)
  }

  visitNumberExpression(num: NumberExpression) {
    return num.value
  }

  executeFunction(
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
