export interface FunctionDefinition {
  in: Array<"number" | "string" | "string | number">, // B, A, ....
  out: Array<"number" | "string" | "string | number">,
}

export const function_typedefs: { [key: string]: FunctionDefinition } = {
  "nop": {
    in: [],
    out: []
  },
  "pop": {
    in: ["string | number"],
    out: []
  },
  "+": {
    in: ["number", "number"],
    out: ["number"],
  },
  "plus": {
    in: ["number", "number"],
    out: ["number"],
  },
  "-": {
    in: ["number", "number"],
    out: ["number"],
  },
  "min": {
    in: ["number", "number"],
    out: ["number"],
  },
  "*": {
    in: ["number", "number"],
    out: ["number"],
  },
  "mul": {
    in: ["number", "number"],
    out: ["number"],
  },
  "or": {
    in: ["number", "number"],
    out: ["number"],
  },
  "and": {
    in: ["number", "number"],
    out: ["number"],
  },
  "lt": {
    in: ["number", "number"],
    out: ["number"],
  },
  "gt": {
    in: ["number", "number"],
    out: ["number"],
  },
  "not": {
    in: ["number"],
    out: ["number"],
  },
  "jz": {
    in: ["number"],
    out: [],
  },
  "jgz": {
    in: ["number"],
    out: [],
  },
  "dup": {
    in: ["string | number"],
    out: ["string | number", "string | number"],
  },
  "eq": {
    in: ["string | number", "string | number"],
    out: ["number"],
  },
  "goto": {
    in: ["string | number"],
    out: [],
  },
  "delContext": {
    in: ["string"],
    out: [],
  },
  "setContext": {
    in: ["string | number", "string"],
    out: [],
  },
  "getContext": {
    in: ["string | number"],
    out: ["string | number"],
  },
  "{": {
    in: [],
    out: [],
  },
  "}": {
    in: [],
    out: [],
  },
  "exit": {
    in: [],
    out: [],
  },
  "pause": {
    in: [],
    out: [],
  },
  "ppc": {
    in: [],
    out: ["number"],
  },
  "stacksize": {
    in: [],
    out: ["number"],
  },
  "charCode": {
    in: ["number"],
    out: ["string"],
  },
  "concat": {
    in: ["string", "string"],
    out: ["string"],
  },
  "rconcat": {
    in: ["string", "string"],
    out: ["string"],
  },
  "randInt": {
    in: ["number"],
    out: ["number"],
  },
}