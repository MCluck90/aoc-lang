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
import { singleQuoteString, doubleQuoteString } from 'parsnip-ts/strings'
import { createToken } from 'parsnip-ts/token'
import { ws } from 'parsnip-ts/whitespace'
import {
  AOCFunction,
  createArgument,
  createArgumentList,
  createBlock,
  createBooleanExpression,
  createFunction,
  createFunctionCall,
  createIdentifier,
  createNumberExpression,
  createParameter,
  createParameterList,
  createPart1,
  createPipeExpression,
  createProgram,
  createStringExpression,
  createVariableAccess,
  Expression,
  FunctionCall,
  Identifier,
} from './ast'

const token = createToken(ws)
const between = <T>(
  [start, end]: readonly [Parser<unknown>, Parser<unknown>],
  parser: Parser<T>
): Parser<T> => start.and(parser).bind((result) => end.and(constant(result)))

const _part1Keyword = token(/part_1/y)
const _part2Keyword = token(/part_2/y)
const _trueKeyword = token(/true/y).map(() => true)
const _falseKeyword = token(/false/y).map(() => false)
const _keyword = _part1Keyword
  .or(_part2Keyword)
  .or(_trueKeyword)
  .or(_falseKeyword)

const _parens = [token(/\(/y), token(/\)/y)] as const
const _braces = [token(/{/y), token(/}/y)] as const

const _comma = token(/,/y)
const _fatArrow = token(/=>/y)
const _pipelineOperator = token(/\|/y)
const _equalityOperator = token(/==/y)
const _lessThanOperator = token(/</y)
const _lessThanOrEqualOperator = token(/<=/y)
const _greaterThanOperator = token(/>/y)
const _greaterThanOrEqualOperator = token(/>=/y)
const _multiplyOperator = token(/\*/y)
const _divideOperator = token(/\//y)
const _additionOperator = token(/\+/y)
const _subtractionOperator = token(/-/y)
const _negationOperator = token(/-/y)
const _operator = _pipelineOperator
  .or(_equalityOperator)
  .or(_lessThanOperator)
  .or(_lessThanOrEqualOperator)
  .or(_greaterThanOperator)
  .or(_greaterThanOrEqualOperator)
  .or(_multiplyOperator)
  .or(_divideOperator)
  .or(_additionOperator)
  .or(_subtractionOperator)
  .or(_negationOperator)

const _identifier: Parser<Identifier> = token(/[a-z_][a-z0-9_]*/iy).bind(
  (identifier) =>
    _keyword.matchesToEnd(identifier)
      ? error(`Expected an identifier, got ${identifier}`)
      : constant(createIdentifier(identifier))
)

let _expression: Parser<Expression> = error('Not yet implemented')

const _number = signedSeparatedFloatingPoint
  .or(signedSeparatedInteger)
  .map(createNumberExpression)
const _boolean = _trueKeyword.or(_falseKeyword).map(createBooleanExpression)
const _string = singleQuoteString
  .or(doubleQuoteString)
  .map(createStringExpression)
const _literal = _number.or(_boolean).or(_string)

const _primaryExp = _literal.or(between(_parens, _expression))

const _variableAccess = _identifier.map(createVariableAccess)
let _functionCall: Parser<FunctionCall> = error('Not yet implemented')
let _function: Parser<AOCFunction> = error('Not yet implemented')
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

const _argumentList = between(_parens, maybe(list(_expression, _comma))).map(
  (args) => createArgumentList((args || []).map(createArgument))
)

_functionCall = _variableAccess.bind((variable) =>
  _argumentList.map((args) => createFunctionCall(variable, args))
)

const _parameter = _identifier.map(createParameter)
const _parameters = between(_parens, maybe(list(_parameter, _comma))).map(
  (params) => createParameterList(params || [])
)

const _block = between(_braces, zeroOrMore(_expression)).map(createBlock)

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
