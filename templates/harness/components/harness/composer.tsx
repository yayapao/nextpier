'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SendIcon } from '@animateicons/react/lucide/send-icon';
import { CircleStopIcon } from '@animateicons/react/lucide/circle-stop-icon';
import { AnimatedIconButton } from '@/components/ui/animated-icon-button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  message: z.string().trim().min(1, '请输入消息').max(6000, '消息最多 6000 字'),
});

export function HarnessComposer({
  busy,
  onSend,
  onStop,
}: {
  busy: boolean;
  onSend: (message: string) => Promise<void>;
  onStop: () => Promise<void>;
}) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  });
  return (
    <Form {...form}>
      <form
        className="flex items-end gap-2 border-t p-4"
        onSubmit={form.handleSubmit(async ({ message }) => {
          form.reset();
          try {
            await onSend(message);
          } catch {
            form.setError('root', { message: '发送失败' });
          }
        })}
      >
        <div className="min-w-0 flex-1">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    aria-label="消息"
                    placeholder="输入消息"
                    rows={3}
                    disabled={busy}
                    className="max-h-40 min-h-20 resize-y"
                    onKeyDown={(event) => {
                      if (
                        event.key !== 'Enter' ||
                        event.shiftKey ||
                        event.nativeEvent.isComposing ||
                        event.keyCode === 229
                      )
                        return;
                      event.preventDefault();
                      if (!busy && !form.formState.isSubmitting)
                        event.currentTarget.form?.requestSubmit();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.errors.root && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
        </div>
        {busy ? (
          <AnimatedIconButton
            icon={CircleStopIcon}
            label="停止"
            onClick={() => void onStop()}
          />
        ) : (
          <AnimatedIconButton
            icon={SendIcon}
            label="发送"
            type="submit"
            variant="default"
            disabled={form.formState.isSubmitting}
          />
        )}
      </form>
    </Form>
  );
}
