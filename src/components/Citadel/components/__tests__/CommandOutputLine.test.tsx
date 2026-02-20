import { render, screen } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import { CommandOutputLine } from '../CommandOutputLine';
import { CommandStatus } from '../../types/command-results';

describe('CommandOutputLine', () => {
  const defaultProps = {
    command: 'user show',
    timestamp: '10:00:00 AM',
    status: CommandStatus.Pending
  };

  it('renders command and timestamp', () => {
    render(<CommandOutputLine {...defaultProps} />);
    
    expect(screen.getByText('user')).toBeDefined();
    expect(screen.getByText('show')).toBeDefined();
    expect(screen.getByText('10:00:00 AM')).toBeDefined();
  });

  it('shows spinner when status is pending', () => {
    render(<CommandOutputLine {...defaultProps} status={CommandStatus.Pending} />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner.className).includes('animate-spin');
  });

  it('shows success indicator when status is success', () => {
    render(<CommandOutputLine {...defaultProps} status={CommandStatus.Success} />);
    
    const successIndicator = screen.getByTestId('success-indicator');
    expect(successIndicator.className).includes('bg-green-500');
  });

  it('shows success indicator when status is success', () => {
    render(<CommandOutputLine {...defaultProps} status={CommandStatus.Failure} />);
    
    const successIndicator = screen.getByTestId('success-indicator');
    expect(successIndicator.className).includes('bg-red-500');
  });

  it('shows success indicator when status is success', () => {
    render(<CommandOutputLine {...defaultProps} status={CommandStatus.Timeout} />);
    
    const successIndicator = screen.getByTestId('success-indicator');
    expect(successIndicator.className).includes('bg-red-500');
  });

  it('applies custom typography props', () => {
    render(
      <CommandOutputLine
        {...defaultProps}
        status={CommandStatus.Success}
        fontFamily='"Fira Code", monospace'
        fontSize="16px"
      />
    );

    const line = screen.getByText('10:00:00 AM').parentElement;
    expect(line?.style.fontFamily).toContain('Fira Code');
    expect(line?.style.fontSize).toBe('16px');
  });
});
