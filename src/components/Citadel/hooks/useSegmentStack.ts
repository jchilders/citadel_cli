import { useState, useCallback } from 'react';
import { SegmentStack } from '../types/segment-stack';
import { CommandSegment } from '../types/command-trie';
import { SegmentStackActions } from '../types/segment-actions';

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
    return stack.getArguments;
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
