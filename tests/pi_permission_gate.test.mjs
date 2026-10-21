import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

// Setting GATE_PATH to the upstream example proves that confirmation is not denial.
const source = process.env.GATE_PATH
  ? pathToFileURL(process.env.GATE_PATH)
  : new URL('../dot_pi/private_agent/extensions/permission-gate.ts', import.meta.url);
const { default: register } = await import(source.href);
let handler;
register({ on(event, callback) {
  assert.equal(event, 'tool_call');
  assert.equal(handler, undefined);
  handler = callback;
} });
assert.equal(typeof handler, 'function');

for (const hasUI of [true, false]) {
  const ctx = { hasUI, ui: { select() { assert.fail('must never ask for approval'); } } };
  for (const command of [
    'rm -r example', 'rm -rf example', 'rm --recursive example',
    'sudo -n true', 'chmod 777 example', 'chown user:group example777',
    'echo ok && sudo true', 'SUDO true',
  ]) {
    test(`always denies (UI=${hasUI}): ${command}`, async () => {
      const result = await handler({ toolName: 'bash', input: { command } }, ctx);
      assert.equal(result?.block, true);
      assert.match(result.reason, /permission-gate/);
      assert.ok(!result.reason.includes(command), 'do not echo potentially secret command arguments');
    });
  }
  for (const command of ['git status', 'pwd', 'chmod 755 example', 'echo hello']) {
    test(`passes non-matching command (UI=${hasUI}): ${command}`, async () => {
      assert.equal(await handler({ toolName: 'bash', input: { command } }, ctx), undefined);
    });
  }
}

test('does not inspect other tools', async () => {
  assert.equal(await handler({ toolName: 'read', input: {} }, {}), undefined);
});

// Deliberate upstream boundaries: these are NOT covered by this string matcher.
for (const command of ['rm -fr example', 'sh script.sh']) {
  test(`documents upstream detection limit: ${command}`, async () => {
    assert.equal(await handler({ toolName: 'bash', input: { command } }, {}), undefined);
  });
}
