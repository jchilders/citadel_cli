import { CommandSegment, ArgumentSegment, NullSegment } from './command-registry';

interface StackObserver {
  update: () => void;
}

/**
 * A stack used to store command segments as they are (or were) entered by a user.
 */
export class SegmentStack {
  private segments: CommandSegment[] = [];
  readonly nullSegment = new NullSegment();
  private observers: StackObserver[] = [];

  subscribe(observer: StackObserver) {
    this.observers.push(observer);
  }

  unsubscribe(observer: StackObserver) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  private notifyObservers() {
    this.observers.forEach(observer => observer.update());
  }

  /**
   * Clears all segments from the stack
   */
  clear(): void {
    this.segments = [];
    this.notifyObservers();
  }

  /**
   * Pushes a new segment onto the stack
   */
  push(segment: CommandSegment): void {
    this.segments.push(segment);
    this.notifyObservers();
  }

  /**
   * Pushes an array of segments onto the stack
   */
  pushAll(segments: CommandSegment[]): void {
    segments.forEach(segment => this.push(segment));
  }

  /**
   * Removes and returns the top segment from the stack
   * Returns NullSegment if stack is empty
   */
  pop(): CommandSegment {
    const poppedSegment = this.segments.pop() || this.nullSegment;
    this.notifyObservers();
    return poppedSegment;
  }

  /**
   * Returns the top segment without removing it
   * Returns NullSegment if stack is empty
   */
  peek(): CommandSegment {
    return this.segments[this.segments.length - 1] || this.nullSegment;
  }

  /**
   * Returns the number of segments in the stack
   */
  size(): number {
    return this.segments.length;
  }

  /**
   * Returns true if the stack has no segments
   */
  isEmpty(): boolean {
    return this.segments.length === 0;
  }

  /**
   * Returns true if any segment in the stack is an argument
   */
  get hasArguments(): boolean {
    return this.segments.some(segment => segment.type === 'argument');
  }

  /**
   * Returns all argument segments in the stack
   */
  get arguments(): ArgumentSegment[] {
    return this.segments.filter((segment): segment is ArgumentSegment => 
      segment.type === 'argument'
    );
  }

  /**
   * Returns the command path as an array of segment names
   */
  path(): string[] {
    return this.segments.map(segment => segment.name);
  }

  /**
   * Returns a copy of the internal segments array
   */
  toArray(): CommandSegment[] {
    return [...this.segments];
  }
}
