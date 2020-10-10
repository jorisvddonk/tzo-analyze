export interface StringLiteral {
  type: "string_literal",
  value: string,
  consumes: number,
  produces: number,
}

export interface NumberLiteral {
  type: "number_literal",
  value: number,
  consumes: number,
  produces: number,
}

export interface Func {
  type: "function",
  children: O[],
  consumes: number,
  produces: number,
}

export interface Block {
  type: "block",
  children: O[],
  consumes: number,
  produces: number,
}

export type Expression = Func | Block | StringLiteral | NumberLiteral;