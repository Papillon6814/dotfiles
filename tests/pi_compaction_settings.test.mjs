import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

// Use an existing Pi installation, never install or write active settings:
// PI_CORE_DIR=/path/to/pi-coding-agent/dist/core node --test tests/pi_compaction_settings.test.mjs
assert.ok(process.env.PI_CORE_DIR, 'PI_CORE_DIR must point to the Pi dist/core directory');
const core = resolve(process.env.PI_CORE_DIR);
const { SettingsManager } = await import(pathToFileURL(resolve(core, 'settings-manager.js')).href);
const { shouldCompact } = await import(pathToFileURL(resolve(core, 'compaction/compaction.js')).href);
const root = fileURLToPath(new URL('../', import.meta.url));
const settingsPath = 'dot_pi/private_agent/settings.json';
const settings = JSON.parse(readFileSync(resolve(root, settingsPath), 'utf8'));
// Preserve the full compaction baseline; unrelated settings may evolve independently.
const original = JSON.parse(execFileSync('git', [
  'show', `7da40eceafb2e00a3cc568d29a8c5241528d880c:${settingsPath}`,
], { cwd: root, encoding: 'utf8' }));
const manager = SettingsManager.inMemory(settings);
const baseline = SettingsManager.inMemory(original);

test('compaction changes only the two Claude-local reserve overrides', () => {
  const expected = structuredClone(original);
  expected.compaction.modelOverrides['claude-local/claude-local-sonnet'] = { reserveTokens: 320000 };
  expected.compaction.modelOverrides['claude-local/claude-local-opus'] = { reserveTokens: 320000 };
  assert.deepEqual(settings.compaction, expected.compaction);
});

for (const family of ['sonnet', 'opus']) {
  test(`settings.json makes Pi compact ${family} strictly above 680000 at 1M`, () => {
    const effective = manager.getCompactionSettings({ provider: 'claude-local', id: `claude-local-${family}` });
    assert.deepEqual(effective, { enabled: true, reserveTokens: 320000, keepRecentTokens: 60000 });
    assert.equal(shouldCompact(680000, 1000000, effective), false);
    assert.equal(shouldCompact(680001, 1000000, effective), true);
  });
}

test('settings.json preserves Haiku, ordinary defaults and all previous model overrides', () => {
  const models = [
    undefined,
    { provider: 'claude-local', id: 'claude-local-haiku' },
    ...Object.keys(original.compaction.modelOverrides).map((key) => {
      const [provider, id] = key.split('/');
      return { provider, id };
    }),
  ];
  for (const model of models) {
    assert.deepEqual(manager.getCompactionSettings(model), baseline.getCompactionSettings(model));
  }
  assert.equal(manager.getCompactionKeepRecentTokens(), 60000);
});
