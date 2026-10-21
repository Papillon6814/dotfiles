import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// No external model calls, active credentials, or real gh invocation.
for (const profile of ['developer', 'roblox-game', 'research']) {
  test(`real Pi loader/AgentSession enforces ${profile}, including nested calls`,
    { skip: !process.env.PI_CORE_DIR }, async (t) => {
    const sdk = await import(pathToFileURL(resolve(process.env.PI_CORE_DIR, '../index.js')).href);
    const root = mkdtempSync(join(tmpdir(), 'pi-profile-gate-host-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const agentDir = join(root, 'agent');
    const binDir = join(root, 'bin');
    mkdirSync(agentDir); mkdirSync(binDir);
    const marker = join(root, 'gh-executed');
    const executable = join(binDir, 'gh');
    writeFileSync(executable, `#!/bin/sh\nprintf executed > '${marker}'\nprintf SYNTHETIC_GH_VERSION\n`, {mode: 0o700});
    const settingsManager = sdk.SettingsManager.inMemory({compaction: {enabled: false}, retry: {enabled: false}});
    const gatePath = process.env.GATE_PATH ?? fileURLToPath(new URL('../dot_pi/private_agent/extensions/permission-gate.ts', import.meta.url));
    const loader = new sdk.DefaultResourceLoader({cwd: root, agentDir, settingsManager,
      additionalExtensionPaths: [gatePath], noSkills: true, noPromptTemplates: true,
      noThemes: true, noContextFiles: true});
    await loader.reload();
    assert.deepEqual(loader.getExtensions().errors, []);
    assert.equal(loader.getExtensions().extensions.length, 1);
    const modelRuntime = await sdk.ModelRuntime.create({authPath: join(agentDir, 'auth.json'), modelsPath: join(agentDir, 'models.json')});
    const model = {id: 'synthetic', name: 'synthetic', api: 'openai-completions', provider: 'openai',
      baseUrl: 'http://127.0.0.1:1', reasoning: false, input: ['text'],
      cost: {input: 0, output: 0, cacheRead: 0, cacheWrite: 0}, contextWindow: 128000, maxTokens: 1024};
    const sessionManager = sdk.SessionManager.inMemory(root);
    sessionManager.appendCustomEntry('startup-profile-state', {version: 1, id: profile, label: profile, instructions: ''});
    let command = `${executable} --version`;
    let toolName = 'bash';
    const {session} = await sdk.createAgentSession({cwd: root, agentDir, modelRuntime, model,
      settingsManager, sessionManager, resourceLoader: loader, tools: ['bash', 'guard_probe'],
      customTools: [{name: 'guard_probe', label: 'Guard probe', description: 'Test nested bash',
        parameters: {type: 'object', properties: {}},
        execute: async (_id, _args, signal, _onUpdate, ctx) => {
          const outcome = await ctx.executeTool('bash', {command}, {signal});
          return {...outcome.result, isError: outcome.isError};
        }}],
      thinkingLevel: 'off'});
    try {
      await session.bindExtensions({});
      let calls = 0;
      session.agent.streamFunction = () => {
        const content = calls++ % 2 === 0
          ? [{type: 'toolCall', id: `call-${calls}`, name: toolName, arguments: toolName === 'bash' ? {command} : {}}]
          : [{type: 'text', text: 'done'}];
        const message = {role: 'assistant', content, api: model.api, provider: model.provider, model: model.id,
          usage: {input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
            cost: {input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0}},
          stopReason: content[0].type === 'toolCall' ? 'toolUse' : 'stop', timestamp: Date.now()};
        return {async *[Symbol.asyncIterator]() {yield {type: 'done', reason: message.stopReason, message};}, result: async () => message};
      };
      const wantedBlocked = profile !== 'research';
      await session.agent.prompt('synthetic direct bash call');
      let result = session.messages.filter(m => m.role === 'toolResult').at(-1);
      if (wantedBlocked) {
        assert.equal(result?.isError, true);
        assert.match(JSON.stringify(result), /permission-gate: prohibited command/);
        assert.equal(existsSync(marker), false);
      } else {
        assert.ok(!result?.isError);
        assert.match(JSON.stringify(result), /SYNTHETIC_GH_VERSION/);
        assert.equal(existsSync(marker), true);
      }
      toolName = 'guard_probe';
      await session.agent.prompt('synthetic nested bash call');
      result = session.messages.filter(m => m.role === 'toolResult').at(-1);
      assert.match(JSON.stringify(result), wantedBlocked ? /permission-gate: prohibited command/ : /SYNTHETIC_GH_VERSION/);
      assert.equal(existsSync(marker), !wantedBlocked);
      command = 'pwd'; toolName = 'bash';
      await session.agent.prompt('synthetic ordinary bash call');
      result = session.messages.filter(m => m.role === 'toolResult').at(-1);
      assert.ok(!result?.isError);
      assert.match(JSON.stringify(result), /pi-profile-gate-host-/);
      assert.ok(!session.systemPrompt.includes('denyBashPatterns'));
    } finally {session.dispose();}
  });
}
