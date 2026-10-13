import { createHash } from 'node:crypto';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { discoverHarnessProject } from './harness-discovery.mjs';

const uiFiles = [
  'animated-icon-button.tsx',
  'halo-card.tsx',
  'halo-input.tsx',
  'halo-tabs.tsx',
  'halo.module.css',
  'halo-tabs.module.css',
  'morph-popover.tsx',
  'texture-button.tsx',
  'button.tsx',
  'badge.tsx',
  'dialog.tsx',
  'select.tsx',
  'tabs.tsx',
  'tooltip.tsx',
  'form.tsx',
  'input.tsx',
  'label.tsx',
  'textarea.tsx',
  'cult-ui.LICENSE',
];
export const harnessSourceEntries = [
  'templates/harness',
  ...uiFiles.map((file) => `components/ui/${file}`),
  'components/build-in/header/actions.tsx',
  'components/settings/settings-shell.tsx',
  'types/ui.ts',
  'lib/utils.ts',
  'app/globals.css',
  'LICENSE',
  'docs/design-system.md',
  'docs/harness.md',
  'docs/harness-integration.md',
  '.agents/skills/harness-integrator',
];

function contains(parent, child) {
  const relative = path.relative(parent, child);
  return (
    !relative ||
    (relative !== '..' &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

async function outputPath(directory) {
  const suffix = [];
  let current = path.resolve(directory);
  while (true) {
    try {
      const info = await lstat(current);
      if (!info.isDirectory()) throw new Error('输出路径已存在或不是目录');
      return path.join(await realpath(current), ...suffix);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      suffix.unshift(path.basename(current));
      current = path.dirname(current);
    }
  }
}

async function collectSource(root, relative, files) {
  if (!contains(root, await realpath(path.join(root, relative))))
    throw new Error(`源文件越出模板目录：${relative}`);
  const info = await lstat(path.join(root, relative));
  if (info.isSymbolicLink())
    throw new Error(`源文件不能是符号链接：${relative}`);
  if (info.isDirectory()) {
    for (const entry of (await readdir(path.join(root, relative))).sort()) {
      if (entry.startsWith('.') && entry !== '.env.harness.example') continue;
      await collectSource(root, path.posix.join(relative, entry), files);
    }
  } else if (info.isFile()) files.push(relative);
  else throw new Error(`不支持的源文件：${relative}`);
}

export async function prepareHarnessIntegration(
  project,
  sourceDirectory,
  options = {}
) {
  const source = await realpath(sourceDirectory);
  const discovery = await discoverHarnessProject(project);
  const files = [];
  for (const entry of harnessSourceEntries)
    await collectSource(source, entry, files);
  const pkg = JSON.parse(
    await readFile(path.join(source, 'package.json'), 'utf8')
  );
  const destination = options.output ? await outputPath(options.output) : null;
  if (
    destination &&
    [source, discovery.project].some(
      (root) => contains(root, destination) || contains(destination, root)
    )
  )
    throw new Error('迁移包必须放在源模板和目标项目之外');
  const temporaryRoot = destination ? null : await realpath(os.tmpdir());
  if (
    temporaryRoot &&
    [source, discovery.project].some((root) => contains(root, temporaryRoot))
  )
    throw new Error(
      '临时目录位于源模板或目标项目内，请用 --output 指定项目之外的目录'
    );
  let output;
  if (destination) {
    await mkdir(path.dirname(destination), { recursive: true });
    await mkdir(destination);
    output = destination;
  } else
    output = await mkdtemp(path.join(temporaryRoot, 'nextpier-harness-kit-'));
  try {
    const inventory = [];
    for (const relative of files) {
      const content = await readFile(path.join(source, relative));
      const target = path.join(output, 'source', relative);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content, { flag: 'wx' });
      inventory.push({
        path: `source/${relative}`,
        sha256: createHash('sha256').update(content).digest('hex'),
      });
    }
    const manifest = {
      schemaVersion: 1,
      generator: 'nextpier-harness-integration',
      source,
      project: discovery.project,
      strategy: discovery.strategy,
      entrypoint: 'source/.agents/skills/harness-integrator/SKILL.md',
      layers: {
        core: 'source/templates/harness/harness/core',
        adapters: 'source/templates/harness/harness/adapters',
        nextHost: 'source/templates/harness',
        ui: 'source/templates/harness/components/harness',
        foundation: 'source/components/ui',
      },
      dependencies: {
        reference: pkg.dependencies,
        runtime: {
          openai: '^7.4.0',
          'eventsource-parser': '^3.0.6',
          zod: pkg.dependencies.zod,
        },
        development: { tsx: '^4.20.6' },
      },
      files: inventory,
    };
    await writeFile(
      path.join(output, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
      { flag: 'wx' }
    );
    await writeFile(
      path.join(output, 'discovery.json'),
      `${JSON.stringify(discovery, null, 2)}\n`,
      { flag: 'wx' }
    );
    await writeFile(
      path.join(output, 'INTEGRATE.md'),
      [
        '# Harness 接入任务',
        '',
        `目标项目：${JSON.stringify(discovery.project)}`,
        '',
        '本目录为已准备的 NextPier Harness 迁移包。先读取 manifest.json、discovery.json，',
        '再读取 source/.agents/skills/harness-integrator/SKILL.md，按其中的迁移包模式直接实施。',
        'source/ 只提供源码与宿主参考；候选工具尚未审核或注册。',
        '完成真实业务工具、基础 Agent、可执行流程、全局对话框和 Harness 管理页，',
        '保留目标项目技术栈、用户改动和鉴权，按目标项目规范验证并交付。',
        '',
      ].join('\n'),
      { flag: 'wx' }
    );
    return {
      output,
      candidateCount: discovery.candidates.length,
      strategy: discovery.strategy,
    };
  } catch (error) {
    await rm(output, { recursive: true, force: true });
    throw error;
  }
}
