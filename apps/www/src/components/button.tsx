import { Link, type LinkProps } from '@tanstack/react-router';
import { buttonVariants, type ButtonProps } from 'fumadocs-ui/components/ui/button';
import { cn } from '@/lib/cn';

type ButtonLinkProps = {
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
  children: React.ReactNode;
  to: LinkProps['to'];
};

export function Button({
  variant = 'primary',
  size,
  className,
  children,
  to,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children}
    </Link>
  );
}
