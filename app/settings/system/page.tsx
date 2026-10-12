import { readConfig } from '@/lib/config';
import { AppearanceForm } from '@/components/settings/appearance-form';

export const metadata = { title: '常规设置' };

export default async function SystemSettingsPage() {
  const config = await readConfig();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-heading">常规</h1>
      <AppearanceForm initialConfig={config} />
    </div>
  );
}
