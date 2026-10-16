# NextPier

**A Next.js workbench starter for agents.**

Give an agent one prompt to build the product, one command to add [app-harness](https://github.com/yayapao/app-harness), and one more command when the product needs a Wails desktop shell.

[Agent prompt](docs/ai-agent.md) · [app-harness](https://github.com/yayapao/app-harness) · [Development](docs/development.md)

## Start in 30 seconds

```bash
NEXTPIER_TEMPLATE_DIR="$(mktemp -d)"
git clone --depth 1 --branch main https://github.com/yayapao/nextpier.git "$NEXTPIER_TEMPLATE_DIR"
node "$NEXTPIER_TEMPLATE_DIR/scripts/init.mjs" --project ./my-app --name my-app
cd my-app
npm install
npm run dev
```

Open [localhost:3900](http://localhost:3900). To initialize a repository you already cloned, use `--project .`; `.git`, `LICENSE`, README, and user files are preserved. See the [development guide](docs/development.md) for the full flow.

## Give it to ChatGPT / Codex

Replace the brackets and send this prompt:

```text
Use https://github.com/yayapao/nextpier to create [project name] in [target directory].

Users and goal: [who uses it and what they need]
Workflows: [list the steps and acceptance criteria]
Data: [API, database, or single-user local persistence]
Capabilities: [Web / Web+AI / Wails / Wails+AI]
npm package name: [lowercase English; digits and hyphens allowed]

Read the target first, then follow its AGENTS.md, docs/README.md, and the installed Next.js documentation.
If the target is empty or only has .git, LICENSE, or README, fetch the template outside it and run scripts/init.mjs as described in docs/development.md; extend existing NextPier or business projects in place.
Keep the target Git history, remote, LICENSE, and user files; read and merge conflicts before writing.
Build a real business flow with data, validation, loading, empty, and error states.
For AI, run npm run upgrade:harness and use GitHub app-harness for business tools, agents, workflows, chat, and the management page.
For desktop, run npm run upgrade:wails -- --name "[display name]" --id [app ID].
Run typecheck, lint, and test:cli; run test:harness after adding app-harness.
Do not start dev, build, or package by default. Report completed capabilities, checks, and unverified items.
```

See the [agent guide](docs/ai-agent.md) for reusable prompts and business examples.

## What an agent can do

- Read project rules and Next.js docs, then work with the existing stack.
- Initialize or extend a project while preserving its repository and business changes.
- Build real flows with Server Components, Server Actions, Zod, and the project data source.
- Use app-harness to review business tools and create an agent, executable workflow, global chat, and management page.
- Enforce authorization and confirmation for writes and deletes, while reporting static, runtime, browser, and model validation separately.

## Add app-harness

Run this in a NextPier project:

```bash
npm run upgrade:harness
npm run harness:doctor
```

The command fetches the runtime, UI, installer, and agent skill from [GitHub app-harness](https://github.com/yayapao/app-harness) and installs them into the project. Pin a version or use a local checkout when needed:

```bash
npm run upgrade:harness -- --ref <tag-or-commit>
npm run upgrade:harness -- --source /path/to/app-harness --skip-install
```

After setup, the toolbar opens chat over the current page, `/harness` is the full chat view, and `/settings/harness` manages model settings, agents, tools, and permissions. Keep model credentials on the server and confirm write actions. See the [app-harness guide](docs/harness.md).

## Integrate an existing project

Give the agent the [integration prompt](docs/harness-integration.md), or prepare a source kit first:

```bash
npm run harness:prepare -- --project /path/to/existing-project
```

The command prepares app-harness source, a discovery report, and integration instructions. The agent adapts the result to the target stack; the target does not need to become a NextPier project first.

## Add desktop

```bash
npm run upgrade:wails -- --name MyApp --id com.example.myapp
npm run desktop:doctor
npm run desktop:dev
```

Wails shares the Web pages, Server Actions, SSE, and app-harness runtime. See the [desktop guide](docs/desktop.md) for environment and packaging commands.

## Opinionated defaults

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4.
- AnimateIcons, Cult UI, shadcn/Radix, compact controls, and semantic themes.
- Server Components for initial reads and Server Actions for business writes.
- app-harness with replaceable models, storage, tools, agents, and workflows.

## Read on

[Agent prompts](docs/ai-agent.md) · [Development](docs/development.md) · [Components and styles](docs/design-system.md) · [app-harness](docs/harness.md) · [Desktop](docs/desktop.md) · [GitHub publishing](docs/github.md)

MIT licensed; Cult UI components retain their source attribution and license.
