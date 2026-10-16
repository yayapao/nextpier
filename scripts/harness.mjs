#!/usr/bin/env node
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import {
  runHarnessCommand,
  withHarnessSource,
} from './lib/app-harness-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'skip-install': { type: 'boolean' },
      project: { type: 'string' },
      output: { type: 'string' },
      source: { type: 'string' },
      ref: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  const [command] = positionals;
  if (values.help || !command) {
    console.log(`用法：node scripts/harness.mjs upgrade [--skip-install] [--ref <tag或commit> | --source <本地app-harness>]
      node scripts/harness.mjs doctor [--source <本地app-harness>]
      node scripts/harness.mjs prepare --project <目标项目> [--output <迁移包>] [--ref <版本> | --source <本地app-harness>]
默认从 https://github.com/yayapao/app-harness.git 获取源码。`);
    return;
  }
  if (
    !['upgrade', 'doctor', 'prepare'].includes(command) ||
    positionals.length !== 1
  )
    throw new Error('未知命令');
  if (command !== 'upgrade' && values['skip-install'])
    throw new Error('--skip-install 仅用于 upgrade');
  if (command !== 'prepare' && (values.project || values.output))
    throw new Error('--project 和 --output 仅用于 prepare');
  if (command === 'prepare' && !values.project)
    throw new Error('prepare 需要 --project 指定目标项目');
  const source = values.source || process.env.APP_HARNESS_SOURCE;
  if (source && values.ref) throw new Error('--source 与 --ref 不能同时使用');
  // New installations carry their own doctor; checking them works without Git or network.
  if (command === 'doctor' && !source && !values.ref) {
    const doctor = path.join(root, 'harness/doctor.mjs');
    let present = false;
    try {
      await access(doctor);
      present = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (present)
      return (await import(pathToFileURL(doctor).href)).doctorHarness(root);
    try {
      await access(path.join(root, 'harness/nextpier.json'));
    } catch (error) {
      if (['ENOENT', 'ENOTDIR'].includes(error.code))
        throw new Error('请先运行 npm run upgrade:harness');
      throw error;
    }
  }
  const project = command === 'prepare' ? path.resolve(values.project) : root;
  await withHarnessSource(project, { source, ref: values.ref }, (checkout) => {
    const args = [
      command === 'upgrade' ? 'install-nextpier' : command,
      '--project',
      project,
    ];
    if (values.output) args.push('--output', path.resolve(values.output));
    if (values['skip-install']) args.push('--skip-install');
    return runHarnessCommand(checkout, args, root);
  });
}

main().catch((error) => {
  console.error(`[NextPier Harness] ${error.message}`);
  process.exitCode = 1;
});
