import type { CSSProperties } from 'react';

interface TypographySettings {
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
    style: Object.keys(style).length > 0 ? style : undefined
  };
};
