export interface BaseExpression {
  consumes: number,
  produces: number,
  label?: string,
}

export interface StringLiteral extends BaseExpression {
  type: "string_literal",
  value: string,
}

export interface NumberLiteral extends BaseExpression {
  type: "number_literal",
  value: number,
}

export interface Func extends BaseExpression {
  type: "function",
  value: string,
  children: Expression[],
}

export interface Block extends BaseExpression {
  type: "block",
  value: string,
  children: Expression[],
}

export type Expression = Func | Block | StringLiteral | NumberLiteral;