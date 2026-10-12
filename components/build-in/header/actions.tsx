'use client';

import { usePathname } from 'next/navigation';
import { MessageCircleIcon } from '@animateicons/react/lucide/message-circle-icon';
import { SettingsIcon } from '@animateicons/react/lucide/settings-icon';
import { AnimatedIconButton } from '@/components/ui/animated-icon-button';

export function HeaderActions({ harnessEnabled }: { harnessEnabled: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {harnessEnabled ? (
        <AnimatedIconButton
          id="harness-launcher"
          icon={MessageCircleIcon}
          label="AI 对话"
          href="/harness"
          scroll={false}
          variant="ghost"
          aria-current={pathname === '/harness' ? 'page' : undefined}
        />
      ) : null}
      <AnimatedIconButton
        icon={SettingsIcon}
        label="全局设置"
        href="/settings/system"
        variant="ghost"
        aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
      />
    </>
  );
}
