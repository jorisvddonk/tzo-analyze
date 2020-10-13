import { Instruction } from "tzo";
import 'array-flat-polyfill';
import { FunctionDefinition, function_typedefs } from "./function_typedefs";
import { Block, Expression, Func, NumberLiteral, StringLiteral } from "./interfaces";


export class Analyzer {
  input: Instruction[] = undefined;
  expressions: Expression[];
  lowest_i: number = undefined;
  typedefs: { [key: string]: FunctionDefinition } = {};

  constructor(input: Instruction[], additionalTypedefs?: { [key: string]: FunctionDefinition }) {
    // Build the type definitions, using the additional type definitions if supplied.
    additionalTypedefs !== undefined ? additionalTypedefs : {};
    this.typedefs = { ...function_typedefs, ...additionalTypedefs }

    // Set a few local variables, to be used during analysis
    this.input = input;
    this.lowest_i = input.length;

    // Analyze the input instructions, starting from the back of the list of instructions (since we're analyzing a stack machine),
    //  emitting expressions into the return items array when a complete item has been built from the source input array.
    this.expressions = [];
    while (this.lowest_i - 1 >= 0) {
      const expression = this.analyze(this.lowest_i - 1); // will mutate `this.lowest_i`
      if (expression !== undefined) { // certain instructions, e.g. `{`, will by themselves be returned as `undefined` by the analyze function.
        this.expressions.unshift(expression);
      }
    }
  }

  /**
   * Return a single, fully formed Expression based on a series of input Tzo Instructions.
   * 
   * e.g. for the instruction list:
   * `1 2 +`
   * this function will return an expression like this (since `+` is known to be a function consuming two numbers):
   * {
   *   type: function
   *   value: +
   *   children: [ { type: number_literal, value: 1 }, { type: number_literal, value: 2} ]
   * }
   * 
   * and for the instruction list:
   * `1 2 + 3 +`
   * this will return:
   * {
   *   type: function
   *   value: +
   *   children: [ { type: function, value: +, children: [ { type: number_literal, value: 1 }, { type: number_literal, value: 2 } ] }, { type: number_literal, value: 3 } ]
   * }
   * 
   * Note: this function is recursive, and will mutate `this.lowest_i`
   * @param i offset in the input Instruction array to start analysis from.
   */
  private analyze: (i: number) => Expression = (i) => {
    let instr = this.input[i];
    this.lowest_i = Math.min(this.lowest_i, i); // ensure that `this.lowest_i` is set to the lowest ever-seen instruction index, so that a next iteration of the analysis loop in the constructor starts at the right index.

    // for push-number Tzo instructions, emit a simple number literal.
    if (instr.type === "push-number-instruction") {
      return {
        type: "number_literal",
        value: instr.value,
        consumes: 0,
        produces: 1
      } as NumberLiteral;
    }
    // for push-string Tzo instructions, emit a simple string literal.
    if (instr.type === "push-string-instruction") {
      return {
        type: "string_literal",
        value: instr.value,
        consumes: 0,
        produces: 1
      } as StringLiteral;
    }

    // } function instructions have to be handled somewhat separately, as - in practice - they create what is effectively a block of code in Tzo that can be jumped over or into.
    if (instr.type === "invoke-function-instruction" && instr.functionName === "}") {
      // set up some bookkeeping. This is used to be able to find and capture children of this block.
      let blockDepth = 1;
      let ii = i - 1;
      let children = [];

      // Loop through all of the preceding instructions until we find the matching `{`.
      while (ii >= 0) {
        let iinstr = this.input[ii];
        if (iinstr.type === "invoke-function-instruction") { // { and } can be nested; if we find another } we need to skip the next { we find, until we find the matching { to our originating }
          if (iinstr.functionName === "{") {
            blockDepth -= 1;
            if (blockDepth === 0) {
              // found it! break out of this while loop!
              break;
            }
          } else if (iinstr.functionName === "}") {
            blockDepth += 1;
          }
        }
        children.unshift(this.analyze(ii)); // if we're still here, that means that ii still points to an instruction that's part of the block we're analyzing. Analyze that instruction and add it to the children array!
        if (ii < 0) {
          // oops, we've reached the start of our program! Looks like we've found a } with no matching { :(
          throw new Error("Unterminated }!");
        }
        ii = this.lowest_i - 1; // `this.analyze` above mutated `this.lowest_i`, so we got to reset our ii counter here accordingly to one under the lowest ever seen to continue our analysis process. If we don't do this, then nested blocks will fail to be analyzed correctly!
      }
      children = children.filter(z => z !== undefined); // if we ever found a `{` and analyzed it, that'll return undefined, so filter those values out.
      // finally, return the block Expression
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
      } as Block;
    }

    // leading block instructions are meaningless and were already analyzed / processed as part of the block handling code above, so skip 'em!
    if (instr.type === "invoke-function-instruction" && instr.functionName === "{") {
      return undefined;
    }

    // if we made it here: the only thing left is invoke-function-instructions!
    if (instr.type === "invoke-function-instruction") {
      const tdef = this.typedefs[instr.functionName]; // grab the function definition for this opcode
      if (tdef) {
        // set up some bookkeeping to be able to find opcode parameters later
        let ii = i - 1;
        let children = [];
        // go through all preceding instructions until we find a number of children equal to 
        while (children.filter(c => c !== undefined && c.type !== "block").length < tdef.in.length) { // TODO: hmm.. is this technically correct, or do we need to sum the children's `produces` minus their `consumes` here? I assume that any opcode that ends up producing two MORE than it consumes might be problematic.
          children.unshift(this.analyze(ii)); // add the found child
          if (ii < 0) {
            throw new Error("Missing opcode parameter!");
          }
          ii = this.lowest_i - 1;  // `this.analyze` above mutated `this.lowest_i`, so we got to reset our ii counter here accordingly to one under the lowest ever seen to continue our analysis process. If we don't do this, then nested blocks will fail to be analyzed correctly!
        }
        children = children.filter(f => f !== undefined); // filter out undefined values in the children array. The children array now contains all of this opcode's parameters!
        // return the opcode as a Func expression
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
        } as Func;
      } else {
        throw new Error(`Could not find typedef for function/opcode: ${instr.functionName}`);
      }
    }

    throw new Error(`Could not analyze: ${instr}`); // will never happen; instr is of type `never` now.
  }

  getExpressions() {
    return this.expressions;
  }

}