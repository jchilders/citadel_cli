import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import { renderResult } from '../renderResult';
import { stream, type StreamHandle } from '@citadel_cli/core';

describe('renderResult — streaming', () => {
  it('renders accumulated lines and a Stop button while streaming', () => {
    let handle: StreamHandle | undefined;
    const result = stream((h) => {
      handle = h;
    });
    result.start();
    handle!.push('alpha');
    handle!.push('beta');

    const { container } = render(<>{renderResult(result)}</>);

    expect(container.querySelector('.citadel-result-stream')?.textContent).toBe('alpha\nbeta');
    const stop = screen.getByRole('button', { name: /stop/i });

    // Clicking Stop cancels the stream.
    fireEvent.click(stop);
    expect(result.ended).toBe(true);
  });

  it('shows an ended marker and no Stop button once the stream closes', () => {
    let handle: StreamHandle | undefined;
    const result = stream((h) => {
      handle = h;
    });
    result.start();
    handle!.push('done');
    handle!.close();

    render(<>{renderResult(result)}</>);

    expect(screen.getByText(/stream ended/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /stop/i })).toBeNull();
  });
});
