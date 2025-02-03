import { CommandSegment, ArgumentSegment } from './command-trie';

export interface SegmentStackActions {
  push: (segment: CommandSegment) => void;
  pop: () => CommandSegment;
  peek: () => CommandSegment;
  clear: () => void;
  hasArguments: () => boolean;
  getArguments: () => ArgumentSegment[];
  path: () => string[];
  segments: () => CommandSegment[];
  isEmpty: () => boolean;
  size: () => number;
}
