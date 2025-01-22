import { render, screen } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { CommandOutput } from '../CommandOutput';
import { CitadelConfigProvider } from '../../config/CitadelConfigContext';
import { defaultConfig } from '../../config/defaults';
import { OutputItem } from '../../types/state';
import { TextCommandResult } from '../../types/command-results';

describe('CommandOutput', () => {
  const mockOutputRef = { current: document.createElement('div') };
  
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(performance.now());
      return 0;
    });
  });

  const createOutputItem = (command: string[] = ['test']) => {
    const item = new OutputItem(command);
    const result = new TextCommandResult('Test output');
    result.markSuccess();
    item.result = result;
    return item;
  };

  const defaultProps = {
    output: [createOutputItem()],
    outputRef: mockOutputRef,
  };

  const renderWithConfig = (props = defaultProps, config = defaultConfig) => {
    return render(
      <CitadelConfigProvider config={config}>
        <CommandOutput {...props} />
      </CitadelConfigProvider>
    );
  };

  it('renders with default font size', () => {
    renderWithConfig();
    const preElement = screen.getByText('Test output').parentElement;
    expect(preElement?.className).includes('0.875rem');
  });

  it('uses custom font size from config', () => {
    const customConfig = {
      ...defaultConfig,
      outputFontSize: 'text-xs'
    };
    renderWithConfig(defaultProps, customConfig);
    const preElement = screen.getByText('Test output').parentElement;
    expect(preElement?.className).includes('text-xs');
  });

  it('renders multiple output items', () => {
    const output = [
      createOutputItem(['test', '1']),
      createOutputItem(['test', '2'])
    ];
    output[0].result = new TextCommandResult('First output');
    output[1].result = new TextCommandResult('Second output');

    renderWithConfig({ ...defaultProps, output });
    
    expect(screen.getByText('First output')).toBeDefined();
    expect(screen.getByText('Second output')).toBeDefined();
  });

  it('scrolls to bottom when output changes', () => {
    const mockDiv = document.createElement('div');
    Object.defineProperty(mockDiv, 'scrollTop', {
      set: vi.fn(),
    });
    Object.defineProperty(mockDiv, 'scrollHeight', {
      get: () => 1000,
    });
    const mockRef = { current: mockDiv };

    renderWithConfig({ ...defaultProps, outputRef: mockRef });
    
    // Verify that requestAnimationFrame was called
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });
});
