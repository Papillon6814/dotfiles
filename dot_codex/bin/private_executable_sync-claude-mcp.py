#!/usr/bin/env python3
"""Sync global Claude MCP registrations into Codex. Run with --apply to write."""
import argparse
import datetime
import json
import os
from pathlib import Path
import tempfile
import tomllib

BEGIN = '# BEGIN MCP SYNC FROM CLAUDE'
END = '# END MCP SYNC FROM CLAUDE'
# 各ツールの導入コマンドが Claude と Codex の両方へ自分で書くサーバー。同期の対象にしない（2026-10-18）
TOOL_OWNED = {'zvec_grep': 'zg install'}

def select_sources(source):
    return {name: server for name, server in source.items() if name not in TOOL_OWNED}

def render(source, original, timeouts=None):
    if original.count(BEGIN) != original.count(END) or original.count(BEGIN) > 1:
        raise ValueError('Invalid managed block markers')
    if BEGIN in original:
        start = original.index(BEGIN)
        end = original.index(END, start) + len(END)
        prefix, suffix = original[:start], original[end:]
    else:
        prefix, suffix = original.rstrip() + '\n\n', '\n'
    existing = tomllib.loads(prefix + suffix).get('mcp_servers', {})
    conflicts = set(existing) & set(source)
    if conflicts:
        raise ValueError('Existing unmanaged servers conflict: ' + ', '.join(sorted(conflicts)))
    lines = [BEGIN]
    q = lambda value: json.dumps(value, ensure_ascii=False)
    expected = {}
    for name, server in source.items():
        kind = server.get('type', 'stdio')
        if kind == 'stdio':
            allowed = {'type', 'command', 'args', 'env', 'cwd'}
            entry = {'command': server['command'], 'args': server.get('args', [])}
            for key in ('env', 'cwd'):
                if server.get(key):
                    entry[key] = server[key]
        elif kind == 'http':
            allowed = {'type', 'url', 'headers'}
            entry = {'url': server['url']}
            if server.get('headers'):
                entry['http_headers'] = server['headers']
        else:
            raise ValueError('Unsupported transport for ' + name)
        if set(server) - allowed:
            raise ValueError('Unsupported fields for ' + name)
        if timeouts:
            entry.update(timeouts)
        expected[name] = entry
        lines += ['', '[mcp_servers.' + q(name) + ']']
        for key, value in entry.items():
            if not isinstance(value, dict):
                lines.append(key + ' = ' + q(value))
        for key, value in entry.items():
            if isinstance(value, dict):
                lines += ['', '[mcp_servers.' + q(name) + '.' + key + ']']
                lines += [q(k) + ' = ' + q(v) for k, v in value.items()]
    lines += [END]
    result = prefix + '\n'.join(lines) + suffix
    parsed = tomllib.loads(result)
    assert parsed.get('mcp_servers', {}) == {**existing, **expected}
    before = tomllib.loads(original)
    assert {k:v for k,v in parsed.items() if k != 'mcp_servers'} == {k:v for k,v in before.items() if k != 'mcp_servers'}
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    home = Path.home()
    all_sources = json.loads((home / '.claude.json').read_text())['mcpServers']
    source = select_sources(all_sources)
    for name in sorted(set(all_sources) - set(source)):
        print('Skipped (managed by ' + TOOL_OWNED[name] + '): ' + name)
    target = home / '.codex/config.toml'
    original = target.read_text()
    settings = json.loads((home / '.claude/settings.json').read_text())
    env = settings.get('env', {})
    timeouts = {}
    for src, dst in [('MCP_TIMEOUT', 'startup_timeout_sec'), ('MCP_TOOL_TIMEOUT', 'tool_timeout_sec')]:
        if src in env:
            value = float(env[src]) / 1000
            if value <= 0:
                raise ValueError('Invalid timeout: ' + src)
            timeouts[dst] = value
    result = render(source, original, timeouts)
    assert render(source, result, timeouts) == result
    print('Validated servers: ' + ', '.join(source))
    if not args.apply:
        print('Dry run passed; no files changed.')
        return
    if result == original:
        print('Already synchronized.')
        return
    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    backup = target.with_name('config.toml.before-mcp-sync-' + stamp)
    with open(backup, 'x', opener=lambda path, flags: os.open(path, flags, 0o600)) as stream:
        stream.write(original)
    fd, temporary = tempfile.mkstemp(prefix='.mcp-sync-', dir=target.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            stream.write(result)
        if target.read_text() != original:
            raise RuntimeError('Config changed concurrently; retry sync')
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print('Updated ' + str(target))
    print('Backup: ' + str(backup))

if __name__ == '__main__':
    main()
