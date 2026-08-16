import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('app', () => {
  it('rendert die anwendung', () => {
    render(<App />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
