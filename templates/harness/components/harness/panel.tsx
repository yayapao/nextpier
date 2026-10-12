'use client';

import { useState } from 'react';
import { ArrowLeftIcon } from '@animateicons/react/lucide/arrow-left-icon';
import { PlusIcon } from '@animateicons/react/lucide/plus-icon';
import { Trash2Icon } from '@animateicons/react/lucide/trash-2-icon';
import { HistoryIcon } from '@animateicons/react/lucide/history-icon';
import { WrenchIcon } from '@animateicons/react/lucide/wrench-icon';
import { SettingsIcon } from '@animateicons/react/lucide/settings-icon';
import { AnimatedIconButton } from '@/components/ui/animated-icon-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { HarnessPanelProps } from '@/types';
import { cn } from '@/lib/utils';
import { useHarness } from './use-harness';
import { HarnessComposer } from './composer';
import { HarnessMessages } from './messages';
import { HarnessConfirmation } from './confirmation';
import { HarnessInspect } from './inspect';

export function HarnessPanel({
  initialData,
  presentation = 'page',
}: HarnessPanelProps) {
  const harness = useHarness(initialData);
  const { data, state } = harness;
  const [inspect, setInspect] = useState<'logs' | 'capabilities' | null>(null);
  const [deleting, setDeleting] = useState(false);
  return (
    <section
      className={cn(
        'grid min-h-0 min-w-0 md:grid-cols-[200px_minmax(0,1fr)]',
        presentation === 'dialog' ? 'h-full' : 'h-[calc(100dvh-48px)] min-h-100'
      )}
    >
      <aside className="hidden min-h-0 overflow-y-auto border-r bg-sidebar md:block">
        <div className="flex h-12 items-center justify-between border-b px-3">
          <span className="text-sm font-medium">对话</span>
          <AnimatedIconButton
            icon={PlusIcon}
            label="新建对话"
            variant="ghost"
            disabled={state.busy}
            onClick={() => void harness.create()}
          />
        </div>
        <nav aria-label="对话列表" className="flex flex-col gap-1 p-2">
          {data.sessions.map((session) => (
            <Button
              key={session.id}
              variant={session.id === data.sessionId ? 'secondary' : 'ghost'}
              disabled={state.busy}
              aria-current={session.id === data.sessionId ? 'true' : undefined}
              onClick={() => void harness.select(session.id)}
              className="w-full justify-start"
            >
              <span className="truncate" title={session.title}>
                {session.title}
              </span>
            </Button>
          ))}
        </nav>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-col">
        <div
          className={cn(
            'flex min-h-12 flex-wrap items-center justify-between gap-2 border-b px-4 py-2',
            presentation === 'dialog' && 'pr-12'
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            {presentation === 'page' ? (
              <AnimatedIconButton
                icon={ArrowLeftIcon}
                label="返回工作台"
                href="/"
                variant="ghost"
              />
            ) : null}
            {presentation === 'dialog' ? (
              <h2 className="text-base font-semibold">AI 对话</h2>
            ) : (
              <h1 className="text-base font-semibold">AI 对话</h1>
            )}
            <Badge variant={data.mode === 'demo' ? 'secondary' : 'info'}>
              {data.mode === 'demo' ? '演示' : '模型'}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <AnimatedIconButton
              icon={PlusIcon}
              label="新建对话"
              className="md:hidden"
              disabled={state.busy}
              onClick={() => void harness.create()}
            />
            <AnimatedIconButton
              icon={WrenchIcon}
              label="已接入能力"
              variant="ghost"
              onClick={() => setInspect('capabilities')}
            />
            <AnimatedIconButton
              icon={HistoryIcon}
              label="运行记录"
              variant="ghost"
              onClick={() => setInspect('logs')}
            />
            <AnimatedIconButton
              icon={SettingsIcon}
              label="Harness 管理"
              variant="ghost"
              disabled={state.busy}
              href="/settings/harness"
            />
            <AnimatedIconButton
              icon={Trash2Icon}
              label="删除对话"
              variant="ghost"
              disabled={state.busy || !data.sessionId}
              onClick={() => setDeleting(true)}
            />
          </div>
        </div>
        {data.sessions.length > 0 && (
          <div className="border-b p-3 md:hidden">
            <Select
              value={data.sessionId || undefined}
              onValueChange={(id) => void harness.select(id)}
              disabled={state.busy}
            >
              <SelectTrigger aria-label="选择对话" className="w-full">
                <SelectValue placeholder="选择对话" />
              </SelectTrigger>
              <SelectContent>
                {data.sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <HarnessMessages messages={data.messages} busy={state.busy} />
        <div
          role="status"
          className="flex h-8 min-w-0 items-center px-4 text-xs text-muted-foreground"
        >
          <span className="truncate">
            {state.progress || (state.busy ? '处理中' : '')}
          </span>
        </div>
        {state.error && (
          <p
            role="alert"
            className="break-words px-4 pb-2 text-sm text-destructive"
          >
            {state.error}
          </p>
        )}
        {data.mode === 'demo' && data.messages.length === 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            <Button
              size="sm"
              disabled={state.busy}
              onClick={() => void harness.send('当前时间')}
            >
              当前时间
            </Button>
            <Button
              size="sm"
              disabled={state.busy}
              onClick={() => void harness.send('保存便签：接入业务数据')}
            >
              保存便签
            </Button>
          </div>
        )}
        <HarnessComposer
          busy={state.busy}
          onSend={harness.send}
          onStop={harness.stop}
        />
      </div>
      {state.confirmation && (
        <HarnessConfirmation
          key={state.confirmation.id}
          confirmation={state.confirmation}
          label={
            data.capabilities.tools.find(
              (tool) => tool.name === state.confirmation?.tool
            )?.description ?? state.confirmation.question
          }
          onAnswer={harness.answer}
        />
      )}
      <HarnessInspect
        view={inspect}
        data={data}
        onClose={() => setInspect(null)}
      />
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>删除对话</DialogTitle>
            <DialogDescription>删除当前对话及运行记录？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeleting(false)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleting(false);
                void harness.remove();
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
