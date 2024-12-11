import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import { Spinner } from '../Spinner';

describe('Spinner', () => {
  it('renders with correct styling', () => {
    render(<Spinner />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner.className).includes('animate-spin');
    expect(spinner.className).includes('border-t-gray-600');
  });
});
