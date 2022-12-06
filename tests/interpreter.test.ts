import { Interpreter } from '../src/interpreter'
import { parseAOC } from '../src/parser'
import { assertSuccessfulParse } from './test-utils'

const execute = (source: string) => {
  const program = parseAOC(source)
  assertSuccessfulParse(program)
  const interpreter = new Interpreter('test', program)
  return interpreter.execute()
}

it('should be able to perform addition', () => {
  const { part1 } = execute(`
    part_1 { 1 + 2 }
  `)
  expect(part1).toBe(3)
})

it('should be able to perform subtraction', () => {
  const { part1 } = execute(`
    part_1 { 1 - 2 }
  `)
  expect(part1).toBe(-1)
})

it('should be able to perform multiplication', () => {
  const { part1 } = execute(`
    part_1 { 2 * 3 }
  `)
  expect(part1).toBe(6)
})

it('should be able to perform division', () => {
  const { part1 } = execute(`
    part_1 { 1 / 2 }
  `)
  expect(part1).toBe(0.5)
})

it('should be able to pipeline math', () => {
  const { part1 } = execute(`
    part_1 {
      1 |> +(2)
    }
  `)
  expect(part1).toBe(3)
})
