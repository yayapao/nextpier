'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useForm } from 'react-hook-form';
import { RadioGroup } from 'radix-ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sun, Moon, Monitor } from 'lucide-react';
import { UndoIcon } from '@animateicons/react/lucide/undo-icon';
import { SaveIcon } from '@animateicons/react/lucide/save-icon';
import { toast } from 'sonner';
import { saveAppearance } from '@/app/settings/system/actions';
import { appearanceSchema } from '@/lib/settings/schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import halo from '@/components/ui/halo-tabs.module.css';
import { AnimatedIconButton } from '@/components/ui/animated-icon-button';
import { TextureButton } from '@/components/ui/texture-button';
import type { UserConfig } from '@/types';

const themes = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '系统', icon: Monitor },
];

export function AppearanceForm({
  initialConfig,
}: {
  initialConfig: UserConfig;
}) {
  const { setTheme } = useTheme();
  const form = useForm<UserConfig>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: { theme: initialConfig.theme },
  });
  useEffect(
    () => form.reset({ theme: initialConfig.theme }),
    [form, initialConfig.theme]
  );
  const busy = form.formState.isSubmitting;

  async function submit(values: UserConfig) {
    form.clearErrors('root');
    try {
      const result = await saveAppearance(values);
      if (!result.config) {
        form.setError('root', { message: result.error });
        return;
      }
      setTheme(result.config.theme);
      form.reset({ theme: result.config.theme });
      toast.success('主题已保存');
    } catch {
      form.setError('root', { message: '主题保存失败' });
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(submit)}
        className="flex flex-col gap-4"
      >
        <section
          aria-labelledby="appearance-heading"
          className="flex flex-col gap-4"
        >
          <h2 id="appearance-heading" className="text-sm font-medium">
            外观
          </h2>
          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>主题</FormLabel>
                <FormControl>
                  <RadioGroup.Root
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={busy}
                    orientation="horizontal"
                    aria-label="主题"
                    className={halo.list}
                  >
                    {themes.map(({ value, label, icon: Icon }) => (
                      <RadioGroup.Item
                        key={value}
                        value={value}
                        className={halo.trigger}
                      >
                        <RadioGroup.Indicator asChild>
                          <span className={halo.indicator} />
                        </RadioGroup.Indicator>
                        <span className="relative flex items-center gap-1.5">
                          <Icon aria-hidden />
                          {label}
                        </span>
                      </RadioGroup.Item>
                    ))}
                  </RadioGroup.Root>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>
        {form.formState.errors.root ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 border-t pt-4">
          <AnimatedIconButton
            icon={UndoIcon}
            label="恢复修改"
            disabled={busy || !form.formState.isDirty}
            onClick={() => form.reset()}
          />
          <TextureButton
            type="submit"
            variant="primary"
            disabled={busy || !form.formState.isDirty}
          >
            <SaveIcon isAnimated={false} aria-hidden />
            {busy ? '保存中' : '保存配置'}
          </TextureButton>
        </div>
      </form>
    </Form>
  );
}
