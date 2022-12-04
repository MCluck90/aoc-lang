import * as fs from 'fs'
import { ParseError } from 'parsnip-ts/error'
import * as path from 'path'
import { Interpreter } from './interpreter'
import { parseAOC } from './parser'

if (process.argv.length !== 3) {
  console.error('Usage: yarn start [day-NN]')
  process.exit(1)
}

const day = process.argv[2]
const pathToSource = path.join(process.cwd(), 'solutions', `${day}.aoc`)
const source = fs.readFileSync(pathToSource).toString()
const program = parseAOC(source)
if (program instanceof ParseError) {
  throw program
}

const interpreter = new Interpreter(day, program)
interpreter.execute()
