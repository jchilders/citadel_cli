import { CommandSegment } from './command-registry';

export const getCommandPrefixLengths = (segments: CommandSegment[]) => {
  const map = new Map<string, number>();
  for (const segment of segments) {
    const prefixLength = segments.reduce((length, other) => {
      if (other === segment) return length;
      let commonPrefix = 0;
      while (
        commonPrefix < segment.name.length &&
        commonPrefix < other.name.length &&
        segment.name[commonPrefix].toLowerCase() === other.name[commonPrefix].toLowerCase()
      ) {
        commonPrefix++;
      }
      return Math.max(length, commonPrefix + 1);
    }, 1);
    map.set(segment.name, prefixLength);
  }
  return map;
};

export const formatCommandNameWithPrefix = (
  name: string,
  prefixLengths: Map<string, number>
) => {
  const prefixLength = prefixLengths.get(name) ?? 1;
  const safePrefixLength = Math.min(Math.max(prefixLength, 1), name.length);
  return `[${name.slice(0, safePrefixLength)}]${name.slice(safePrefixLength)}`;
};
