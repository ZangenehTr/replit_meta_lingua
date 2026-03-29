import { HTMLAttributes } from 'react';

interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function VisuallyHidden({ children, ...props }: VisuallyHiddenProps) {
  return (
    <span
      {...props}
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 clip-rect-0"
      style={{ clip: 'rect(0,0,0,0)', clipPath: 'inset(50%)' }}
    >
      {children}
    </span>
  );
}
