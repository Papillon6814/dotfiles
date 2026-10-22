import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// The extension imports Pi's runtime packages; resolve them from the installed Pi (PI_PACKAGE_DIR overrides).
const piDir = process.env.PI_PACKAGE_DIR ?? '/opt/homebrew/lib/node_modules/@earendil-works/pi-coding-agent';
const hostModules = join(piDir, 'node_modules');
const available = existsSync(join(hostModules, '@earendil-works/pi-ai'));
if (available) {
  const base = pathToFileURL(hostModules + '/').href;
  registerHooks({
    resolve(spec, ctx, next) {
      return spec.startsWith('@earendil-works/') ? next(spec, { ...ctx, parentURL: base + 'x.js' }) : next(spec, ctx);
    },
  });
}

function fakePi() {
  const tools = {}, handlers = {}, emitted = [];
  return {
    tools, handlers, emitted,
    api: {
      registerTool(t) { tools[t.name] = t; },
      registerCommand() {},
      on(event, cb) { (handlers[event] ??= []).push(cb); },
      setSessionName() {},
      events: { emit(channel, data) { emitted.push({ channel, data }); }, on() { return () => {}; } },
    },
  };
}

test('worktree_switch and session_start announce the active worktree on pi.events', { skip: !available && 'Pi is not installed' }, async (t) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'enforce-wt-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const main = join(root, 'main'), linked = join(root, 'linked');
  const git = (...args) => execFileSync('git', args, { cwd: main, stdio: 'pipe' });
  execFileSync('git', ['init', '-q', main]);
  git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '--allow-empty', '-m', 'init');
  git('worktree', 'add', '-q', '-b', 'feat/x', linked);

  const { default: registerExtension } = await import(new URL('../dot_pi/private_agent/extensions/enforce-worktree.ts', import.meta.url).href);
  const pi = fakePi();
  registerExtension(pi.api);
  const ctx = { cwd: main, hasUI: false };

  const result = await pi.tools.worktree_switch.execute('id', { path: linked }, undefined, undefined, ctx);
  assert.equal(result.details.branch, 'feat/x');
  assert.deepEqual(pi.emitted, [{ channel: 'worktree:active', data: { path: linked, mainRoot: main } }]);

  // Switching to the same worktree again does not announce twice.
  await pi.tools.worktree_switch.execute('id', { path: linked }, undefined, undefined, ctx);
  assert.equal(pi.emitted.length, 1);

  for (const h of pi.handlers.session_start) await h({}, ctx);
  assert.deepEqual(pi.emitted.at(-1), { channel: 'worktree:active', data: { path: null, mainRoot: null } });
});
