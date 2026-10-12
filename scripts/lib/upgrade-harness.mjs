import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { exists } from './upgrade-wails.mjs';

const scripts = {
  'harness:doctor': 'node scripts/harness.mjs doctor',
  'test:harness':
    'tsx --test harness/core/*.test.ts harness/adapters/*.test.ts harness/tests/*.test.ts',
};
const typeExport =
  "export type { HarnessInitialData, HarnessConversationSummary, HarnessChatState, HarnessPanelProps, HarnessCapabilityCardProps, HarnessCapabilityDetailsProps, HarnessSettingsData } from './harness';";
const ownedPaths = [
  'harness',
  'lib/harness',
  'components/harness',
  'app/harness',
  'app/settings/harness',
  'app/@harness',
  'app/api/harness',
  'types/harness.ts',
  '.env.harness.example',
];

async function listFiles(root, relative = '') {
  const files = [];
  for (const entry of await readdir(path.join(root, relative), {
    withFileTypes: true,
  })) {
    const next = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(root, next)));
    else if (entry.isFile()) files.push(next);
    else throw new Error(`模板包含不支持的文件：${next}`);
  }
  return files;
}

export async function upgradeHarness(root, templateRoot) {
  const packagePath = path.join(root, 'package.json');
  const packageSource = await readFile(packagePath, 'utf8');
  const pkg = JSON.parse(packageSource);
  if (!pkg.dependencies?.next || !pkg.dependencies?.zod)
    throw new Error('请在已安装 NextPier 的项目根目录执行');
  const markerPath = path.join(root, 'harness', 'nextpier.json');
  if (await exists(markerPath)) {
    const marker = JSON.parse(await readFile(markerPath, 'utf8'));
    if (
      marker.generator !== 'nextpier-harness' ||
      marker.schemaVersion !== 1 ||
      !Array.isArray(marker.files) ||
      !marker.files.includes('app/harness/page.tsx')
    )
      throw new Error('harness/ 不是兼容的 NextPier 工程');
    for (const file of marker.files) {
      if (
        typeof file !== 'string' ||
        file.includes('\\') ||
        path.posix.isAbsolute(file) ||
        file.split('/').includes('..')
      )
        throw new Error('Harness 集成标记包含无效路径');
      if (!(await exists(path.join(root, file))))
        throw new Error(`集成文件缺失：${file}；请恢复后重试`);
    }
    return { created: false };
  }
  for (const relative of ownedPaths) {
    if (await exists(path.join(root, relative)))
      throw new Error(`${relative} 已存在，拒绝覆盖`);
  }
  for (const [name, value] of Object.entries(scripts)) {
    if (pkg.scripts?.[name] && pkg.scripts[name] !== value)
      throw new Error(`${name} 已存在，拒绝覆盖`);
  }
  const configPath = path.join(root, 'nextpier.config.json');
  const typePath = path.join(root, 'types', 'index.ts');
  if (!(await exists(configPath)) || !(await exists(typePath)))
    throw new Error('缺少 NextPier 配置或 types/index.ts');
  const configSource = await readFile(configPath, 'utf8');
  const config = JSON.parse(configSource);
  if (!config.features || typeof config.features.harness !== 'boolean')
    throw new Error('nextpier.config.json 缺少 features.harness 开关');
  const typeSource = await readFile(typePath, 'utf8');
  const files = await listFiles(templateRoot);
  if (!files.includes('app/harness/page.tsx'))
    throw new Error('Harness 模板不完整');
  const temporary = await mkdtemp(path.join(root, '.nextpier-harness-'));
  const installed = [];
  try {
    await cp(templateRoot, temporary, { recursive: true });
    for (const relative of ownedPaths) {
      const source = path.join(temporary, relative);
      if (!(await exists(source)))
        throw new Error(`Harness 模板缺少 ${relative}`);
      const target = path.join(root, relative);
      await mkdir(path.dirname(target), { recursive: true });
      installed.push(target);
      await cp(source, target, {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
    }
    const dependencies = {
      ...pkg.dependencies,
      openai:
        pkg.dependencies.openai ?? pkg.devDependencies?.openai ?? '^7.4.0',
      'eventsource-parser': pkg.dependencies['eventsource-parser'] ?? '^3.0.6',
    };
    const devDependencies = {
      ...pkg.devDependencies,
      tsx: pkg.devDependencies?.tsx ?? pkg.dependencies.tsx ?? '^4.20.6',
    };
    delete devDependencies.openai;
    await writeFile(
      packagePath,
      `${JSON.stringify({ ...pkg, scripts: { ...pkg.scripts, ...scripts }, dependencies, devDependencies }, null, 2)}\n`
    );
    await writeFile(
      configPath,
      `${JSON.stringify({ ...config, features: { ...config.features, harness: true } }, null, 2)}\n`
    );
    await writeFile(typePath, `${typeSource.trimEnd()}\n${typeExport}\n`);
    await writeFile(
      markerPath,
      `${JSON.stringify({ generator: 'nextpier-harness', schemaVersion: 1, files }, null, 2)}\n`
    );
    return { created: true };
  } catch (error) {
    await writeFile(packagePath, packageSource);
    await writeFile(configPath, configSource);
    await writeFile(typePath, typeSource);
    for (const target of installed.reverse())
      await rm(target, { recursive: true, force: true });
    throw error;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
