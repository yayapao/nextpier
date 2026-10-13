#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { exists } from './lib/upgrade-wails.mjs';
import { upgradeHarness } from './lib/upgrade-harness.mjs';
import { prepareHarnessIntegration } from './lib/prepare-harness.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'skip-install': { type: 'boolean' },
    project: { type: 'string' },
    output: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
});

async function main() {
  if (values.help || !positionals.length) {
    console.log(
      '用法：node scripts/harness.mjs upgrade [--skip-install]\n      node scripts/harness.mjs doctor\n      node scripts/harness.mjs prepare --project <目标项目> [--output <迁移包目录>]'
    );
    return;
  }
  const [command] = positionals;
  if (
    !['upgrade', 'doctor', 'prepare'].includes(command) ||
    positionals.length !== 1
  )
    throw new Error('未知命令');
  if (command !== 'upgrade' && values['skip-install'])
    throw new Error('--skip-install 仅用于 upgrade');
  if (command === 'prepare') {
    if (!values.project) throw new Error('prepare 需要 --project 指定目标项目');
    const result = await prepareHarnessIntegration(
      path.resolve(values.project),
      root,
      { output: values.output }
    );
    console.log(
      `Harness 迁移包：${result.output}\n建议适配方式：${result.strategy}\n待审核候选工具：${result.candidateCount}\n将 ${path.join(result.output, 'INTEGRATE.md')} 交给 Codex 继续实施；目标项目未修改。`
    );
    return;
  }
  if (values.project || values.output)
    throw new Error('--project 和 --output 仅用于 prepare');
  if (command === 'upgrade') {
    const result = await upgradeHarness(
      root,
      path.join(root, 'templates', 'harness')
    );
    if (!values['skip-install']) {
      await new Promise((resolve, reject) => {
        const child = spawn(
          process.platform === 'win32' ? 'npm.cmd' : 'npm',
          ['install'],
          { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' }
        );
        child.once('error', reject);
        child.once('exit', (code) =>
          code === 0
            ? resolve()
            : reject(
                new Error('依赖安装失败；工程已保留，请运行 npm install 后重试')
              )
        );
      });
    }
    console.log(
      `${result.created ? '已接入' : '已配置'} Browser Harness：/harness\n下一步：${values['skip-install'] ? 'npm install，然后 ' : ''}npm run harness:doctor`
    );
    return;
  }
  if (!(await exists(path.join(root, 'harness', 'nextpier.json'))))
    throw new Error('请先运行 npm run upgrade:harness');
  await upgradeHarness(root, path.join(root, 'templates', 'harness'));
  const missing = [];
  for (const dependency of ['openai', 'eventsource-parser', 'tsx']) {
    if (
      !(await exists(
        path.join(root, 'node_modules', dependency, 'package.json')
      ))
    )
      missing.push(dependency);
  }
  const config = JSON.parse(
    await readFile(path.join(root, 'nextpier.config.json'), 'utf8')
  );
  if (!config.features?.harness) missing.push('features.harness');
  if (missing.length)
    throw new Error(`缺少 ${missing.join('、')}；请检查配置并运行 npm install`);
  const { loadEnvConfig } = createRequire(path.join(root, 'package.json'))(
    '@next/env'
  );
  loadEnvConfig(root, process.env.NODE_ENV !== 'production');
  const mode = process.env.HARNESS_MODE?.trim() || 'demo';
  if (!['demo', 'openai'].includes(mode))
    throw new Error('HARNESS_MODE 必须为 demo 或 openai');
  if (
    mode === 'openai' &&
    (!process.env.HARNESS_MODEL?.trim() || !process.env.OPENAI_API_KEY?.trim())
  )
    throw new Error('openai 模式缺少 HARNESS_MODEL 或 OPENAI_API_KEY');
  console.log(
    `Harness 工程、依赖与配置已就绪，模式：${mode}。未请求模型；配置见 .env.harness.example 和 docs/harness.md。`
  );
}

main().catch((error) => {
  console.error(`[NextPier Harness] ${error.message}`);
  process.exitCode = 1;
});
