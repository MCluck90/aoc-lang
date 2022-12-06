import * as fs from 'fs'
import * as path from 'path'
import { Argument, FunctionExpression } from './ast'
import { Interpreter } from './interpreter'
import { Scope } from './scope'

export const createGlobalScope = (
  day: string,
  interpreter: Interpreter
): Scope => {
  const globalScope = new Scope()
  globalScope.setValue('readByLine', () => {
    const p = path.join(process.cwd(), 'data', `${day}.txt`)
    return fs.readFileSync(p).toString().split('\n')
  })

  globalScope.setValue('pop', (array: unknown[]) => array.pop())

  globalScope.setValue('sortDescending', (array: unknown[]) => {
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

  globalScope.setValue(
    'map',
    (fnArg: Argument<FunctionExpression>) => (array: unknown[]) =>
      array.map((element) =>
        interpreter.executeFunction(fnArg.value, [element])
      )
  )

  globalScope.setValue(
    'reduce',
    (fnArg: Argument<FunctionExpression>) => (array: unknown[]) =>
      array.reduce((acc, element) =>
        interpreter.executeFunction(fnArg.value, [acc, element])
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
  return globalScope
}
