#!/usr/bin/env python3
"""Muxy の設定ファイル（TOML）を、基準の値が相手にすべて入っているかで比べる。

使い方: muxy-settings-compare.py <基準.toml> <相手.toml> [--ignore 表.キー ...]

- 基準（例: MBP）にある値が、相手（例: mini）に同じ値で入っていなければ差として出す
- --ignore で指定した項目（最近使った一覧などの作業状態）は比べない
- 相手にだけある項目は差にしない（Muxy が足した既定値など）
差が無ければ終了コード 0、差があれば 1。
"""
import argparse
import sys
import tomllib


def differences(base, other, ignore, prefix=""):
    found = []
    for key, value in base.items():
        path = f"{prefix}{key}"
        if path in ignore:
            continue
        if key not in other:
            found.append(f"{path}: 相手に無い（基準: {value!r}）")
        elif isinstance(value, dict) and isinstance(other[key], dict):
            found += differences(value, other[key], ignore, path + ".")
        elif value != other[key]:
            found.append(f"{path}: 基準 {value!r} / 相手 {other[key]!r}")
    return found


def main():
    parser = argparse.ArgumentParser(description="Muxy の設定ファイルを基準と比べる")
    parser.add_argument("base")
    parser.add_argument("other")
    parser.add_argument("--ignore", action="append", default=[])
    args = parser.parse_args()
    with open(args.base, "rb") as f:
        base = tomllib.load(f)
    with open(args.other, "rb") as f:
        other = tomllib.load(f)
    found = differences(base, other, set(args.ignore))
    for line in found:
        print(line)
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())
