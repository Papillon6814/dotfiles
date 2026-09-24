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
    console.error("Warning: could not read package.json: " + error.message);
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

async function askText(
  reader,
  step,
  emoji,
  label,
  question,
  defaultValue = "",
  displayDefault = defaultValue,
) {
  console.log("\n" + emoji + " " + step + "/" + WIZARD_STEPS + " " + label);
  console.log("  ? " + question);
  const hint = displayDefault ? "Enter = " + displayDefault : "Enter to skip";
  const answer = await reader.ask("  > [" + hint + "] ");
  if (answer === null) throw new Error("Input ended.");
  return safeText(answer) || defaultValue;
}

async function askChoice(reader, step, emoji, label, question, choices, defaultIndex = 0) {
  console.log("\n" + emoji + " " + step + "/" + WIZARD_STEPS + " " + label);
  console.log("  ? " + question);
  choices.forEach(([label], index) => {
    const marker = index === defaultIndex ? "●" : "○";
    console.log("    " + marker + " " + (index + 1) + ") " + label);
  });
  while (true) {
    const answer = await reader.ask("  > [Enter = " + (defaultIndex + 1) + "] ");
    if (answer === null) throw new Error("Input ended.");
    const selected = answer.trim();
    if (!selected) return choices[defaultIndex][1];
    if (/^[0-9]+$/.test(selected)) {
      const index = Number(selected) - 1;
      if (index >= 0 && index < choices.length) return choices[index][1];
    }
    console.log("    Please enter one of the listed numbers.");
  }
}

function parseCommands(value) {
  const normalized = safeText(value);
  if (["", "none", "なし", "-"].includes(normalized.toLowerCase())) return [];
  return normalized.split(",").map((command) => command.trim()).filter(Boolean);
}

async function runWizard(directory, packageData) {
  const defaults = defaultAnswers(directory, packageData);
  const displayedStack = defaults.stacks === "未検出" ? "Not detected" : defaults.stacks;
  const reader = createInputReader();
  try {
    console.log("\n╭─ 🤖 ai-init");
    console.log("│ Let's create your AI project instructions.");
    console.log("│ Press Enter to accept detected values or recommendations.");
    console.log("╰──────────────────────────");

    const description = await askText(
      reader,
      1,
      "✨",
      "Project overview",
      "What are you building?",
    );
    console.log("  🔎 Detected: " + displayedStack);
    const stacks = await askText(
      reader,
      2,
      "🧩",
      "Tech stack",
      "Add or adjust the detected stack (comma-separated).",
      defaults.stacks,
      displayedStack,
    );
    const detectedCommands = defaults.commands.join(", ");
    const commandsAnswer = await askText(
      reader,
      3,
      "🛠️",
      "Development commands",
      "Which commands should the AI use? Separate multiple commands with commas; type none to clear.",
      detectedCommands,
    );
    const responseLanguage = await askChoice(
      reader,
      4,
      "💬",
      "Response language",
      "Which language should the AI use in its replies?",
      [
        ["Japanese", "日本語"],
        ["English", "英語"],
        ["Match the user's language", "ユーザーの言語に合わせる"],
      ],
      0,
    );
    const focus = await askText(
      reader,
      5,
      "🎯",
      "AI priorities",
      "What should the AI focus on?",
      defaults.focus,
      "Implementation, bug fixes, and maintainability",
    );
    const testingPolicy = await askChoice(
      reader,
      6,
      "🧪",
      "Testing and verification",
      "How should the AI handle tests and checks?",
      [
        [
          "Run relevant tests and checks for each change",
          "変更に合わせて適切なテスト・検証を行う",
        ],
        ["Ask before running them", "実行前に確認する"],
        [
          "Run tests only when explicitly requested",
          "ユーザーが依頼した場合のみテストを実行する",
        ],
      ],
      2,
    );
    const gitWorkflow = await askChoice(
      reader,
      7,
      "🌿",
      "Git workflow",
      "How should the AI handle branches and worktrees?",
      [
        [
          "Follow existing rules; otherwise use a feature branch and worktree",
          "既存ルールを優先し、未定義なら feature branch + worktree を使う",
        ],
        ["Work on the current branch", "現在のブランチで作業する"],
        ["Ask me before choosing a workflow", "着手前に方針を確認する"],
      ],
      0,
    );
    const additionalRules = await askText(
      reader,
      8,
      "📝",
      "Additional instructions",
      "Anything else the AI should follow?",
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
    console.log("\n✅ Answers recorded.");
    console.log("  📦 " + (description || projectName(directory, packageData)));
    console.log("  🧩 " + (stacks === "未検出" ? "Not detected" : stacks));
    console.log("  💬 Language, testing, and Git preferences saved.");
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
      throw new Error("Unknown option: " + argument);
    } else if (!selectedPath) {
      parsed.path = argument;
      selectedPath = true;
    } else {
      throw new Error("Only one target directory can be specified.");
    }
  }
  return parsed;
}

function usage() {
  return [
    "Usage: ai-init [path] [--yes]",
    "",
    "Create AGENTS.md and CLAUDE.md in an existing repository with an interactive wizard.",
    "",
    "Arguments:",
    "  path       Target repository or directory (default: current directory)",
    "  --yes, -y  Skip questions and confirmation; use detected defaults",
    "  --help     Show this help",
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
    console.error("Warning: no Git root found; using this directory: " + target);
  }

  const packageData = readPackageJson(target);
  console.log("Target: " + target);
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
        "Note: existing CLAUDE.md will not be changed. Add @AGENTS.md to include the shared instructions.",
      );
    }
  }

  const missing = ["AGENTS.md", "CLAUDE.md"].filter(
    (name) => !fs.existsSync(path.join(target, name)),
  );
  if (!missing.length) {
    console.log("AGENTS.md and CLAUDE.md already exist. No files were changed.");
    return 0;
  }

  let answers;
  if (args.yes) {
    answers = defaultAnswers(target, packageData);
  } else {
    if (!process.stdin.isTTY) {
      console.error("Interactive setup requires a terminal. Use --yes to create files with detected defaults.");
      return 2;
    }
    try {
      answers = await runWizard(target, packageData);
    } catch (error) {
      console.error("\nWizard cancelled: " + error.message);
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

  console.log("\nFiles to create (existing files will not be overwritten):");
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
      process.stdout.write("\nCreate these files? [y/N] ");
    });
    if (!["y", "yes"].includes(answer.trim().toLowerCase())) {
      console.log("No files were created.");
      return 0;
    }
  }

  for (const [filename, content] of pending) {
    try {
      fs.writeFileSync(filename, content, { encoding: "utf8", flag: "wx" });
      console.log("Created: " + path.basename(filename));
    } catch (error) {
      if (error.code === "EEXIST") {
        console.log("Skipped (created while confirming): " + path.basename(filename));
      } else {
        console.error("Could not create " + path.basename(filename) + ": " + error.message);
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
