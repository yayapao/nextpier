import { SettingsShell } from '@/components/settings/settings-shell';

export const metadata = { title: '设置' };

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsShell>{children}</SettingsShell>;
}
