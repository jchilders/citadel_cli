import { useState, useCallback } from 'react';
import { SegmentStack } from '../types/segment-stack';
import { ArgumentSegment, CommandSegment } from '../types/command-trie';

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

export function useSegmentStack(): SegmentStackActions {
  const [stack] = useState(() => new SegmentStack());

  const push = useCallback((segment: CommandSegment) => {
    stack.push(segment);
  }, [stack]);

  const pop = useCallback(() => {
    return stack.pop();
  }, [stack]);

  const peek = useCallback(() => {
    return stack.peek();
  }, [stack]);

  const clear = useCallback(() => {
    stack.clear();
  }, [stack]);

  const hasArguments = useCallback(() => {
    return stack.hasArguments;
  }, [stack]);

  const getArguments = useCallback(() => {
    return stack.arguments;
  }, [stack]);

  const path = useCallback(() => {
    return stack.path();
  }, [stack]);

  const segments = useCallback(() => {
    return stack.toArray();
  }, [stack]);

  const isEmpty = useCallback(() => {
    return stack.isEmpty();
  }, [stack]);

  const size = useCallback(() => {
    return stack.size();
  }, [stack]);

  return {
    push,
    pop,
    peek,
    clear,
    hasArguments,
    getArguments,
    path,
    segments,
    isEmpty,
    size
  };
}
