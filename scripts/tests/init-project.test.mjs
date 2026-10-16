import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { initializeProject } from '../lib/init-project.mjs';
import { exists } from '../lib/upgrade-wails.mjs';
import { upgradeWails } from '../lib/upgrade-wails.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));

async function fixture(t) {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'nextpier-init-test-')
  );
  t.after(() => rm(directory, { recursive: true, force: true }));
  const project = path.join(directory, 'project');
  await mkdir(project);
  return { directory, project };
}

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

test('initializing a cloned repository preserves Git history, origin and license', async (t) => {
  const { project } = await fixture(t);
  git(project, 'init', '--quiet');
  git(project, 'remote', 'add', 'origin', 'https://example.com/starbaby.git');
  await writeFile(
    path.join(project, 'LICENSE'),
    'Existing project license\n'
  );
  git(project, 'add', 'LICENSE');
  git(
    project,
    '-c',
    'user.name=NextPier Test',
    '-c',
    'user.email=test@example.com',
    'commit',
    '--quiet',
    '-m',
    'Initial license'
  );
  const before = await Promise.all(
    ['config', 'HEAD', 'index'].map((file) =>
      readFile(path.join(project, '.git', file))
    )
  );
  const head = git(project, 'rev-parse', 'HEAD');

  const result = await initializeProject(project, repository, {
    name: 'starbaby',
  });
  assert.equal(result.created, true);
  assert.deepEqual(result.preserved, ['.git', 'LICENSE']);
  assert.equal(git(project, 'rev-parse', 'HEAD'), head);
  assert.equal(
    git(project, 'remote', 'get-url', 'origin'),
    'https://example.com/starbaby.git'
  );
  assert.deepEqual(
    await Promise.all(
      ['config', 'HEAD', 'index'].map((file) =>
        readFile(path.join(project, '.git', file))
      )
    ),
    before
  );
  assert.equal(
    await readFile(path.join(project, 'LICENSE'), 'utf8'),
    'Existing project license\n'
  );
  const pkg = JSON.parse(
    await readFile(path.join(project, 'package.json'), 'utf8')
  );
  const lock = JSON.parse(
    await readFile(path.join(project, 'package-lock.json'), 'utf8')
  );
  const template = JSON.parse(
    await readFile(path.join(repository, 'package.json'), 'utf8')
  );
  assert.equal(pkg.name, 'starbaby');
  assert.equal(lock.name, 'starbaby');
  assert.equal(lock.packages[''].name, 'starbaby');
  assert.equal(pkg.dependencies.next, template.dependencies.next);
  for (const relative of [
    '.agents/skills/next-best-practices/SKILL.md',
    'AGENTS.md',
    'app/page.tsx',
    'scripts/init.mjs',
    'scripts/lib/init-project.mjs',
    'templates/wails/go.mod',
    'scripts/lib/app-harness-source.mjs',
  ])
    assert.ok(await exists(path.join(project, relative)), relative);
  for (const relative of [
    'node_modules', '.next', 'data', 'CLAUDE.md', '.claude',
    'templates/harness', 'harness', '.agents/skills/harness-integrator',
  ])
    assert.equal(await exists(path.join(project, relative)), false, relative);

  await upgradeWails(
    project,
    path.join(project, 'templates', 'wails'),
    { name: 'Starbaby', id: 'com.example.starbaby' }
  );
  assert.ok(await exists(path.join(project, 'desktop', 'nextpier.json')));
  assert.equal(
    await readFile(path.join(project, 'LICENSE'), 'utf8'),
    'Existing project license\n'
  );
});

test('existing README and ignore rules survive initialization', async (t) => {
  const { project } = await fixture(t);
  await writeFile(path.join(project, 'README.md'), '# My project\n');
  await writeFile(path.join(project, '.gitignore'), '/personal-data/');
  await initializeProject(project, repository, { name: 'my-app' });
  assert.equal(
    await readFile(path.join(project, 'README.md'), 'utf8'),
    '# My project\n'
  );
  const ignores = await readFile(path.join(project, '.gitignore'), 'utf8');
  assert.ok(ignores.startsWith('/personal-data/\n'));
  for (const line of ['/node_modules', '/.next/', '.env*', '/data/config.json'])
    assert.ok(ignores.split('\n').includes(line), line);
});

test('conflicting files and existing packages fail before importing files', async (t) => {
  for (const relative of ['next.config.ts', 'AGENTS.md', 'package.json']) {
    const { project } = await fixture(t);
    const original = relative === 'package.json'
      ? '{"name":"existing"}\n'
      : 'Existing user content\n';
    await writeFile(path.join(project, relative), original);
    await assert.rejects(
      initializeProject(project, repository),
      /已有 package.json|需要合并/
    );
    assert.equal(
      await readFile(path.join(project, relative), 'utf8'),
      original
    );
    assert.equal(await exists(path.join(project, 'app')), false);
    assert.equal(await exists(path.join(project, '.agents')), false);
  }
});

test('parent path conflicts and symlinks cannot redirect imported files', async (t) => {
  const { directory, project } = await fixture(t);
  await writeFile(path.join(project, 'app'), 'User file\n');
  await assert.rejects(
    initializeProject(project, repository),
    /目标路径冲突|需要合并/
  );
  assert.equal(await exists(path.join(project, 'package.json')), false);
  await rm(path.join(project, 'app'));
  const external = path.join(directory, 'external');
  await mkdir(external);
  await symlink(
    external,
    path.join(project, 'app'),
    process.platform === 'win32' ? 'junction' : 'dir'
  );
  await assert.rejects(
    initializeProject(project, repository),
    /目标路径冲突/
  );
  assert.equal(await exists(path.join(external, 'page.tsx')), false);
  assert.equal(await exists(path.join(project, 'package.json')), false);
});

test('repeated initialization keeps edited NextPier files and package metadata', async (t) => {
  const { project } = await fixture(t);
  await initializeProject(project, repository, { name: 'my-app' });
  await writeFile(
    path.join(project, 'app', 'page.tsx'),
    '// My business page\n'
  );
  const before = await readFile(path.join(project, 'package.json'), 'utf8');
  const result = await initializeProject(project, repository, {
    name: 'another-app',
  });
  assert.equal(result.created, false);
  assert.equal(
    await readFile(path.join(project, 'app', 'page.tsx'), 'utf8'),
    '// My business page\n'
  );
  assert.equal(
    await readFile(path.join(project, 'package.json'), 'utf8'),
    before
  );
});

test('CLI initializes a missing target with spaces from the caller directory', async (t) => {
  const { directory } = await fixture(t);
  const result = spawnSync(
    process.execPath,
    [
      path.join(repository, 'scripts', 'init.mjs'),
      '--project', 'my project', '--name', 'my-app',
    ],
    { cwd: directory, encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /已初始化 NextPier/);
  assert.ok(
    await exists(path.join(directory, 'my project', 'app', 'page.tsx'))
  );
  const missingProject = spawnSync(
    process.execPath,
    [path.join(repository, 'scripts', 'init.mjs')],
    { cwd: directory, encoding: 'utf8' }
  );
  assert.equal(missingProject.status, 1);
  assert.match(missingProject.stderr, /--project/);
});

test('invalid names, overlapping directories and incomplete templates cause no writes', async (t) => {
  const { directory, project } = await fixture(t);
  await assert.rejects(
    initializeProject(project, repository, { name: '../other' }),
    /--name/
  );
  for (const target of [
    repository, path.join(repository, 'nested'), path.dirname(repository),
  ])
    await assert.rejects(
      initializeProject(target, repository),
      /相互独立/
    );
  const incomplete = path.join(directory, 'incomplete');
  await mkdir(incomplete);
  await assert.rejects(
    initializeProject(project, incomplete),
    /模板不完整/
  );
  assert.equal(await exists(path.join(project, 'package.json')), false);
});
