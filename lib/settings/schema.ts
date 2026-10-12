import { z } from 'zod';

export const appearanceSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system'], { error: '请选择主题' }),
  })
  .strict();
