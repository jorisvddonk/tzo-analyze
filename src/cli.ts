import fs from "fs";
import program from "commander";
import { Analyzer } from "./analyze";
import { Instruction, Tokenizer, TzoVMState } from "tzo";
import { graphviz } from "node-graphviz";

program
  .version('1.0.5')
  .option('--input <path>', "Path to Tzo VMState .json file or .tzoct file")
  .option('--fdef <path...>', "Load additional function definition .json file")
  .option('--output <path>', "Save analyzed .json here, or stdout if '-'")
  .option('--dot <path>', "Save syntax tree .dot file here")
  .option('--svg <path>', "Save syntax tree .svg file here")
  .option('--plist-dot <path>', "Save program list .dot file here")
  .option('--plist-svg <path>', "Save program list .svg file here")
  .option('--outvm <path>', "Save VMState .json file here")
  .parse(process.argv);

let add_Typedefs = {};
if (program.fdef) {
  for (let f of program.fdef) {
    const z = JSON.parse(fs.readFileSync(f).toString());
    add_Typedefs = { ...add_Typedefs, ...z };
  }
}

let input: Instruction[] = [];
if (program.input && program.input.endsWith(".json")) {
  const input_file = JSON.parse(fs.readFileSync(program.input).toString());
  input = input_file.programList;
}
if (program.input && (program.input.endsWith(".txt") || program.input.endsWith(".tzoct"))) {
  const input_file = fs.readFileSync(program.input).toString();
  const tokenizer = new Tokenizer();
  input = tokenizer.transform(tokenizer.tokenize(input_file));
}
const analyzer = new Analyzer(input, add_Typedefs);

const out = JSON.stringify(analyzer.getExpressions(), null, 2);
if (program.output === "-") {
  console.log(out);
} else if (program.output !== undefined) {
  fs.writeFileSync(program.output, out);
}

if (program.outvm) {
  fs.writeFileSync(program.outvm, JSON.stringify({
    programCounter: 0,
    exit: false,
    pause: false,
    labelMap: {},
    stack: [],
    context: {},
    programList: input
  } as TzoVMState, null, 2));
}

if (program.dot) {
  fs.writeFileSync(program.dot, analyzer.getTreeAsDot().toString());
}
if (program.svg) {
  graphviz.dot(analyzer.getTreeAsDot().toString(), 'svg').then(result => {
    fs.writeFileSync(program.svg, result, 'binary');
  }).catch(console.error);
}

if (program.plistDot) {
  fs.writeFileSync(program.plistDot, analyzer.getProgramListAsDot().toString());
}
if (program.plistSvg) {
  graphviz.dot(analyzer.getProgramListAsDot().toString(), 'svg').then(result => {
    fs.writeFileSync(program.plistSvg, result, 'binary');
  }).catch(console.error);
}
