import * as fs from 'fs'
import * as path from 'path'
import {
  AOCFunction,
  FunctionCall,
  Identifier,
  isAFunction,
  isAIdentifier,
  isANode,
  NumberExpression,
  Part1,
  Part2,
  PipeExpression,
  Program,
  VariableAccess,
} from './ast'

class Scope {
  private values: Map<string, unknown> = new Map()
  constructor(private readonly parent?: Scope) {}

  getValue(identifier: string): unknown {
    if (this.values.has(identifier)) {
      return this.values.get(identifier)
    }

    const value = this.parent?.getValue(identifier)
    if (value === undefined) {
      return null
    }
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
  }

  execute() {
    this.visitProgram(this.program)
  }

  private visitProgram(program: Program) {
    console.log('Part 1')
    console.log(this.visitPart(program.part1))

    if (program.part2) {
      console.log('Part 2')
      console.log(this.visitPart(program.part2))
    }
  }

  private visitPart(part: Part1 | Part2): unknown {
    let lastExpression = null
    for (const expression of part.body.expressions) {
      lastExpression = this[`visit${expression.__type}`](expression as any)
    }
    return lastExpression
  }

  private visitIdentifier(identifier: Identifier) {
    return globalScope.getValue(identifier.value)
  }

  private visitVariableAccess(variableAccess: VariableAccess) {
    if (isAIdentifier(variableAccess.left)) {
      return this.visitIdentifier(variableAccess.left)
    }
    throw new Error('Unhandled variable access case')
  }

  private visitFunction(func: AOCFunction) {
    return func
  }

  private visitFunctionCall(call: FunctionCall) {
    const func = this.visitVariableAccess(call.variable)
    return this.executeFunction(func as any, call.argumentList.arguments)
  }

  private visitNumberExpression(num: NumberExpression) {
    return num.value
  }

  private visitPipeExpression(expression: PipeExpression) {
    throw new Error('Not yet implemented')
  }

  private executeFunction(
    func: AOCFunction | ((...args: any[]) => any),
    args: unknown[]
  ) {
    if (isANode(func) && isAFunction(func)) {
      throw new Error('Not yet implemented')
    }

    // TODO: Make this better
    return (func as any).call(...args)
  }
}
