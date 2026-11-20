const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.join(__dirname, '../..');
const instrument = require('../../src/lib/mind-check-questions.json');

function load(file, dependencies) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const moduleRef = { exports: {} };
  vm.runInNewContext(compiled, { module: moduleRef, exports: moduleRef.exports, require: name => dependencies[name] });
  return moduleRef.exports;
}

const scoring = load('src/lib/mind-check.ts', {});
const { REFLECTIONS, buildReflection } = load('src/lib/mind-check-reflections.ts', {
  '@/lib/mind-check-questions.json': { default: instrument },
  '@/lib/mind-check': scoring,
});

test('every concern has a distinct complete reflection and seven specific patterns', () => {
  const ids = instrument.concerns.map(concern => concern.id);
  assert.deepEqual(Object.keys(REFLECTIONS).sort(), ids.sort());
  assert.equal(new Set(Object.values(REFLECTIONS).map(item => item.headline)).size, 10);
  for (const concern of instrument.concerns) {
    const content = REFLECTIONS[concern.id];
    assert.equal(content.patterns.length, concern.questions.length);
    assert.ok(content.opening && content.quietNote && content.question && content.nextStep);
    assert.equal(new Set(content.patterns.map(item => item.title)).size, 7);
  }
});

test('result reflects actual chosen answers without borrowing another concern', () => {
  const concern = instrument.concerns[0];
  const answers = Object.fromEntries(concern.questions.map(question => [question.id, 0]));
  answers[concern.questions[1].id] = 4;
  answers[concern.questions[5].id] = 3;
  answers[instrument.concerns[1].questions[0].id] = 4;
  const reflection = buildReflection(concern, answers);
  assert.equal(reflection.standouts.length, 2);
  assert.equal(reflection.standouts[0].frequency, 'Almost always');
  assert.equal(reflection.standouts[0].question, concern.questions[1].text);
  assert.equal(reflection.standouts[1].frequency, 'Often');
  assert.equal(reflection.standouts[1].question, concern.questions[5].text);
});

test('all zero answers produce a quiet reflection without false highlights', () => {
  for (const concern of instrument.concerns) {
    const answers = Object.fromEntries(concern.questions.map(question => [question.id, 0]));
    const reflection = buildReflection(concern, answers);
    assert.equal(reflection.standouts.length, 0);
    assert.ok(reflection.quietNote.length > 40);
  }
});
