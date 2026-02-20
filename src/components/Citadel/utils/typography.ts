import type { CSSProperties } from 'react';

const TAILWIND_TEXT_SIZE_CLASS_REGEX = /^text-(xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\])$/;

interface TypographySettings {
  className?: string;
  style?: CSSProperties;
}

const normalizeValue = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const resolveTextSize = (size?: string): TypographySettings => {
  const normalizedSize = normalizeValue(size);
  if (!normalizedSize) {
    return {};
  }

  if (TAILWIND_TEXT_SIZE_CLASS_REGEX.test(normalizedSize)) {
    return { className: normalizedSize };
  }

  return { style: { fontSize: normalizedSize } };
};

export const resolveTypography = (fontFamily?: string, fontSize?: string): TypographySettings => {
  const normalizedFamily = normalizeValue(fontFamily);
  const resolvedSize = resolveTextSize(fontSize);

  const style: CSSProperties = {
    ...resolvedSize.style
  };

  if (normalizedFamily) {
    style.fontFamily = normalizedFamily;
  }

  return {
    className: resolvedSize.className,
    style: Object.keys(style).length > 0 ? style : undefined
  };
};
