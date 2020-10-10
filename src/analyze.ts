import { Instruction } from "tzo";
import 'array-flat-polyfill';
import { FunctionDefinition, function_typedefs } from "./function_typedefs";


interface StringLiteral {
  type: "string_literal",
  value: string,
  consumes: number,
  produces: number,
}

interface NumberLiteral {
  type: "number_literal",
  value: number,
  consumes: number,
  produces: number,
}

interface Func {
  type: "function",
  children: O[],
  consumes: number,
  produces: number,
}

interface Block {
  type: "block",
  children: O[],
  consumes: number,
  produces: number,
}

type O = Func | Block | StringLiteral | NumberLiteral;

export class Analyzer {
  input: Instruction[] = undefined;
  items = [];
  lowest_i: number = undefined;
  typedefs: { [key: string]: FunctionDefinition } = {};

  constructor(input: Instruction[], additionalTypedefs?: { [key: string]: FunctionDefinition }) {
    this.input = input;
    additionalTypedefs !== undefined ? additionalTypedefs : {};
    this.typedefs = { ...function_typedefs, ...additionalTypedefs }
    this.lowest_i = input.length;
    while (this.lowest_i - 1 >= 0) {
      const analyzed = this.analyze(input, this.lowest_i - 1);
      this.items.unshift(analyzed);
    }
    this.items = this.items.filter(i => i !== undefined);
  }

  analyze: (input: Instruction[], i: number) => O = (input, i) => {
    let instr = input[i];
    this.lowest_i = Math.min(this.lowest_i, i);
    if (instr.type === "push-number-instruction") {
      return {
        type: "number_literal",
        value: instr.value,
        consumes: 0,
        produces: 1
      }
    }
    if (instr.type === "push-string-instruction") {
      return {
        type: "string_literal",
        value: instr.value,
        consumes: 0,
        produces: 1
      }
    }
    if (instr.type === "invoke-function-instruction" && instr.functionName === "}") {
      let iterDepth = 1;
      let ii = i - 1;
      let children = [];
      while (ii >= 0) {
        let iinstr = input[ii];
        if (iinstr.type === "invoke-function-instruction") {
          if (iinstr.functionName === "{") {
            iterDepth -= 1;
            if (iterDepth === 0) {
              break;
            }
          } else if (iinstr.functionName === "}") {
            iterDepth += 1;
          }
        }
        children.unshift(this.analyze(input, ii));
        if (ii < 0) {
          throw new Error("Unterminated }!");
        }
        ii--;
      }
      children = children.filter(z => z !== undefined);
      return {
        type: "block",
        value: "{}",
        children,
        consumes: children.reduce((memo, c) => {
          return memo + c.consumes;
        }, 0),
        produces: children.reduce((memo, c) => {
          return memo + c.produces;
        }, 0)
      };
    }
    if (instr.type === "invoke-function-instruction" && instr.functionName === "{") {
      return undefined;
    }
    if (instr.type === "invoke-function-instruction") {
      const tdef = this.typedefs[instr.functionName];
      if (tdef) {
        const children = tdef.in.map((t, t_i, arr) => {
          return this.analyze(input, i - arr.length + t_i);
        }).filter(z => z !== undefined);
        return {
          type: "function",
          value: instr.functionName,
          children,
          consumes: tdef.in.length,
          children_consumes: children.reduce((memo, c) => {
            return memo + c.consumes;
          }, 0),
          produces: tdef.out.length,
          children_produces: children.reduce((memo, c) => {
            return memo + c.produces;
          }, 0)
        };
      } else {
        throw new Error(`Could not find typedef for function: ${instr.functionName}`);
      }
    }
  }

  getJSON() {
    return JSON.stringify(this.items, null, 2);
  }

}