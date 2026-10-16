import { spawn } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runHarnessCommand,
  withHarnessSource,
} from '../lib/app-harness-source.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const temporary = await mkdtemp(
  path.join(os.tmpdir(), 'nextpier-harness-check-')
);
const project = path.join(temporary, 'project');
const dependencies = path.join(temporary, 'dependencies');

function run(executable, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32' && executable.endsWith('.cmd'),
    });
    child.once('error', reject);
    child.once('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${executable} exited with ${code}`))
    );
  });
}

try {
  await mkdir(project);
  await mkdir(dependencies);
  await writeFile(
    path.join(dependencies, 'package.json'),
    JSON.stringify({
      private: true,
      dependencies: {
        openai: '^7.4.0',
        'eventsource-parser': '^3.0.6',
        tsx: '^4.20.6',
      },
    })
  );
  await run(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
    dependencies
  );
  for (const entry of [
    'package.json',
    'nextpier.config.json',
    'tsconfig.json',
    'eslint.config.mjs',
    'app',
    'components',
    'lib',
    'types',
    'hooks',
    'scripts',
  ])
    await cp(path.join(repository, entry), path.join(project, entry), {
      recursive: true,
    });
  await mkdir(path.join(project, 'node_modules'));
  for (const entry of await readdir(path.join(repository, 'node_modules'), {
    withFileTypes: true,
  })) {
    if (
      !entry.isDirectory() ||
      entry.name.startsWith('.') ||
      ['openai', 'eventsource-parser', 'tsx'].includes(entry.name)
    )
      continue;
    await symlink(
      path.join(repository, 'node_modules', entry.name),
      path.join(project, 'node_modules', entry.name),
      process.platform === 'win32' ? 'junction' : undefined
    );
  }
  for (const entry of ['openai', 'eventsource-parser', 'tsx'])
    await symlink(
      path.join(dependencies, 'node_modules', entry),
      path.join(project, 'node_modules', entry),
      process.platform === 'win32' ? 'junction' : undefined
    );
  await withHarnessSource(
    project,
    { source: process.env.APP_HARNESS_SOURCE },
    (source) =>
      runHarnessCommand(
        source,
        ['install-nextpier', '--project', project, '--skip-install'],
        project
      )
  );
  await run(
    process.execPath,
    [path.join(project, 'scripts', 'harness.mjs'), 'doctor'],
    project
  );
  await run(
    process.execPath,
    [path.join(repository, 'node_modules/typescript/bin/tsc'), '--noEmit'],
    project
  );
  await run(
    process.execPath,
    [
      path.join(repository, 'node_modules/eslint/bin/eslint.js'),
      'harness',
      'components/harness',
      'lib/harness',
      'app/harness',
      'app/settings',
      'app/@harness',
      'app/api/harness',
      'types/harness.ts',
    ],
    project
  );
  const files = [];
  for (const directory of [
    'harness/core',
    'harness/adapters',
    'harness/tests',
  ]) {
    for (const file of await readdir(path.join(project, directory)))
      if (file.endsWith('.test.ts'))
        files.push(path.join(project, directory, file));
  }
  await run(
    process.execPath,
    [
      path.join(dependencies, 'node_modules/tsx/dist/cli.mjs'),
      '--test',
      ...files,
    ],
    project
  );
  console.log('Harness template: TypeScript, ESLint and runtime tests passed.');
} finally {
  await rm(temporary, { recursive: true, force: true });
}
