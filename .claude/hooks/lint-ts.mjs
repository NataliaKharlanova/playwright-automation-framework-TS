// PostToolUse hook: lint a .ts file right after Claude edits it.
// Exit 2 + stderr feeds ESLint errors back to Claude so it fixes them; warnings don't block.
import { spawnSync } from 'node:child_process';
import path from 'node:path';

let input = '';
for await (const chunk of process.stdin) input += chunk;

const { tool_input = {}, tool_response = {} } = JSON.parse(input || '{}');
const file = tool_input.file_path ?? tool_response.filePath;
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

// Only project .ts files; ESLint would reject paths outside the project root
if (!file || !file.endsWith('.ts') || path.relative(root, file).startsWith('..')) process.exit(0);

const res = spawnSync('npx', ['--no-install', 'eslint', '--no-warn-ignored', file], { cwd: root, encoding: 'utf8' });
if (res.status === 0) process.exit(0);

process.stderr.write(`ESLint found problems in ${path.relative(root, file)}:\n${res.stdout}${res.stderr}`);
process.exit(2);
