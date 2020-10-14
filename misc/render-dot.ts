import { graphviz } from "node-graphviz";
import fs from "fs";


async function render(filename) {
  const result = await graphviz.dot(fs.readFileSync(`./examples/dot/src/${filename}.dot`).toString(), 'svg');
  fs.writeFileSync(`./examples/dot/${filename}.svg`, result, 'binary');
}

async function main() {
  await render('ifelse');
  await render('helloworld');
}

main().then(console.log).catch(console.error);
