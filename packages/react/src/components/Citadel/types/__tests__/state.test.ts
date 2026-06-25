import { afterEach, describe, expect, it, vi } from 'vitest';
import { OutputItem } from '../state';
import { SegmentStack } from '@citadel/core';
import { WordSegment } from '@citadel/core';

describe('OutputItem', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates unique ids even when timestamps are identical', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const stack = new SegmentStack();
    stack.push(new WordSegment('test'));

    const first = new OutputItem(stack);
    const second = new OutputItem(stack);

    expect(first.timestamp).toBe(second.timestamp);
    expect(first.id).not.toBe(second.id);
  });
});
