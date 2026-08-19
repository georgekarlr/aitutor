import { useMemo } from 'react';
import { formatMathHtml } from '@/lib/mathRenderer';

interface MathTextProps {
  text: string;
  className?: string;
  as?: 'span' | 'div' | 'p' | 'h3' | 'h4';
}

export function MathText({ text, className = '', as: Component = 'span' }: MathTextProps) {
  const html = useMemo(() => formatMathHtml(text), [text]);

  return (
    <Component
      className={`math-rendered-text ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default MathText;
