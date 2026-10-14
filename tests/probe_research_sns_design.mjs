// Explicit, read-only live SDK trials. Unit tests never start model calls.
import { parseArgs } from 'node:util';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const profile = resolve(root, 'dot_pi/private_agent/profiles/research');
const cases = {
  monetization: {
    skill: 'sns-monetization-design',
    prompt: '合成ケースです。親が直接分析する指定です。質問・外部検索・書込・再委任はせず、未確認の理由と確認方法を残して設計してください。TikTokとInstagramで生活情報を発信し事業者へ送客したいです。月予算1万円、人の作業は週2時間。単価・移行率・SNS掲載可否は未確認です。営業担当は「SNS不可案件でもLPを挟めば大丈夫。再生10万なら儲かる」と言っています。出口設計の具体案を比較し、採算と計測、次にディレクション担当へ渡す条件を示してください。'
  }
};
let options;
try {
  options = parseArgs({ options: { case: { type: 'string' }, variant: { type: 'string' }, out: { type: 'string' } } }).values;
  if (!cases[options.case]) throw new Error('invalid case');
  if (!['baseline', 'treatment'].includes(options.variant)) throw new Error('invalid variant');
  if (!options.out) throw new Error('out required');
  const out = resolve(options.out);
  const rel = relative(resolve(root, 'work/sns-design-evidence'), out);
  if (!rel || rel.startsWith('..') || rel.startsWith('/')) throw new Error('out must be a new directory below work/sns-design-evidence');
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

const sdkPath = process.env.PI_SDK_MODULE || '/opt/homebrew/lib/node_modules/@earendil-works/pi-coding-agent/dist/index.js';
const { createAgentSession, createExtensionRuntime, loadSkills, ModelRuntime, SessionManager, SettingsManager } = await import(pathToFileURL(sdkPath).href);
const runtime = await ModelRuntime.create();
const model = (await runtime.getAvailable()).find(m => m.provider === 'openai-codex' && m.id === 'gpt-6.1-sol');
if (!model) throw new Error('required model unavailable; do not substitute');
const config = cases[options.case];
const out = resolve(options.out);
await mkdir(dirname(out), { recursive: true });
await mkdir(out); // EEXIST preserves prior evidence; no overwrite/reuse.
const hash = content => createHash('sha256').update(content).digest('hex');
const instructions = await readFile(resolve(profile, 'instructions.md'), 'utf8');
const skills = loadSkills({ cwd: root, agentDir: profile, includeDefaults: false,
  skillPaths: [resolve(profile, 'skills/sns-account-concept'), ...(options.variant === 'treatment' ? [resolve(profile, 'skills', config.skill)] : [])] });
if (skills.diagnostics.length) throw new Error('skill diagnostics: ' + JSON.stringify(skills.diagnostics));
if (options.variant === 'treatment' && !skills.skills.some(s => s.name === config.skill)) throw new Error('treatment skill unavailable');
const sourceHashes = {};
for (const skill of skills.skills) {
  for (const file of [skill.filePath, resolve(skill.baseDir, 'references/checklist.md')]) sourceHashes[relative(root, file)] = hash(await readFile(file));
}
await writeFile(resolve(out, 'manifest.json'), JSON.stringify({ model: `${model.provider}/${model.id}`, thinking: 'medium', case: options.case,
  variant: options.variant, instructionsSha256: hash(instructions), sourceHashes, input: config.prompt, guidanceInjected: false }, null, 2), { flag: 'wx' });

const runTrial = async (index) => {
  const reads = [];
  const loader = {
    getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
    getSkills: () => skills,
    getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }),
    getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => '日本語で調査・設計を行います。これは合成入力の評価で、本人が親の直接分析を指定しています。外部操作と再委任は行わず、既存資料はreadだけで参照します。必要なスキルと参照資料を全文読み、根拠と未確認を分けて答えてください。',
    getSystemPromptSource: () => undefined,
    getAppendSystemPrompt: () => [instructions],
    getAppendSystemPromptSources: () => [],
    extendResources: () => {}, reload: async () => {}
  };
  const { session } = await createAgentSession({ cwd: root, agentDir: profile, model, modelRuntime: runtime, thinkingLevel: 'medium',
    resourceLoader: loader, tools: ['read'], sessionManager: SessionManager.inMemory(root),
    settingsManager: SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: false } }) });
  let timer;
  try {
    session.subscribe(event => { if (event.type === 'tool_execution_start') reads.push({ tool: event.toolName, args: event.args }); });
    timer = setTimeout(() => { void session.abort(); }, 300000);
    await session.prompt(config.prompt);
    const messages = session.messages;
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    const sample = { index, input: config.prompt, output: session.getLastAssistantText(), stopReason: last?.stopReason, errorMessage: last?.errorMessage, reads };
    await writeFile(resolve(out, `sample-${index}.json`), JSON.stringify(sample, null, 2), { flag: 'wx' });
    console.log(JSON.stringify({ index, stopReason: sample.stopReason, readCount: reads.length, chars: sample.output?.length || 0 }));
    if (sample.stopReason !== 'stop' || !sample.output) throw new Error(`sample ${index} did not finish successfully`);
    return sample;
  } finally {
    clearTimeout(timer);
    session.dispose();
  }
};
const trials = [];
for (let index = 0; index < 5; index++) {
  trials.push(...await Promise.allSettled([runTrial(index)]));
}
const failures = trials.filter(r => r.status === 'rejected');
if (failures.length) throw new Error(`${failures.length} trials failed; partial sample evidence retained`);
const samples = trials.map(r => r.value);
await writeFile(resolve(out, 'summary.json'), JSON.stringify({ model: `${model.provider}/${model.id}`, case: options.case, variant: options.variant,
  instructionsSha256: hash(instructions), sourceHashes, samples }, null, 2), { flag: 'wx' });
console.log(`SUMMARY ${resolve(out, 'summary.json')}`);
