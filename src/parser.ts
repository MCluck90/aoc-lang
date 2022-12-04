import {
  error,
  constant,
  list,
  zeroOrMore,
  maybe,
  lazy,
  Parser,
} from 'parsnip-ts'
import { cStyleComment } from 'parsnip-ts/comments'
import {
  signedSeparatedFloatingPoint,
  signedSeparatedInteger,
} from 'parsnip-ts/numbers'
import { createToken } from 'parsnip-ts/token'
import { ws } from 'parsnip-ts/whitespace'
import {
  AOCFunction,
  createArgument,
  createArgumentList,
  createBlock,
  createFunction,
  createFunctionCall,
  createIdentifier,
  createNumberExpression,
  createParameter,
  createParameterList,
  createPart1,
  createPipeExpression,
  createProgram,
  createVariableAccess,
  Expression,
  FunctionCall,
} from './ast'

const token = createToken(ws)

const _part1Keyword = token(/part_1/y)
const _part2Keyword = token(/part_2/y)

const _openParen = token(/\(/y)
const _closeParen = token(/\)/y)
const _openBrace = token(/{/y)
const _closeBrace = token(/}/y)
const _comma = token(/,/y)
const _fatArrow = token(/=>/y)
const _pipelineOperator = token(/\|/y)

const _identifier = token(/[a-z_][a-z0-9_]*/iy).map(createIdentifier)
const _number = signedSeparatedFloatingPoint
  .or(signedSeparatedInteger)
  .map(createNumberExpression)

const _variableAccess = _identifier.map(createVariableAccess)
let _functionCall: Parser<FunctionCall> = error('Not yet implemented')
let _function: Parser<AOCFunction> = error('Not yet implemented')
let _expression: Parser<Expression> = error('Not yet implemented')
_expression = _number
  .or(lazy(() => _functionCall))
  .or(_variableAccess)
  .or(lazy(() => _function))
  .bind((expression) =>
    maybe(
      _pipelineOperator.and(
        lazy(() => _expression).map((right) =>
          createPipeExpression(expression, right)
        )
      )
    ).bind((maybePipe) => constant(maybePipe || expression))
  )

const _argumentList = _openParen
  .and(maybe(list(_expression, _comma)))
  .bind((args) =>
    _closeParen.and(
      constant(createArgumentList((args ?? []).map(createArgument)))
    )
  )
_functionCall = _variableAccess.bind((variable) =>
  _argumentList.map((args) => createFunctionCall(variable, args))
)

const _parameter = _identifier.map(createParameter)
const _parameters = _openParen.and(
  maybe(list(_parameter, _comma)).bind((params) =>
    _closeParen.and(constant(createParameterList(params ?? [])))
  )
)

const _block = _openBrace
  .and(zeroOrMore(_expression))
  .bind((expressions) => _closeBrace.and(constant(createBlock(expressions))))

_function = _parameters.bind((parameterList) =>
  _fatArrow.and(_block).map((body) => createFunction(parameterList, body))
)

const _part1 = _part1Keyword.and(_block).map(createPart1)

export const parseAOC = (input: string) =>
  ws
    .skip(maybe(cStyleComment))
    .and(_part1)
    .bind((part1) => ws.skip(maybe(cStyleComment)).and(constant(part1)))
    .map((part1) => createProgram(part1))
    .parseToEnd(input)
