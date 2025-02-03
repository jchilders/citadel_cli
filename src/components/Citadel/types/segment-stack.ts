import { CommandSegment, ArgumentSegment, NullSegment } from './command-trie';

/**
 * A stack implementation for managing command segments.
 * Uses NullSegment to avoid undefined returns.
 */
export class SegmentStack {
  private items: CommandSegment[] = [];
  private readonly nullSegment = new NullSegment();

  /**
   * Clears all segments from the stack
   */
  clear(): void {
    this.items = [];
  }

  /**
   * Pushes a new segment onto the stack
   */
  push(segment: CommandSegment): void {
    this.items.push(segment);
  }

  /**
   * Removes and returns the top segment from the stack
   * Returns NullSegment if stack is empty
   */
  pop(): CommandSegment {
    return this.items.pop() || this.nullSegment;
  }

  /**
   * Returns the top segment without removing it
   * Returns NullSegment if stack is empty
   */
  peek(): CommandSegment {
    return this.items[this.items.length - 1] || this.nullSegment;
  }

  /**
   * Returns the number of segments in the stack
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Returns true if the stack has no segments
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Returns true if any segment in the stack is an argument
   */
  get hasArguments(): boolean {
    return this.items.some(segment => segment.type === 'argument');
  }

  /**
   * Returns all argument segments in the stack
   */
  get getArguments(): ArgumentSegment[] {
    return this.items.filter((segment): segment is ArgumentSegment => 
      segment.type === 'argument'
    );
  }

  /**
   * Returns the command path as an array of segment names
   */
  path(): string[] {
    return this.items.map(segment => segment.name);
  }

  /**
   * Returns a copy of the internal segments array
   */
  toArray(): CommandSegment[] {
    return [...this.items];
  }
}
