import { Instruction, Tokenizer, LabelMap } from "tzo";
import { Analyzer } from "./analyze";

function AnalyzeStdRepCode(instructions: Instruction[], initialLabelMap?: LabelMap) {
  if (initialLabelMap === undefined) {
    initialLabelMap = {};
  }
  const analyzer = new Analyzer(instructions);
  return analyzer.getExpressions();
}

function AnalyzeConciseTextCode(codeBlock: string, initialLabelMap?: LabelMap) {
  if (initialLabelMap === undefined) {
    initialLabelMap = {};
  }
  const tokenizer = new Tokenizer();
  const instructions = tokenizer.transform(tokenizer.tokenize(codeBlock));
  const analyzer = new Analyzer(instructions);
  return analyzer.getExpressions();
}

test('should be capable of analyzing literals', () => {
  expect(AnalyzeConciseTextCode(`1 2 "hamster"`)).toEqual([
    expect.objectContaining({
      type: 'number_literal',
      value: 1
    }),
    expect.objectContaining({
      type: 'number_literal',
      value: 2
    }),
    expect.objectContaining({
      type: 'string_literal',
      value: "hamster"
    })
  ]);
});

test('should be capable of analyzing opcodes without arguments', () => {
  expect(AnalyzeConciseTextCode(`nop exit`)).toEqual([
    expect.objectContaining({
      type: 'function',
      value: 'nop',
      consumes: 0,
      produces: 0,
    }),
    expect.objectContaining({
      type: 'function',
      value: 'exit',
      consumes: 0,
      produces: 0,
    })
  ]);
});

test('should be capable of analyzing a simple single-instruction program', () => {
  expect(AnalyzeConciseTextCode(`1 2 +`)).toEqual([expect.objectContaining({
    type: 'function',
    value: '+',
    children: [
      expect.objectContaining({
        type: 'number_literal',
        value: 1
      }),
      expect.objectContaining({
        type: 'number_literal',
        value: 2
      })
    ]
  })]);
});

test('should be capable of analyzing more complicated nested-instruction programs', () => {
  expect(AnalyzeConciseTextCode(`1 2 + 3 +`)).toEqual([expect.objectContaining({
    type: 'function',
    value: '+',
    children: [
      expect.objectContaining({
        type: 'function',
        value: '+',
        children: [
          expect.objectContaining({
            type: 'number_literal',
            value: 1
          }),
          expect.objectContaining({
            type: 'number_literal',
            value: 2
          })
        ]
      }),
      expect.objectContaining({
        type: 'number_literal',
        value: 3
      })
    ]
  })]);
});

test('should be capable of analyzing more complicated nested-instruction programs that use non-literals as arguments', () => {
  expect(AnalyzeConciseTextCode(`ppc stacksize + ppc +`)).toEqual([expect.objectContaining({
    type: 'function',
    value: '+',
    children: [
      expect.objectContaining({
        type: 'function',
        value: '+',
        children: [
          expect.objectContaining({
            type: 'function',
            value: 'ppc',
          }),
          expect.objectContaining({
            type: 'function',
            value: 'stacksize',
          })
        ]
      }),
      expect.objectContaining({
        type: 'function',
        value: 'ppc',
      })
    ]
  })]);
});

test('should be capable of analyzing the pop opcode', () => {
  expect(AnalyzeConciseTextCode(`1 pop`)).toEqual([
    expect.objectContaining({
      type: 'function',
      value: 'pop',
      consumes: 1,
      produces: 0,
      children: [
        expect.objectContaining({
          type: 'number_literal',
          value: 1
        }),
      ]
    }),
  ]);
});

test('should be capable of analyzing the dup opcode', () => {
  expect(AnalyzeConciseTextCode(`1 dup`)).toEqual([
    expect.objectContaining({
      type: 'function',
      value: 'dup',
      consumes: 1,
      produces: 2,
      children: [
        expect.objectContaining({
          type: 'number_literal',
          value: 1
        }),
      ]
    }),
  ]);
});

test('should be capable of analyzing blocks', () => {
  expect(AnalyzeConciseTextCode(`{ 1 2 }`)).toEqual([
    expect.objectContaining({
      type: 'block',
      value: '{}',
      consumes: 0, // blocks sum the `consumes` of their children
      produces: 2, // blocks sum the `produces` of their children
      children: [
        expect.objectContaining({
          type: 'number_literal',
          value: 1,
          consumes: 0,
          produces: 1,
        }),
        expect.objectContaining({
          type: 'number_literal',
          value: 2,
          consumes: 0,
          produces: 1
        })
      ]
    }),
  ]);
});