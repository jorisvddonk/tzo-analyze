import { graphviz } from "node-graphviz";
import fs from "fs";

async function main() {
  const result = await graphviz.dot(fs.readFileSync('./examples/dot/src/ifelse.dot').toString(), 'svg');
  fs.writeFileSync('./examples/dot/ifelse.svg', result, 'binary');
}

main().then(console.log).catch(console.error);
