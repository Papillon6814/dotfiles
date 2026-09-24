#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");

const STACK_MARKERS = [
  ["TypeScript / JavaScript", ["package.json", "tsconfig.json"]],
  ["Python", ["pyproject.toml", "requirements.txt", "Pipfile"]],
  ["Rust", ["Cargo.toml"]],
  ["Go", ["go.mod"]],
  ["Roblox / Lua", ["wally.toml", "aftman.toml", "default.project.json", ".luaurc"]],
  ["Ruby", ["Gemfile"]],
  ["PHP", ["composer.json"]],
];
const NODE_SCRIPT_ORDER = ["dev", "build", "test", "lint", "typecheck", "check", "start"];
const NODE_LOCKFILES = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["package-lock.json", "npm"],
];
const BACKTICK = String.fromCharCode(96);
const WIZARD_STEPS = 8;

function safeText(value) {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/[\r\n\t]+/g, " ")
    .replace(new RegExp(BACKTICK, "g"), "'")
    .trim();
}

function isFileOrDirectory(filename) {
  try {
    fs.accessSync(filename);
    return true;
  } catch {
    return false;
  }
}

function findRepoRoot(directory) {
  let current = directory;
  while (true) {
    if (isFileOrDirectory(path.join(current, ".git"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return directory;
    current = parent;
  }
}

function readPackageJson(directory) {
  const filename = path.join(directory, "package.json");
  if (!fs.existsSync(filename)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(filename, "utf8"));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch (error) {
    console.error("警告: package.json を読み取れません: " + error.message);
    return {};
  }
}

function packageManager(directory, packageData) {
  const declared = safeText(packageData.packageManager || "").split("@", 1)[0];
  if (["npm", "pnpm", "yarn", "bun"].includes(declared)) return declared;
  for (const [lockfile, manager] of NODE_LOCKFILES) {
    if (fs.existsSync(path.join(directory, lockfile))) return manager;
  }
  return "npm";
}

function projectName(directory, packageData) {
  return safeText(packageData.name || "") || path.basename(directory);
}

function detectedStacks(directory) {
  return STACK_MARKERS
    .filter(([, markers]) => markers.some((marker) => isFileOrDirectory(path.join(directory, marker))))
    .map(([label]) => label);
}

function projectCommands(directory, packageData) {
  const commands = [];
  const scripts = packageData.scripts;
  if (scripts && typeof scripts === "object" && !Array.isArray(scripts)) {
    const manager = packageManager(directory, packageData);
    for (const name of NODE_SCRIPT_ORDER) {
      if (Object.prototype.hasOwnProperty.call(scripts, name) && /^[A-Za-z0-9:_-]+$/.test(name)) {
        commands.push(manager + " run " + name);
      }
    }
  }

  const makefile = path.join(directory, "Makefile");
  if (fs.existsSync(makefile)) {
    let content = "";
    try {
      content = fs.readFileSync(makefile, "utf8");
    } catch {
      // A Makefile that cannot be read does not contribute commands.
    }
    for (const line of content.split(/\r?\n/)) {
      const match = /^([A-Za-z][A-Za-z0-9_-]*):(?:\s|$)/.exec(line);
      if (match && NODE_SCRIPT_ORDER.includes(match[1])) {
        const command = "make " + match[1];
        if (!commands.includes(command)) commands.push(command);
      }
    }
  }
  return commands;
}

function defaultAnswers(directory, packageData) {
  const stacks = detectedStacks(directory);
  return {
    description: "",
    stacks: stacks.length ? stacks.join(", ") : "未検出",
    commands: projectCommands(directory, packageData),
    responseLanguage: "日本語",
    focus: "機能実装、バグ修正、保守性を重視",
    testingPolicy: "ユーザーが依頼した場合のみテストを実行する",
    gitWorkflow: "既存ルールを優先し、未定義なら feature branch + worktree を使う",
    additionalRules: "",
  };
}

function createInputReader() {
  const interface_ = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdin.isTTY),
  });
  const ask = (prompt) =>
    new Promise((resolve) => {
      let settled = false;
      const finish = (answer) => {
        if (settled) return;
        settled = true;
        interface_.off("close", onClose);
        resolve(answer);
      };
      const onClose = () => finish(null);
      interface_.once("close", onClose);
      interface_.question(prompt, finish);
    });
  return { ask, close: () => interface_.close() };
}

async function askText(reader, step, emoji, label, question, defaultValue = "") {
  console.log("\n" + emoji + " " + step + "/" + WIZARD_STEPS + " " + label);
  console.log("  ? " + question);
  const hint = defaultValue ? "Enter = " + defaultValue : "Enter = スキップ";
  const answer = await reader.ask("  > [" + hint + "] ");
  if (answer === null) throw new Error("入力が終了しました。");
  return safeText(answer) || defaultValue;
}

async function askChoice(reader, step, emoji, label, question, choices, defaultIndex = 0) {
  console.log("\n" + emoji + " " + step + "/" + WIZARD_STEPS + " " + label);
  console.log("  ? " + question);
  choices.forEach((choice, index) => {
    const marker = index === defaultIndex ? "●" : "○";
    console.log("    " + marker + " " + (index + 1) + ") " + choice);
  });
  while (true) {
    const answer = await reader.ask("  > [Enter = " + (defaultIndex + 1) + "] ");
    if (answer === null) throw new Error("入力が終了しました。");
    const selected = answer.trim();
    if (!selected) return choices[defaultIndex];
    if (/^[0-9]+$/.test(selected)) {
      const index = Number(selected) - 1;
      if (index >= 0 && index < choices.length) return choices[index];
    }
    console.log("    番号で選んでください。");
  }
}

function parseCommands(value) {
  const normalized = safeText(value);
  if (["", "none", "なし", "-"].includes(normalized.toLowerCase())) return [];
  return normalized.split(",").map((command) => command.trim()).filter(Boolean);
}

async function runWizard(directory, packageData) {
  const defaults = defaultAnswers(directory, packageData);
  const reader = createInputReader();
  try {
    console.log("\n╭─ 🤖 ai-init");
    console.log("│ AI 向けの基本設定を一緒に作ります。Enter で検出値・おすすめを使えます。");
    console.log("╰──────────────────────────");

    const description = await askText(
      reader,
      1,
      "✨",
      "プロジェクト概要",
      "何を作るプロジェクトですか？",
    );
    console.log("  🔎 自動検出: " + defaults.stacks);
    const stacks = await askText(
      reader,
      2,
      "🧩",
      "技術スタック",
      "追加・修正があれば入力してください（カンマ区切り）。",
      defaults.stacks,
    );
    const detectedCommands = defaults.commands.join(", ");
    const commandsAnswer = await askText(
      reader,
      3,
      "🛠️",
      "開発コマンド",
      "AI に使ってほしいコマンドを入力してください（カンマ区切り、なしにする場合は「なし」）。",
      detectedCommands,
    );
    const responseLanguage = await askChoice(
      reader,
      4,
      "💬",
      "返答の言語",
      "AI の返答はどの言語にしますか？",
      ["日本語", "英語", "ユーザーの言語に合わせる"],
      0,
    );
    const focus = await askText(
      reader,
      5,
      "🎯",
      "AI に期待すること",
      "特に優先してほしい作業や品質はありますか？",
      defaults.focus,
    );
    const testingPolicy = await askChoice(
      reader,
      6,
      "🧪",
      "テスト・検証",
      "テストや検証はどのように進めますか？",
      [
        "変更に合わせて適切なテスト・検証を行う",
        "実行前に確認する",
        "ユーザーが依頼した場合のみ実行する",
      ],
      2,
    );
    const gitWorkflow = await askChoice(
      reader,
      7,
      "🌿",
      "Git の進め方",
      "ブランチや worktree の方針は？",
      [
        "既存ルールを優先し、未定義なら feature branch + worktree を使う",
        "現在のブランチで作業する",
        "着手前に方針を確認する",
      ],
      0,
    );
    const additionalRules = await askText(
      reader,
      8,
      "📝",
      "追加ルール",
      "ほかに守ってほしいことはありますか？",
    );

    const answers = {
      description,
      stacks,
      commands: parseCommands(commandsAnswer),
      responseLanguage,
      focus,
      testingPolicy,
      gitWorkflow,
      additionalRules,
    };
    console.log("\n✅ 回答をまとめました");
    console.log("  📦 " + (description || projectName(directory, packageData)));
    console.log("  🧩 " + stacks);
    console.log("  💬 " + responseLanguage);
    console.log("  🧪 " + testingPolicy);
    return answers;
  } finally {
    reader.close();
  }
}

function renderAgents(directory, packageData, answers = defaultAnswers(directory, packageData)) {
  const name = projectName(directory, packageData);
  const description = answers.description || "README / manifest で確認する";
  const commandLines = answers.commands.length
    ? answers.commands.map((command) => "- " + BACKTICK + command + BACKTICK).join("\n")
    : "- README / CI / manifest で実在を確認してから追記する";
  const additionalLine = answers.additionalRules
    ? "- " + answers.additionalRules
    : "- 繰り返し必要になるプロジェクト固有ルールはこのファイルへ追加する。";

  return [
    "# " + name + " — AI エージェント向け指示",
    "",
    "## プロジェクト",
    "- 概要: " + description,
    "- 技術スタック: " + answers.stacks,
    "- 技術情報はルート直下の manifest からの検出値を含む。プロジェクトの実態はソースコードでも確認する。",
    "",
    "## コマンド",
    commandLines,
    "",
    "## AI の進め方",
    "- 返答の言語: " + answers.responseLanguage,
    "- 優先事項: " + answers.focus,
    "- テスト・検証: " + answers.testingPolicy,
    "- Git の進め方: " + answers.gitWorkflow,
    "- 編集前に README、既存の指示ファイル、関連コードを確認し、既存の設計・命名に合わせる。",
    "- 文字列検索には " + BACKTICK + "rg" + BACKTICK + " を使い、コマンドや設定値は manifest とドキュメントで確認する。",
    "- 変更前に " + BACKTICK + "git status" + BACKTICK + " を確認し、ユーザーの既存変更を保護する。",
    "- 破壊的操作、外部送信、公開、push はユーザーの明示許可を得てから行う。",
    additionalLine,
    "- 特定ディレクトリだけの規則は近い階層の " + BACKTICK + "AGENTS.md" + BACKTICK + " に置く。",
    "",
  ].join("\n");
}

function showPreview(filename, content) {
  const lines = content.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  process.stdout.write("--- /dev/null\n");
  process.stdout.write("+++ " + filename + "\n");
  process.stdout.write("@@ -0,0 +1," + lines.length + " @@\n");
  for (const line of lines) process.stdout.write("+" + line + "\n");
}

function parseArguments(argv) {
  const parsed = { path: ".", yes: false };
  let selectedPath = false;
  for (const argument of argv) {
    if (argument === "--help" || argument === "-h") {
      parsed.help = true;
    } else if (argument === "--yes" || argument === "-y") {
      parsed.yes = true;
    } else if (argument.startsWith("-")) {
      throw new Error("不明なオプション: " + argument);
    } else if (!selectedPath) {
      parsed.path = argument;
      selectedPath = true;
    } else {
      throw new Error("対象のディレクトリは1つだけ指定できます。");
    }
  }
  return parsed;
}

function usage() {
  return [
    "使い方: ai-init [path] [--yes]",
    "",
    "質問形式で既存リポジトリの AGENTS.md と CLAUDE.md を作成します。",
    "",
    "引数:",
    "  path       対象のリポジトリまたはディレクトリ（省略時: カレントディレクトリ）",
    "  --yes, -y  質問と確認を省略し、自動検出値でファイルを作成",
    "  --help     このヘルプを表示",
    "",
  ].join("\n");
}

function expandHome(input) {
  if (input === "~") return os.homedir();
  if (input.startsWith("~" + path.sep)) return path.join(os.homedir(), input.slice(2));
  return input;
}

async function main() {
  let args;
  try {
    args = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(usage());
    return 2;
  }
  if (args.help) {
    process.stdout.write(usage());
    return 0;
  }

  const requestedTarget = path.resolve(expandHome(args.path));
  let target;
  try {
    if (!fs.statSync(requestedTarget).isDirectory()) throw new Error("not a directory");
    target = findRepoRoot(requestedTarget);
  } catch {
    console.error("directory does not exist: " + requestedTarget);
    return 2;
  }
  if (target === requestedTarget && !isFileOrDirectory(path.join(target, ".git"))) {
    console.error("警告: Git ルートが見つからないため、このディレクトリを対象にします: " + target);
  }

  const packageData = readPackageJson(target);
  console.log("対象: " + target);
  const claudeFile = path.join(target, "CLAUDE.md");
  if (fs.existsSync(claudeFile)) {
    let claudeInstructions = "";
    try {
      claudeInstructions = fs.readFileSync(claudeFile, "utf8");
    } catch {
      // Existing files remain untouched if they cannot be read.
    }
    if (!claudeInstructions.includes("@AGENTS.md")) {
      console.error(
        "注意: 既存の CLAUDE.md は変更しません。共通指示を読み込むには @AGENTS.md を追記してください。",
      );
    }
  }

  const missing = ["AGENTS.md", "CLAUDE.md"].filter(
    (name) => !fs.existsSync(path.join(target, name)),
  );
  if (!missing.length) {
    console.log("AGENTS.md と CLAUDE.md は作成済みです。変更しませんでした。");
    return 0;
  }

  let answers;
  if (args.yes) {
    answers = defaultAnswers(target, packageData);
  } else {
    if (!process.stdin.isTTY) {
      console.error("対話実行には端末が必要です。自動設定する場合は --yes を指定してください。");
      return 2;
    }
    try {
      answers = await runWizard(target, packageData);
    } catch (error) {
      console.error("\nウィザードを中断しました: " + error.message);
      return 130;
    }
  }

  const files = {
    "AGENTS.md": renderAgents(target, packageData, answers),
    "CLAUDE.md": "# Claude Code\n\n@AGENTS.md\n",
  };
  const pending = Object.entries(files)
    .filter(([name]) => !fs.existsSync(path.join(target, name)))
    .map(([name, content]) => [path.join(target, name), content]);

  console.log("\n作成予定（既存ファイルは上書きしません）:");
  for (const [filename, content] of pending) showPreview(filename, content);

  if (!args.yes) {
    const answer = await new Promise((resolve) => {
      const interface_ = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: Boolean(process.stdin.isTTY),
      });
      const finish = (value) => {
        interface_.close();
        resolve(value);
      };
      interface_.once("line", finish);
      interface_.once("close", () => resolve(""));
      process.stdout.write("\nこの内容で作成しますか？ [y/N] ");
    });
    if (!["y", "yes"].includes(answer.trim().toLowerCase())) {
      console.log("ファイルは作成しませんでした。");
      return 0;
    }
  }

  for (const [filename, content] of pending) {
    try {
      fs.writeFileSync(filename, content, { encoding: "utf8", flag: "wx" });
      console.log("作成しました: " + path.basename(filename));
    } catch (error) {
      if (error.code === "EEXIST") {
        console.log("作成をスキップ（確認中に作成済み）: " + path.basename(filename));
      } else {
        console.error(path.basename(filename) + " を作成できません: " + error.message);
        return 1;
      }
    }
  }
  return 0;
}

main()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
