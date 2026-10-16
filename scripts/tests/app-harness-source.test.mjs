import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import {
  harnessRepository,
  withHarnessSource,
} from '../lib/app-harness-source.mjs';

const repository = new URL('../../', import.meta.url).pathname;
const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

async function fixture(t) {
  const temporary = await realpath(
    await mkdtemp(path.join(os.tmpdir(), 'nextpier-external-harness-'))
  );
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const source = path.join(temporary, 'app harness source');
  const project = path.join(temporary, 'target project');
  await mkdir(source);
  await mkdir(project);
  for (const file of [
    'scripts/harness.mjs',
    'scripts/lib/install-nextpier.mjs',
    'harness/core/gateway.ts',
    'templates/next/app/harness/page.tsx',
  ]) {
    await mkdir(path.dirname(path.join(source, file)), { recursive: true });
    await writeFile(
      path.join(source, file),
      file.endsWith('harness.mjs')
        ? 'console.log(JSON.stringify(process.argv.slice(2)));'
        : '// source\n'
    );
  }
  await writeFile(
    path.join(source, 'package.json'),
    '{"name":"app-harness","version":"0.2.0"}'
  );
  git(source, 'init', '--quiet', '--initial-branch=trunk');
  git(source, 'add', '.');
  git(
    source,
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.com',
    'commit',
    '--quiet',
    '-m',
    'Source'
  );
  return { temporary, project, source };
}

test('external source defaults to public GitHub and local paths preserve the checkout', async (t) => {
  const { source, project } = await fixture(t);
  assert.equal(harnessRepository, 'https://github.com/yayapao/app-harness.git');
  await withHarnessSource(project, { source }, async (checkout) =>
    assert.equal(checkout, source)
  );
  assert.equal(
    JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8')).name,
    'app-harness'
  );
  await assert.rejects(
    withHarnessSource(project, { source, ref: 'trunk' }, () => {}),
    /不能同时/
  );
  await assert.rejects(
    withHarnessSource(source, { source }, () => {}),
    /之外/
  );
});

test('Git source uses its default branch, supports tag and SHA and always cleans temporary files', async (t) => {
  const { source, project } = await fixture(t);
  const commit = git(source, 'rev-parse', 'HEAD');
  git(source, 'tag', 'v-test');
  let checkout;
  for (const ref of [undefined, 'v-test', commit]) {
    await withHarnessSource(
      project,
      { repository: pathToFileURL(source).href, ref },
      async (root) => {
        checkout = root;
        assert.equal(git(root, 'rev-parse', 'HEAD'), commit);
        if (!ref) assert.equal(git(root, 'branch', '--show-current'), 'trunk');
      }
    );
    await assert.rejects(
      readFile(path.join(checkout, 'package.json')),
      /ENOENT/
    );
  }
  await assert.rejects(
    withHarnessSource(project, { repository: source }, async (root) => {
      checkout = root;
      throw new Error('callback failed');
    }),
    /callback failed/
  );
  await assert.rejects(readFile(path.join(checkout, 'package.json')), /ENOENT/);
  await assert.rejects(
    withHarnessSource(project, { ref: '--upload-pack=bad' }, () => {}),
    /有效/
  );
});

test('thin CLI forwards quoted paths and flags; generated doctor works offline', async (t) => {
  const { source, project } = await fixture(t);
  await cp(path.join(repository, 'scripts'), path.join(project, 'scripts'), {
    recursive: true,
  });
  const cli = path.join(project, 'scripts/harness.mjs');
  const run = (...args) =>
    spawnSync(process.execPath, [cli, ...args], {
      cwd: project,
      encoding: 'utf8',
      env: { ...process.env, APP_HARNESS_SOURCE: '' },
    });
  const upgrade = run('upgrade', '--source', source, '--skip-install');
  assert.equal(upgrade.status, 0, upgrade.stderr);
  assert.deepEqual(JSON.parse(upgrade.stdout), [
    'install-nextpier',
    '--project',
    project,
    '--skip-install',
  ]);
  const prepare = run(
    'prepare',
    '--source',
    source,
    '--project',
    project,
    '--output',
    path.join(project, '..', 'portable kit')
  );
  assert.equal(prepare.status, 0, prepare.stderr);
  assert.deepEqual(JSON.parse(prepare.stdout), [
    'prepare',
    '--project',
    project,
    '--output',
    path.join(project, '..', 'portable kit'),
  ]);
  await mkdir(path.join(project, 'harness'));
  await writeFile(
    path.join(project, 'harness/doctor.mjs'),
    'export function doctorHarness() { console.log("offline doctor"); }'
  );
  assert.match(run('doctor').stdout, /offline doctor/);
  assert.match(run('prepare').stderr, /--project/);
  assert.match(run('doctor', '--skip-install').stderr, /仅用于 upgrade/);
});
