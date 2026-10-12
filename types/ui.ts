import type { ComponentProps, ComponentType, RefAttributes } from 'react';
import type { IconHandle } from '@animateicons/react';
import type { Button } from '@/components/ui/button';

export type AnimatedIconButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'asChild'
> & {
  icon: ComponentType<
    {
      size?: number;
      isAnimated?: boolean;
      'aria-hidden'?: boolean;
    } & RefAttributes<IconHandle>
  >;
  label: string;
  iconSize?: number;
  href?: string;
  scroll?: boolean;
};

export type AnimatedNumberProps = {
  value: number;
  precision?: number;
  format?: (value: number) => string;
  className?: string;
};

export type TextureButtonProps = ComponentProps<'button'> & {
  variant?: 'outline' | 'primary';
  size?: 'sm' | 'default';
};
