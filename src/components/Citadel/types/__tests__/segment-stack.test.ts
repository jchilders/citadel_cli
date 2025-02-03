import { SegmentStack } from '../segment-stack';
import { WordSegment, ArgumentSegment, NullSegment } from '../command-trie';

describe('SegmentStack', () => {
  let stack: SegmentStack;

  beforeEach(() => {
    stack = new SegmentStack();
  });

  describe('basic stack operations', () => {
    it('should start empty', () => {
      expect(stack.isEmpty()).toBe(true);
      expect(stack.size()).toBe(0);
    });

    it('should push and pop segments correctly', () => {
      const segment = new WordSegment('test');
      stack.push(segment);
      
      expect(stack.isEmpty()).toBe(false);
      expect(stack.size()).toBe(1);
      
      const popped = stack.pop();
      expect(popped).toBe(segment);
      expect(stack.isEmpty()).toBe(true);
    });

    it('should return NullSegment when popping empty stack', () => {
      const popped = stack.pop();
      expect(popped).toBeInstanceOf(NullSegment);
      expect(popped.type).toBe('null');
    });

    it('should peek at top segment without removing it', () => {
      const segment = new WordSegment('test');
      stack.push(segment);
      
      const peeked = stack.peek();
      expect(peeked).toBe(segment);
      expect(stack.size()).toBe(1);
    });

    it('should return NullSegment when peeking empty stack', () => {
      const peeked = stack.peek();
      expect(peeked).toBeInstanceOf(NullSegment);
      expect(peeked.type).toBe('null');
    });

    it('should clear all segments', () => {
      stack.push(new WordSegment('one'));
      stack.push(new WordSegment('two'));
      expect(stack.size()).toBe(2);
      
      stack.clear();
      expect(stack.isEmpty()).toBe(true);
      expect(stack.size()).toBe(0);
    });
  });

  describe('argument handling', () => {
    it('should detect when stack has arguments', () => {
      stack.push(new WordSegment('command'));
      expect(stack.hasArguments).toBe(false);
      
      stack.push(new ArgumentSegment('arg1'));
      expect(stack.hasArguments).toBe(true);
    });

    it('should return all argument segments', () => {
      const arg1 = new ArgumentSegment('arg1');
      const arg2 = new ArgumentSegment('arg2');
      
      stack.push(new WordSegment('command'));
      stack.push(arg1);
      stack.push(new WordSegment('subcommand'));
      stack.push(arg2);
      
      const args = stack.getArguments;
      expect(args).toHaveLength(2);
      expect(args).toContain(arg1);
      expect(args).toContain(arg2);
    });
  });

  describe('path and array operations', () => {
    it('should return correct path of segment names', () => {
      stack.push(new WordSegment('git'));
      stack.push(new WordSegment('commit'));
      stack.push(new ArgumentSegment('message'));
      
      expect(stack.path()).toEqual(['git', 'commit', 'message']);
    });

    it('should return copy of internal array', () => {
      const segments = [
        new WordSegment('git'),
        new WordSegment('commit')
      ];
      
      segments.forEach(seg => stack.push(seg));
      const array = stack.toArray();
      
      expect(array).toEqual(segments);
      expect(array).not.toBe(segments); // Should be a new array
    });
  });
});
