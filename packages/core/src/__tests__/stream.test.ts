import { describe, expect, it, vi } from 'vitest';
import { stream } from '../command-dsl';
import { CommandStatus, StreamCommandResult, type StreamHandle } from '../results';

/**
 * Drive a stream deterministically: the producer hands its control back to the
 * test so pushes/close happen on demand (no real timers).
 */
function makeStream(options?: { maxLines?: number }) {
  let handle!: StreamHandle;
  const cleanup = vi.fn();
  const result = stream((h) => {
    handle = h;
    return cleanup;
  }, options);
  return { result, getHandle: () => handle, cleanup };
}

describe('StreamCommandResult', () => {
  it('stream() returns a StreamCommandResult', () => {
    expect(makeStream().result).toBeInstanceOf(StreamCommandResult);
  });

  it('starts Pending and becomes Streaming once started', () => {
    const { result } = makeStream();
    expect(result.status).toBe(CommandStatus.Pending);
    result.start();
    expect(result.status).toBe(CommandStatus.Streaming);
  });

  it('start() is idempotent — producer runs once', () => {
    const producer = vi.fn();
    const result = stream(producer);
    result.start();
    result.start();
    expect(producer).toHaveBeenCalledTimes(1);
  });

  it('push appends lines, splitting on newlines, and notifies subscribers', () => {
    const { result, getHandle } = makeStream();
    const listener = vi.fn();
    result.subscribe(listener);
    result.start();

    getHandle().push('one');
    getHandle().push('two\nthree');

    expect(result.lines).toEqual(['one', 'two', 'three']);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('enforces maxLines, dropping oldest and counting drops', () => {
    const { result, getHandle } = makeStream({ maxLines: 2 });
    result.start();
    getHandle().push('a');
    getHandle().push('b');
    getHandle().push('c');

    expect(result.lines).toEqual(['b', 'c']);
    expect(result.droppedCount).toBe(1);
  });

  it('close() ends as Success and runs cleanup once', () => {
    const { result, getHandle, cleanup } = makeStream();
    result.start();
    getHandle().close();

    expect(result.status).toBe(CommandStatus.Success);
    expect(result.ended).toBe(true);
    expect(getHandle().closed).toBe(true);
    expect(cleanup).toHaveBeenCalledTimes(1);

    // No further output after ending.
    getHandle().push('late');
    expect(result.lines).toEqual([]);
  });

  it('fail() appends the message and ends as Failure', () => {
    const { result, getHandle } = makeStream();
    result.start();
    getHandle().fail('boom');

    expect(result.lines).toEqual(['boom']);
    expect(result.status).toBe(CommandStatus.Failure);
    expect(result.ended).toBe(true);
  });

  it('cancel() ends as Success and runs cleanup', () => {
    const { result, cleanup } = makeStream();
    result.start();
    result.cancel();

    expect(result.status).toBe(CommandStatus.Success);
    expect(result.ended).toBe(true);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe stops further notifications', () => {
    const { result, getHandle } = makeStream();
    const listener = vi.fn();
    const unsubscribe = result.subscribe(listener);
    result.start();

    getHandle().push('a');
    unsubscribe();
    getHandle().push('b');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reports a producer that throws synchronously as a failure', () => {
    const result = stream(() => {
      throw new Error('producer exploded');
    });
    result.start();
    expect(result.status).toBe(CommandStatus.Failure);
    expect(result.lines).toEqual(['producer exploded']);
  });
});
