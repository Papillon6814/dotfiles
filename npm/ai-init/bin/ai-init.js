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

function renderAgents(directory, packageData) {
  const name = projectName(directory, packageData);
  const stacks = detectedStacks(directory);
  const stackLine = stacks.length ? stacks.join(", ") : "未検出（必要に応じて追記）";
  const commands = projectCommands(directory, packageData);
  const commandLines = commands.length
    ? commands.map((command) => "- " + BACKTICK + command + BACKTICK).join("\n")
    : "- README / CI / manifest で実在を確認してから追記する";

  return [
    "# " + name + " — AI エージェント向け指示",
    "",
    "## プロジェクト",
    "- 検出した技術: " + stackLine,
    "- この雛形はルート直下の manifest だけを確認する。プロジェクトの実態はソースコードでも確認する。",
    "",
    "## コマンド",
    commandLines,
    "",
    "## 作業ルール",
    "- 応答は日本語を基本にする。",
    "- 編集前に README、既存の指示ファイル、関連コードを確認し、既存の設計・命名に合わせる。",
    "- 文字列検索には " + BACKTICK + "rg" + BACKTICK + " を使い、コード変更は既存の Git 運用がなければ feature branch と worktree で行う。",
    "- 変更前に " + BACKTICK + "git status" + BACKTICK + " を確認し、ユーザーの既存変更を保護する。",
    "- コマンドや設定値を推測で作らず、manifest とドキュメントで確認する。",
    "- 破壊的操作、外部送信、公開、push はユーザーの明示許可を得てから行う。",
    "- プロジェクトで定めた検証手順を使い、結果と未実施項目を報告する。",
    "- 繰り返し必要になるプロジェクト固有ルールはこのファイルへ追加する。特定ディレクトリだけの規則は近い階層の " + BACKTICK + "AGENTS.md" + BACKTICK + " に置く。",
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

function askConfirmation() {
  return new Promise((resolve) => {
    const interface_ = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: Boolean(process.stdin.isTTY),
    });
    let settled = false;
    const finish = (answer) => {
      if (settled) return;
      settled = true;
      interface_.close();
      resolve(answer);
    };
    interface_.once("line", finish);
    interface_.once("close", () => finish(""));
    process.stdout.write("\n作成しますか？ [y/N] ");
  });
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
    "既存リポジトリに AGENTS.md と CLAUDE.md を作成します。",
    "",
    "引数:",
    "  path       対象のリポジトリまたはディレクトリ（省略時: カレントディレクトリ）",
    "  --yes, -y  確認プロンプトを省略",
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
  const files = {
    "AGENTS.md": renderAgents(target, packageData),
    "CLAUDE.md": "# Claude Code\n\n@AGENTS.md\n",
  };
  const pending = Object.entries(files)
    .filter(([name]) => !fs.existsSync(path.join(target, name)))
    .map(([name, content]) => [path.join(target, name), content]);

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
  if (!pending.length) {
    console.log("AGENTS.md と CLAUDE.md は作成済みです。変更しませんでした。");
    return 0;
  }

  console.log("\n作成予定（既存ファイルは上書きしません）:");
  for (const [filename, content] of pending) showPreview(filename, content);

  if (!args.yes) {
    const answer = await askConfirmation();
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
