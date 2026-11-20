const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.join(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'src/lib/mind-check.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleRef = { exports: {} };
vm.runInNewContext(compiled, { module: moduleRef, exports: moduleRef.exports });
const { isAnswered, firstUnansweredIndex, scoreConcerns } = moduleRef.exports;
const instrument = require('../../src/lib/mind-check-questions.json');
const concerns = instrument.concerns;

test('instrument has exactly 10 concerns and 70 unique original questions', () => {
  assert.equal(concerns.length, 10);
  assert.ok(concerns.every(concern => concern.questions.length === 7));
  const ids = concerns.flatMap(concern => concern.questions.map(question => question.id));
  assert.equal(ids.length, 70);
  assert.equal(new Set(ids).size, 70);
});

test('zero is an explicit answer and unanswered items block completion', () => {
  assert.equal(isAnswered(0), true);
  assert.equal(isAnswered(undefined), false);
  const questions = concerns[0].questions;
  const answers = Object.fromEntries(questions.slice(0, 6).map(question => [question.id, 0]));
  assert.equal(firstUnansweredIndex(questions, answers), 6);
  assert.equal(scoreConcerns(concerns, [concerns[0].id], answers)[0].count, 6);
  answers[questions[6].id] = 0;
  assert.equal(firstUnansweredIndex(questions, answers), -1);
  assert.equal(scoreConcerns(concerns, [concerns[0].id], answers)[0].score, 0);
});

test('back edits recalculate and multiple selected concerns sort by total', () => {
  const selected = [concerns[0], concerns[1]];
  const answers = Object.fromEntries(selected.flatMap(concern => concern.questions.map(question => [question.id, concern.id === concerns[0].id ? 1 : 3])));
  let results = scoreConcerns(concerns, selected.map(concern => concern.id), answers);
  assert.deepEqual(Array.from(results, result => result.score), [21, 7]);
  assert.equal(results[0].id, concerns[1].id);
  for (const question of selected[0].questions) answers[question.id] = 4;
  results = scoreConcerns(concerns, selected.map(concern => concern.id), answers);
  assert.deepEqual(Array.from(results, result => result.score), [28, 21]);
  assert.equal(results[0].id, concerns[0].id);
  assert.equal(results[0].max, 28);
});
