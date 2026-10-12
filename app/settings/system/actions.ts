'use server';

import { revalidatePath } from 'next/cache';
import { updateConfig } from '@/lib/config';
import { appearanceSchema } from '@/lib/settings/schema';

export async function saveAppearance(input: unknown) {
  const parsed = appearanceSchema.safeParse(input);
  if (!parsed.success) return { config: null, error: '请选择有效的主题' };
  try {
    const config = await updateConfig(parsed.data);
    revalidatePath('/', 'layout');
    return { config, error: '' };
  } catch {
    return { config: null, error: '主题保存失败' };
  }
}
