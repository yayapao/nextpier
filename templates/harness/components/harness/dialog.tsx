'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { XIcon } from '@animateicons/react/lucide/x-icon';
import { AnimatedIconButton } from '@/components/ui/animated-icon-button';
import type { HarnessInitialData } from '@/types';
import { HarnessPanel } from './panel';

export function HarnessDialog({
  initialData,
}: {
  initialData: HarnessInitialData;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setOpen(false);
          router.back();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="h-[min(800px,calc(100dvh-32px))] min-h-0 gap-0 overflow-hidden rounded-lg p-0 sm:max-w-275"
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById('harness-launcher')?.focus();
        }}
      >
        <DialogTitle className="sr-only">AI 对话</DialogTitle>
        {open ? (
          <HarnessPanel initialData={initialData} presentation="dialog" />
        ) : null}
        <DialogClose asChild>
          <AnimatedIconButton
            icon={XIcon}
            label="关闭对话"
            variant="ghost"
            className="absolute top-2 right-2"
          />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
