import {
  error,
  constant,
  list,
  zeroOrMore,
  maybe,
  lazy,
  Parser,
  pair,
} from 'parsnip-ts'
import { cStyleComment } from 'parsnip-ts/comments'
import { seq } from 'parsnip-ts/seq'
import { separatedFloatingPoint, separatedInteger } from 'parsnip-ts/numbers'
import { singleQuoteString, doubleQuoteString } from 'parsnip-ts/strings'
import { createToken } from 'parsnip-ts/token'
import { ws } from 'parsnip-ts/whitespace'
import {
  FunctionExpression,
  createArgument,
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
  Expression,
  FunctionCall,
  Identifier,
  isAExpression,
  createPart2,
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
const _pipelineOperator = token(/\|/y) as Parser<'|'>
const _equalOperator = token(/==/y) as Parser<'=='>
const _notEqualOperator = token(/!=/y) as Parser<'!='>
const _lessThanOperator = token(/</y) as Parser<'<'>
const _lessThanOrEqualOperator = token(/<=/y) as Parser<'<='>
const _greaterThanOperator = token(/>/y) as Parser<'>'>
const _greaterThanOrEqualOperator = token(/>=/y) as Parser<'>='>
const _multiplyOperator = token(/\*/y) as Parser<'*'>
const _divideOperator = token(/\//y) as Parser<'/'>
const _additionOperator = token(/\+/y) as Parser<'+'>
const _subtractionOperator = token(/-/y) as Parser<'-'>
const _negationOperator = token(/!/y) as Parser<'!'>
const _terminationOperator = token(/;/y) as Parser<';'>

const _identifier: Parser<Identifier> = token(/[a-z_][a-z0-9_]*/iy).bind(
  (identifier) =>
    _keyword.matchesToEnd(identifier)
      ? error(`Expected an identifier, got ${identifier}`)
      : constant(createIdentifier(identifier))
)

export let _expression: Parser<Expression> = error('Not yet implemented')

const _number = ws
  .and(separatedFloatingPoint.or(separatedInteger))
  .map(createNumberExpression)
const _boolean = _trueKeyword.or(_falseKeyword).map(createBooleanExpression)
const _string = ws
  .and(singleQuoteString.or(doubleQuoteString))
  .map(createStringExpression)
const _literal = _number.or(_boolean).or(_string)

const _variableAccess = _identifier.map(createVariableAccess)
let _functionCall: Parser<FunctionCall> = error('Not yet implemented')
let _functionExpression: Parser<FunctionExpression> = error(
  'Not yet implemented'
)

const _primaryExp = _literal
  .or(lazy(() => _functionExpression))
  .or(lazy(() => _functionCall))
  .or(_variableAccess)
  .or(
    between(
      _parens,
      lazy(() => _expression)
    )
  )

const _unary = seq([_negationOperator.or(_subtractionOperator), _primaryExp])
  .map(([operator, value]) => createUnaryExpression(operator, value))
  .or(_primaryExp)

const _factor = _unary.bind((left) =>
  zeroOrMore(pair(_divideOperator.or(_multiplyOperator), _unary)).map(
    (rightSides) =>
      rightSides.length === 0
        ? left
        : rightSides.reduce(
            (acc, [operator, right]) =>
              createBinaryExpression(acc, operator, right),
            left
          )
  )
)

const _term = _factor.bind((left) =>
  zeroOrMore(pair(_additionOperator.or(_subtractionOperator), _factor)).map(
    (rightSides) =>
      rightSides.length === 0
        ? left
        : rightSides.reduce(
            (acc, [operator, right]) =>
              createBinaryExpression(acc, operator, right),
            left
          )
  )
)

const _comparison = _term.bind((left) =>
  zeroOrMore(
    pair(
      _lessThanOrEqualOperator
        .or(_greaterThanOrEqualOperator)
        .or(_lessThanOperator)
        .or(_greaterThanOperator),
      _unary
    )
  ).map((rightSides) =>
    rightSides.length === 0
      ? left
      : rightSides.reduce(
          (acc, [operator, right]) =>
            createBinaryExpression(acc, operator, right),
          left
        )
  )
)

const _equality = _comparison.bind((left) =>
  zeroOrMore(pair(_equalOperator.or(_notEqualOperator), _comparison)).map(
    (rightSides) =>
      rightSides.length === 0
        ? left
        : rightSides.reduce(
            (acc, [operator, right]) =>
              createBinaryExpression(acc, operator, right),
            left
          )
  )
)

const _pipeline = _equality.bind((left) =>
  zeroOrMore(pair(_pipelineOperator, _equality)).map((rightSides) =>
    rightSides.length === 0
      ? left
      : rightSides.reduce(
          (acc, [operator, right]) =>
            createBinaryExpression(acc, operator, right),
          left
        )
  )
)

_expression = _pipeline

const _argumentList = between(_parens, maybe(list(_expression, _comma))).map(
  (args) => createArgumentList((args || []).map(createArgument))
)

_functionCall = seq([_variableAccess, _argumentList]).map(([variable, args]) =>
  createFunctionCall(variable, args)
)

const _parameter = _identifier.map(createParameter)
const _parameterList = between(_parens, maybe(list(_parameter, _comma))).map(
  (params) => createParameterList(params || [])
)

const _block = between(
  _braces,
  zeroOrMore(_terminationOperator.or(_expression)).map((expressions) =>
    expressions.filter(isAExpression)
  )
).map(createBlock)

_functionExpression = seq([_parameterList, _fatArrow, _block]).map(
  ([parameterList, _, body]) => createFunctionExpression(parameterList, body)
)

const _part1 = _part1Keyword.and(_block).map(createPart1)
const _part2 = _part2Keyword.and(_block).map(createPart2)

export const parseAOC = (input: string) =>
  seq([
    ws.skip(maybe(cStyleComment)).and(_part1),
    ws.skip(maybe(cStyleComment)).and(maybe(_part2)),
    ws.skip(maybe(cStyleComment)),
  ])
    .map(([part1, part2]) => createProgram(part1, part2))
    .parseToEnd(input)
