// Explicit live-only host. Uses Pi's SDK + pi-subagents PUBLIC event-bus RPC.
// No import of executor internals, synthetic provider, CLI fallback or auth copying.
import { readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const saveNew = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });

export function nativeSignals(bus, channels) {
  let runId, settle;
  const completions = new Map(), terminals = new Set();
  const promise = new Promise(resolve => { settle = resolve; });
  const check = () => { if (runId && completions.has(runId) && terminals.has(runId)) settle(completions.get(runId)); };
  const offComplete = bus.on(channels.asyncComplete, value => { completions.set(value?.runId, value); check(); });
  const offTerminal = bus.on(channels.processTerminal, value => { if (value?.state === 'observed') terminals.add(value.runId); check(); });
  return { promise, bind(id) { runId = id; check(); }, dispose() { offComplete(); offTerminal(); } };
}

export function validateNativeTerminal(runId, agent, completion, status) {
  const row = status.asyncSnapshot?.runs?.find(run => run.id === runId);
  const proof = status.details?.lifecycleStatus?.processTerminal;
  if (completion.runId !== runId || completion.success !== true || completion.state !== 'complete' ||
      completion.results?.length !== 1 || completion.results[0].agent !== agent ||
      completion.results[0].success !== true || completion.results[0].status !== 'completed' ||
      status.details?.runId !== runId || row?.state !== 'complete' ||
      proof?.runId !== runId || proof.state !== 'observed' ||
      !proof.instances?.some(instance => instance.kind === 'runner' && instance.exitCode === 0 && instance.signal === null)) {
    throw new Error('Native success/identity/process-terminal proof is incomplete');
  }
}

export function validatePiObservations(rows, sessionFile, cwd) {
  const scoped = rows.filter(row => row.phase === 'before_agent_start' && row.sessionFile === sessionFile);
  if (!scoped.length || scoped.some(row => row.cwd !== cwd ||
      !Array.isArray(row.activeTools) || row.activeTools.length !== 3 ||
      new Set(row.activeTools).size !== 3 || row.activeTools.some(tool => !['read', 'anchor_grep', 'contact_supervisor'].includes(tool)) ||
      !Array.isArray(row.canaryHits) || row.canaryHits.length ||
      !Array.isArray(row.commands) || row.commands.some(command => /spotify-(ancestor|home)-sentinel/.test(command.name)))) {
    throw new Error('Pi child observation/tools/isolation proof is incomplete');
  }
  return scoped;
}

export function validateReadTrace(trace, skillRoot, role, fixtureRoot, denials = []) {
  if (denials.length || trace.some(call => !call.ok || !resolve(call.path).startsWith(resolve(fixtureRoot) + '/'))) {
    throw new Error('Read denied, failed, or escaped the authorized fixture; no permission fallback');
  }
  const needed = ['SKILL.md', ...['contracts', 'principles', 'sources', 'inclusive-design', role + '-design-review'].map(name => 'references/' + name + '.md')];
  const actual = new Set(trace.filter(call => call.ok).map(call => resolve(call.path)));
  if (needed.some(path => !actual.has(resolve(skillRoot, path)))) throw new Error('Mandatory shared-skill read evidence missing');
}

function claudeReadTrace(proof) {
  const calls = new Map(), results = new Map();
  for (const event of proof.messages) {
    const parts = event.message?.content;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (part.type === 'tool_use' && part.name === 'Read') calls.set(part.id, part.input.file_path);
      if (part.type === 'tool_result') results.set(part.tool_use_id, part.is_error !== true);
    }
  }
  return [...calls].map(([id, path]) => ({ path, ok: results.get(id) === true }));
}

function piReadTrace(entries) {
  const calls = new Map(), results = new Map();
  for (const entry of entries) {
    const message = entry.message;
    if (message?.role === 'toolResult') results.set(message.toolCallId, message.isError !== true);
    if (Array.isArray(message?.content)) for (const part of message.content) {
      if (part.type === 'toolCall' && part.name === 'read') calls.set(part.id, part.arguments.path);
    }
  }
  return [...calls].map(([id, path]) => ({ path, ok: results.get(id) === true }));
}

export async function readClaudeProof(completion, launched) {
  const proc = completion.results?.[0]?.externalProcess;
  const root = launched.details?.asyncDir;
  if (!root || !proc?.stdoutPath || proc.exitCode !== 0 ||
      resolve(proc.stdoutPath) !== resolve(root, 'external-0.stdout.log')) {
    throw new Error('Claude stdout provenance/exit is unconfirmed');
  }
  const stat = await lstat(proc.stdoutPath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 8 * 1024 * 1024) throw new Error('Claude stdout is not a bounded regular artifact');
  const raw = await readFile(proc.stdoutPath, 'utf8');
  // Display/output artifacts may be tail-truncated at 64KiB. Never parse those as a protocol.
  const messages = raw.trim().split('\n').map(line => JSON.parse(line));
  const starts = messages.filter(x => x.type === 'system' && x.subtype === 'init');
  const results = messages.filter(x => x.type === 'result');
  if (starts.length !== 1 || results.length !== 1 || results[0].subtype !== 'success' ||
      results[0].is_error !== false || typeof results[0].result !== 'string' || !results[0].result.trim()) {
    throw new Error('Claude native stream lacks a unique successful terminal result');
  }
  const init = starts[0];
  if (typeof init.model !== 'string' || !init.model || !Array.isArray(init.tools) ||
      init.tools.length !== 3 || new Set(init.tools).size !== 3 ||
      init.tools.some(tool => !['Read', 'Grep', 'Glob'].includes(tool))) {
    throw new Error('Claude model/effective read-only tool inventory is unconfirmed');
  }
  return { model: init.model, tools: init.tools, result: results[0], messages,
    sourcePath: proc.stdoutPath, sourceSha256: createHash('sha256').update(raw).digest('hex') };
}

export async function runNativeTrials(manifest, out) {
  const sdkPath = process.env.PI_SDK_MODULE || '/opt/homebrew/lib/node_modules/@earendil-works/pi-coding-agent/dist/index.js';
  const packageRoot = process.env.SPD_SUBAGENTS_ROOT || join(process.env.HOME, '.pi/agent/local/pi-subagents-2036e0b4');
  const agentDir = process.env.PI_CODING_AGENT_DIR || join(process.env.HOME, '.pi/agent');
  const hashline = join(agentDir, 'npm/node_modules/pi-hashline-edit-pro/index.ts');
  for (const path of [sdkPath, join(packageRoot, 'index.ts'), hashline]) await readFile(path);
  await saveNew(join(out, 'runtime-versions.json'), {
    node: process.version,
    sdk: JSON.parse(await readFile(resolve(sdkPath, '../../package.json'), 'utf8')).version,
    subagents: JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')).version,
    hashline: JSON.parse(await readFile(resolve(hashline, '../package.json'), 'utf8')).version
  });
  const sdk = await import(pathToFileURL(sdkPath).href);
  const installed = sdk.SettingsManager.create(manifest.fixture, agentDir);
  const provider = installed.getDefaultProvider();
  const modelId = installed.getDefaultModel();
  if (!provider || !modelId) throw new Error('A configured default model is required; no model substitution');
  const modelRuntime = await sdk.ModelRuntime.create({ allowModelNetwork: false });
  const model = modelRuntime.getModel(provider, modelId);
  if (!model || !modelRuntime.hasConfiguredAuth(provider)) throw new Error('Configured Pi model/auth unavailable; no fallback');
  const bus = sdk.createEventBus();
  const hostDir = join(out, 'host');
  await mkdir(hostDir, { recursive: true });
  const settings = sdk.SettingsManager.inMemory({
    defaultProvider: provider, defaultModel: modelId, packages: [], extensions: [],
    skills: [], compaction: { enabled: false }, retry: { enabled: false }
  });
  const loader = new sdk.DefaultResourceLoader({
    cwd: manifest.fixture, agentDir: hostDir, settingsManager: settings, eventBus: bus,
    additionalExtensionPaths: [join(packageRoot, 'index.ts'), hashline, join(out, 'observer.mjs')],
    noSkills: manifest.variant !== 'treatment', noContextFiles: true, noPromptTemplates: true, noThemes: true,
    additionalSkillPaths: manifest.variant === 'treatment' ? [join(manifest.fixture, '.agents/skills/spotify-design')] : [],
    skillsOverride: base => ({ skills: base.skills.filter(skill => skill.name === 'spotify-design' &&
      skill.filePath.startsWith(join(manifest.fixture, '.agents/skills/spotify-design') + '/')), diagnostics: base.diagnostics }),
    systemPrompt: 'Validation transport host. Do not generate model responses.'
  });
  await loader.reload();
  const extensionErrors = loader.getExtensions().errors;
  if (extensionErrors.length) throw new Error('Extension initialization failed: ' + JSON.stringify(extensionErrors));
  const { session } = await sdk.createAgentSession({
    cwd: manifest.fixture, agentDir: hostDir, modelRuntime, model,
    resourceLoader: loader, settingsManager: settings,
    sessionManager: sdk.SessionManager.create(manifest.fixture, join(hostDir, 'sessions')),
    tools: []
  });
  const errors = [];
  const events = [];
  let hostModelRequests = 0;
  // Completion notifications must never become an extra parent model run.
  session.agent.streamFn = () => { hostModelRequests++; throw new Error('Unexpected validation-host model request'); };
  session.subscribe(event => {
    if (['tool_execution_start', 'tool_execution_end'].includes(event.type)) events.push(event);
  });
  const rpc = (method, params = {}, timeoutMs = 60000) => new Promise((resolve, reject) => {
    const requestId = randomUUID();
    const off = bus.on('subagents:rpc:v1:reply:' + requestId, reply => {
      clearTimeout(timer); off();
      if (!reply?.success) reject(new Error(JSON.stringify(reply?.error ?? reply)));
      else resolve(reply.data);
    });
    const timer = setTimeout(() => { off(); reject(new Error('RPC timeout: ' + method)); }, timeoutMs);
    bus.emit('subagents:rpc:v1:request', { version: 1, requestId, method, params });
  });
  let observationDependency;
  let activeRun;
  try {
    if (manifest.runtime === 'pi') {
      const resolver = createRequire(join(packageRoot, 'package.json'));
      const publicModule = resolver.resolve('pi-subagents/required-child-extensions');
      const { registerRequiredChildExtensions } = await import(pathToFileURL(publicModule).href);
      observationDependency = registerRequiredChildExtensions({
        sessionId: session.sessionManager.getSessionId(),
        extensions: [{ id: 'spotify-design-observer', path: join(out, 'observer.mjs') }],
        requireForAllRunners: true
      });
    }
    await session.bindExtensions({ onError: error => errors.push(error) });
    const ping = await rpc('ping');
    await saveNew(join(out, 'host-capabilities.json'), {
      ping, model: provider + '/' + modelId,
      loadedExtensions: loader.getExtensions().extensions.map(x => x.path),
      hostTools: session.getActiveToolNames()
    });
    if (!ping.events?.asyncComplete) throw new Error('Native async completion event unavailable');
    for (const job of manifest.jobs) {
      let completionResolve;
      let expectedId;
      const signals = nativeSignals(bus, ping.events);
      const launched = await rpc('spawn', {
        agent: job.agent, task: job.task, cwd: job.cwd, context: 'fresh',
        agentScope: 'project', async: true, artifacts: true,
        sessionDir: join(out, 'child-sessions'), timeoutMs: 240000,
        output: join(out, 'output-' + job.index + '.md'), outputMode: 'file-only'
      });
      await saveNew(join(out, 'launch-' + job.index + '.json'), launched);
      expectedId = launched.details?.asyncId ?? launched.details?.asyncRunId ?? launched.details?.runId;
      if (!expectedId) { signals.dispose(); throw new Error('Launch did not return an exact run identity'); }
      activeRun = expectedId;
      signals.bind(expectedId);
      let timer;
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Native completion deadline; run ' + expectedId)), 300000);
      });
      let completion;
      try { completion = await Promise.race([signals.promise, timeout]); }
      finally { clearTimeout(timer); signals.dispose(); }
      const status = await rpc('status', { id: expectedId });
      await saveNew(join(out, 'sample-' + job.index + '.json'), { job, launched, completion, status });
      validateNativeTerminal(expectedId, job.agent, completion, status);
      activeRun = undefined;
      const output = await readFile(join(out, 'output-' + job.index + '.md'), 'utf8');
      if (!output.trim()) throw new Error('Native output empty');
      if (manifest.runtime === 'claude') {
        const proof = await readClaudeProof(completion, launched);
        await saveNew(join(out, 'claude-proof-' + job.index + '.json'), proof);
        await writeFile(join(out, 'answer-' + job.index + '.md'), proof.result.result, { flag: 'wx' });
        if (manifest.variant === 'treatment') {
          const trace = claudeReadTrace(proof);
          validateReadTrace(trace, manifest.skillRoot, manifest.role, manifest.fixture, proof.result.permission_denials ?? []);
          await saveNew(join(out, 'read-proof-' + job.index + '.json'), { trace, permissionDenials: [] });
        }
      }
      if (manifest.runtime === 'pi') {
        const rows = (await readFile(join(out, 'pi-observations.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
        const proof = validatePiObservations(rows, completion.results[0].sessionFile, manifest.fixture);
        await saveNew(join(out, 'pi-proof-' + job.index + '.json'), { observations: proof });
        if (manifest.variant === 'treatment') {
          const entries = (await readFile(completion.results[0].sessionFile, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
          const trace = piReadTrace(entries);
          validateReadTrace(trace, manifest.skillRoot, manifest.role, manifest.fixture);
          await saveNew(join(out, 'read-proof-' + job.index + '.json'), { trace });
        }
      }
      console.log(JSON.stringify({ index: job.index, runId: expectedId, state: 'completed', chars: output.length }));
      if (errors.length || hostModelRequests) throw new Error('Host/runtime error; inspect preserved artifacts');
    }
    await saveNew(join(out, 'summary.json'), { state: 'executed-ungraded', jobs: manifest.jobs.length, hostModelRequests, errors, events });
  } catch (error) {
    let stop;
    if (activeRun) {
      try { stop = await rpc('stop', { id: activeRun }); }
      catch (stopError) { stop = { error: stopError.message }; }
    }
    await saveNew(join(out, 'native-blocker.json'), { error: error.message, activeRun, stop, errors, events, hostModelRequests });
    throw error;
  } finally {
    observationDependency?.dispose();
    session.dispose();
  }
}
