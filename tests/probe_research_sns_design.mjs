// Explicit, read-only live SDK trials. Unit tests never start model calls.
import { parseArgs } from 'node:util';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let profile = resolve(root, 'dot_pi/private_agent/profiles/research');
const cases = {
  feasibility: {
    skill: 'sns-ai-feasibility',
    prompt: '合成ケースです。親が直接評価。質問・検索・書込・再委任・生成はせず、AI実現制約と代替案を表で簡潔に評価してください。Instagramで日本語テロップと毎回同じAI人物の動画を毎日1本出したい。予算月3000円、人の時間は週30分。権利・人物一貫性・日本語発話の性能は未検証、APIは存在するが自分のアカウントが使えるか不明、音声素材の商用条件も不明。担当は1生成100円だから月3000円で全自動可能と言います。許可と実環境と品質と総費用を分け、可否・必要な人の作業・試験と合格条件・出口設計とディレクションへの修正条件を示してください。販売先は既決で変更せず、媒体と予算も維持。静止画主体の代替があるかも検討してください。'
  },
  direction: {
    skill: 'sns-account-direction',
    prompt: '合成ケースです。親が直接設計する指定です。質問・外部検索・書込・再委任をせず、未確認は理由と確認方法を残してください。Aは地域の生活文化を楽しく紹介する非販売アカウント、Bは生活サービスの選び方を紹介し許可済み事業者へ送客するアカウントです。どちらも実績・専門資格・読者調査はなく、週2時間、撮影なし、図解中心、Instagramが既決です。2案の具体的なディレクション（世界観、発信者、語り口、見た目、投稿の柱、プロフィール、投稿への具体化）と検証を設計してください。既存基準で点検し、AI制約担当へ必要品質を渡してください。根拠のない実績は作らず、出力は具体例を残して簡潔にまとめてください。'
  },
  monetization: {
    skill: 'sns-monetization-design',
    prompt: '合成ケースです。親が直接分析する指定です。質問・外部検索・書込・再委任はせず、未確認の理由と確認方法を残して設計してください。TikTokとInstagramで生活情報を発信し事業者へ送客したいです。月予算1万円、人の作業は週2時間。単価・移行率・SNS掲載可否は未確認です。営業担当は「SNS不可案件でもLPを挟めば大丈夫。再生10万なら儲かる」と言っています。出口設計の具体案を比較し、採算と計測、次にディレクション担当へ渡す条件を示してください。'
  }
};
cases['direction-missing'] = { ...cases.direction, missingChecker: true,
  prompt: '非販売の地域文化図解アカウントのディレクションを設計してください。週2時間、Instagram、撮影なし、原資料未提供です。基準が読めない場合の実施範囲と再開方法も示してください。これは合成ケースです。質問・検索・書込・再委任はしないでください。参照するProfileは今回のfixtureのみとし、別のコピーを探しにいかないでください。' };
cases.routing = { allSkills: true, prompts: [
  '生活情報SNSから事業者へ送客する出口設計だけを見直して。単価と率は未確認。仮の売上を作らず導線比較と計測を簡潔に。世界観や投稿案は不要。',
  'Instagramの非販売の地域文化図解アカウントのディレクションを設計して。週2時間、撮影なし。世界観・語り口・見た目・投稿の柱を具体化し既存基準で点検して。地域は未定。',
  'SNS企画のAI実現制約だけを評価して。毎日AI人物動画、月3000円、週30分。生成100円、品質・権利・API資格は未確認。代替案と試験条件を簡潔に。',
  'SNSマネタイズ全体を設計して。生活情報をInstagramで届けて既決の事業者へ送客。週2時間、月3000円。毎日AI人物動画を考えているが性能・権利・単価・API資格が未確認。出口、ディレクション、AI制約を分けて既存基準で点検し、変更提案と保留条件を示して。',
  'JavaScriptの配列mapとforEachの違いだけを、短いコード例で説明して。SNSの調査は不要。',
  '参考アカウントのコンセプト分析だけをして。合成資料：毎金曜に地域文化を図解し、プロフィールは季節・言葉・道具の発見を約束。提供した3投稿は暦、言葉、道具。読者1人の「次も見たい」は主張で継続率は不明。売上・工数は非公開。自作のネタやディレクションは不要。既存10項目で観察・解釈・限界・転用条件を整理して。',
  '途中再開の統合ケース。①既決：Instagram→既決事業者へ送客、月3000円・週30分、単価と移行率は未確認。②は毎日同じ人物が話す動画を仮置き。③の観察：生成100円/回、31日で最低3100円、人物一貫性・音声権利・本人API資格は未確認。③を確認して②の静止画主体・無音案と①の費用/頻度仮説を見直し、既存基準で点検。媒体・販売先・予算と未確認を維持し、変更は提案として残して。'
].map(prompt => '合成ケース。親の直接分析指定。質問・検索・外部書込・再委任・画像動画音声の素材生成は行わず、未確認と次の確認を残してください。利用可能なスキルを読んで、出力は要点を簡潔に。' + prompt) };
let options;
try {
  options = parseArgs({ options: { case: { type: 'string' }, variant: { type: 'string' }, out: { type: 'string' }, samples: { type: 'string', default: '5' }, 'prepare-only': { type: 'boolean', default: false } } }).values;
  if (!cases[options.case]) throw new Error('invalid case');
  if (!['baseline', 'treatment'].includes(options.variant)) throw new Error('invalid variant');
  options.samples = Number(options.samples);
  if (!Number.isInteger(options.samples) || options.samples < 1 || options.samples > 5) throw new Error('invalid samples');
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
const config = cases[options.case];
const out = resolve(options.out);
await mkdir(dirname(out), { recursive: true });
await mkdir(out); // EEXIST preserves prior evidence; no overwrite/reuse.
if (config.missingChecker) {
  const original = profile;
  profile = resolve(out, 'fixture/profile');
  await mkdir(resolve(profile, 'skills'), { recursive: true });
  await cp(resolve(original, 'instructions.md'), resolve(profile, 'instructions.md'));
  await cp(resolve(original, 'skills/sns-account-direction'), resolve(profile, 'skills/sns-account-direction'), { recursive: true });
}
const hash = content => createHash('sha256').update(content).digest('hex');
const instructions = await readFile(resolve(profile, 'instructions.md'), 'utf8');
const skills = loadSkills({ cwd: root, agentDir: profile, includeDefaults: false,
  skillPaths: config.allSkills ? [resolve(profile, 'skills')] : [...(config.missingChecker ? [] : [resolve(profile, 'skills/sns-account-concept')]), ...(options.variant === 'treatment' ? [resolve(profile, 'skills', config.skill)] : [])] });
if (skills.diagnostics.length) throw new Error('skill diagnostics: ' + JSON.stringify(skills.diagnostics));
if (!config.allSkills && options.variant === 'treatment' && !skills.skills.some(s => s.name === config.skill)) throw new Error('treatment skill unavailable');
if (options['prepare-only']) {
  console.log(JSON.stringify({ skills: skills.skills.map(s => s.name), diagnostics: skills.diagnostics }));
  process.exit(0);
}
const runtime = await ModelRuntime.create();
const model = (await runtime.getAvailable()).find(m => m.provider === 'openai-codex' && m.id === 'gpt-6.1-sol');
if (!model) throw new Error('required model unavailable; do not substitute');
const sourceHashes = {};
for (const skill of skills.skills) {
  for (const file of [skill.filePath, resolve(skill.baseDir, 'references/checklist.md'), resolve(skill.baseDir, 'assets/output-template.md')]) {
    try { sourceHashes[relative(root, file)] = hash(await readFile(file)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
await writeFile(resolve(out, 'manifest.json'), JSON.stringify({ model: `${model.provider}/${model.id}`, thinking: 'medium', case: options.case,
  variant: options.variant, instructionsSha256: hash(instructions), sourceHashes, input: config.prompt, guidanceInjected: false }, null, 2), { flag: 'wx' });

const runTrial = async (index) => {
  const prompt = config.prompts ? config.prompts[index] : config.prompt;
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
    await session.prompt(prompt);
    const messages = session.messages;
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    const sample = { index, input: prompt, output: session.getLastAssistantText(), stopReason: last?.stopReason, errorMessage: last?.errorMessage, reads };
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
for (let index = 0; index < (config.prompts?.length || options.samples); index++) {
  trials.push(...await Promise.allSettled([runTrial(index)]));
}
const failures = trials.filter(r => r.status === 'rejected');
if (failures.length) throw new Error(`${failures.length} trials failed; partial sample evidence retained`);
const samples = trials.map(r => r.value);
await writeFile(resolve(out, 'summary.json'), JSON.stringify({ model: `${model.provider}/${model.id}`, case: options.case, variant: options.variant,
  instructionsSha256: hash(instructions), sourceHashes, samples }, null, 2), { flag: 'wx' });
console.log(`SUMMARY ${resolve(out, 'summary.json')}`);
