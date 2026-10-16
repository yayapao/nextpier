import { execFile, spawn } from 'node:child_process';
import { mkdtemp, readFile, realpath, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
export const harnessRepository = 'https://github.com/yayapao/app-harness.git';

async function validateSource(source, project) {
  const root = await realpath(source);
  const target = await realpath(project);
  if (
    root === target ||
    root.startsWith(`${target}${path.sep}`) ||
    target.startsWith(`${root}${path.sep}`)
  )
    throw new Error('app-harness 源目录必须位于目标项目之外');
  const pkg = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8')
  );
  if (pkg.name !== 'app-harness') throw new Error('源目录不是 app-harness');
  for (const entry of [
    'scripts/harness.mjs',
    'scripts/lib/install-nextpier.mjs',
    'harness/core/gateway.ts',
    'templates/next/app/harness/page.tsx',
  ])
    if (!(await stat(path.join(root, entry))).isFile())
      throw new Error(`app-harness 缺少 ${entry}`);
  return root;
}

export async function withHarnessSource(project, options, action) {
  if (options.source) {
    if (options.ref)
      throw new Error('--source 与 --ref 不能同时使用；本地源码请自行切换版本');
    return action(await validateSource(path.resolve(options.source), project));
  }
  if (
    options.ref &&
    (options.ref.startsWith('-') || /[\s\x00-\x1f]/.test(options.ref))
  )
    throw new Error('--ref 必须是有效的分支、tag 或完整 commit SHA');
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), 'nextpier-app-harness-')
  );
  const source = path.join(temporary, 'source');
  try {
    const repository = options.repository ?? harnessRepository;
    if (!options.ref) {
      await run('git', ['clone', '--depth', '1', '--', repository, source], {
        timeout: 120000,
      });
    } else {
      await run(
        'git',
        ['clone', '--depth', '1', '--no-checkout', '--', repository, source],
        { timeout: 120000 }
      );
      await run('git', ['fetch', '--depth', '1', 'origin', options.ref], {
        cwd: source,
        timeout: 120000,
      });
      await run('git', ['checkout', '--detach', 'FETCH_HEAD'], {
        cwd: source,
        timeout: 120000,
      });
    }
    return await action(await validateSource(source, project));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export function runHarnessCommand(source, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(source, 'scripts/harness.mjs'), ...args],
      { cwd, stdio: 'inherit' }
    );
    child.once('error', reject);
    child.once('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`app-harness 命令失败（${code}）`))
    );
  });
}
