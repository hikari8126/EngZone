import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const sourcePath = path.resolve("client/lib/shuffle.ts");

function loadShuffle() {
  if (!fs.existsSync(sourcePath)) return undefined;
  const source = fs.readFileSync(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function("exports", "module", output)(module.exports, module);
  return module.exports.shuffle;
}

test("shuffle returns a new deterministic ordering without losing items", () => {
  const shuffle = loadShuffle();

  assert.equal(typeof shuffle, "function");
  const input = ["one", "two", "three"];
  const output = shuffle(input, () => 0);

  assert.notEqual(output, input);
  assert.deepEqual(output, ["two", "three", "one"]);
  assert.deepEqual(input, ["one", "two", "three"]);
});
