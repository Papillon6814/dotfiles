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

// A profile snapshot, rather than the process environment, owns each conversation.
function profileContext(id) {
  return {
    sessionManager: {
      getBranch: () => [{ type: 'custom', customType: 'startup-profile-state',
        data: { version: 1, id, label: id, instructions: '' } }],
    },
  };
}
const call = (command, ctx, gate = handler) => gate({ toolName: 'bash', input: { command } }, ctx);

for (const id of ['developer', 'roblox-game']) {
  for (const command of ['gh --version', '/opt/homebrew/bin/gh --version', 'env gh --version',
    'pwd && gh repo list', 'pwd;gh --version', 'pwd\ngh --version', 'command gh --version']) {
    test(`${id} blocks gh: ${command}`, async () => {
      assert.equal((await call(command, profileContext(id)))?.block, true);
    });
  }
  test(`${id} preserves ordinary bash and common prohibitions`, async () => {
    assert.equal(await call('pwd', profileContext(id)), undefined);
    assert.equal((await call('sudo true', profileContext(id)))?.block, true);
    assert.equal(await call('echo github', profileContext(id)), undefined);
  });
}
for (const id of ['standard', 'research', 'chore', 'specification']) {
  test(`${id} does not acquire the gh prohibition`, async () => {
    assert.equal(await call('gh --version', profileContext(id)), undefined);
    assert.equal((await call('sudo true', profileContext(id)))?.block, true);
  });
}
test('conversation state wins over stale process environment', async () => {
  const original = process.env.PI_PROFILE_ACTIVE;
  try {
    process.env.PI_PROFILE_ACTIVE = 'developer';
    assert.equal(await call('gh --version', profileContext('research')), undefined);
    process.env.PI_PROFILE_ACTIVE = 'research';
    assert.equal((await call('gh --version', profileContext('developer')))?.block, true);
  } finally {
    if (original === undefined) delete process.env.PI_PROFILE_ACTIVE;
    else process.env.PI_PROFILE_ACTIVE = original;
  }
});
test('invalid or conflicting saved profile fails closed', async () => {
  for (const data of [
    { version: 1, id: '../developer', label: 'bad', instructions: '' },
    { version: 2, id: 'developer', label: 'bad', instructions: '' },
  ]) {
    const ctx = profileContext('standard');
    ctx.sessionManager.getBranch = () => [{ type: 'custom', customType: 'startup-profile-state', data }];
    assert.equal((await call('pwd', ctx))?.block, true);
  }
  const ctx = profileContext('standard');
  ctx.sessionManager.getBranch = () => [
    ...profileContext('standard').sessionManager.getBranch(),
    ...profileContext('developer').sessionManager.getBranch(),
  ];
  assert.equal((await call('pwd', ctx))?.block, true);
});

// Exercise actual rule files and I/O failures without touching active configuration.
const { mkdtempSync, copyFileSync, existsSync, writeFileSync, rmSync, unlinkSync } = await import('node:fs');
const { tmpdir } = await import('node:os');
const { join, dirname } = await import('node:path');
const { fileURLToPath } = await import('node:url');
async function fixture(t, edit) {
  const dir = mkdtempSync(join(tmpdir(), 'pi-profile-gate-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const sourceDir = dirname(fileURLToPath(source));
  for (const name of ['permission-gate.ts', 'permission-gate.common.json',
    'permission-gate.developer.json', 'permission-gate.roblox-game.json']) {
    if (existsSync(join(sourceDir, name))) copyFileSync(join(sourceDir, name), join(dir, name));
  }
  edit(dir);
  const { default: factory } = await import(pathToFileURL(join(dir, 'permission-gate.ts')).href);
  let callback;
  factory({ on(name, fn) { assert.equal(name, 'tool_call'); callback = fn; } });
  return callback;
}
for (const file of ['permission-gate.common.json', 'permission-gate.developer.json']) {
  test(`${file} malformed JSON blocks rather than silently allowing`, async (t) => {
    const gate = await fixture(t, dir => writeFileSync(join(dir, file), '{broken'));
    const result = await call('pwd', profileContext('developer'), gate);
    assert.equal(result?.block, true);
    assert.match(result.reason, /configuration/);
  });
  test(`${file} missing blocks rather than silently allowing`, async (t) => {
    const gate = await fixture(t, dir => { if (existsSync(join(dir, file))) unlinkSync(join(dir, file)); });
    assert.equal((await call('pwd', profileContext('developer'), gate))?.block, true);
  });
}
for (const content of [
  {version: 2, denyBashPatterns: []},
  {version: 1, denyBashPatterns: [{source: '[', flags: ''}]},
  {version: 1, denyBashPatterns: [{source: 'gh', flags: 'g'}]},
  {version: 1, denyBashPatterns: ['gh']},
]) {
  test(`invalid rule schema/regex fails closed: ${JSON.stringify(content)}`, async (t) => {
    const gate = await fixture(t, dir => writeFileSync(join(dir, 'permission-gate.developer.json'), JSON.stringify(content)));
    assert.equal((await call('pwd', profileContext('developer'), gate))?.block, true);
  });
}
test('a broken developer file does not affect research', async (t) => {
  const gate = await fixture(t, dir => writeFileSync(join(dir, 'permission-gate.developer.json'), '{broken'));
  assert.equal(await call('gh --version', profileContext('research'), gate), undefined);
});
test('rule file edits take effect without restarting the process', async (t) => {
  let dir;
  const gate = await fixture(t, value => { dir = value; });
  assert.equal((await call('gh --version', profileContext('developer'), gate))?.block, true);
  writeFileSync(join(dir, 'permission-gate.developer.json'), JSON.stringify({version: 1, denyBashPatterns: []}));
  assert.equal(await call('gh --version', profileContext('developer'), gate), undefined);
});
