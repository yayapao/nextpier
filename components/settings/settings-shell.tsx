'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings2, Bot } from 'lucide-react';
import { ArrowLeftIcon } from '@animateicons/react/lucide/arrow-left-icon';
import { AnimatedIconButton } from '@/components/ui/animated-icon-button';
import { cn } from '@/lib/utils';
import nextpier from '@/nextpier.config.json';

const groups = [
  {
    label: '系统',
    items: [{ href: '/settings/system', label: '常规', icon: Settings2 }],
  },
  {
    label: 'Browser Harness',
    items: [{ href: '/settings/harness', label: 'Harness 管理', icon: Bot }],
  },
];

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-[calc(100dvh-48px)] md:grid md:grid-cols-[208px_minmax(0,1fr)]">
      <aside
        className="border-b bg-sidebar p-3 md:border-r md:border-b-0"
        aria-label="设置分类"
      >
        <div className="mb-3 flex h-8 items-center gap-2">
          <AnimatedIconButton
            icon={ArrowLeftIcon}
            label="返回工作台"
            href="/"
            variant="ghost"
          />
          <span className="text-sm font-semibold">设置</span>
        </div>
        <nav
          aria-label="设置导航"
          className="flex flex-wrap gap-4 md:flex-col md:gap-5"
        >
          {groups
            .filter(
              (group) => nextpier.features.harness || group.label === '系统'
            )
            .map((group) => (
              <div key={group.label} className="min-w-0">
                <p className="mb-1 px-2 text-xs text-muted-foreground">
                  {group.label}
                </p>
                {group.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={pathname === href ? 'page' : undefined}
                    className={cn(
                      'flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      pathname === href &&
                        'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {label}
                  </Link>
                ))}
              </div>
            ))}
        </nav>
      </aside>
      <div className="min-w-0 p-4 md:p-6">
        <div className="mx-auto w-full max-w-300">{children}</div>
      </div>
    </div>
  );
}
