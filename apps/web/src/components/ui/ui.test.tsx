import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Modal } from './Modal';
import { TextField } from './TextField';

describe('button', () => {
  it('ist standardmäßig kein absende-button', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button', { name: 'Test' })).toHaveAttribute('type', 'button');
  });

  it('meldet klicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Klick</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Klick' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('textfeld', () => {
  it('verbindet beschriftung und eingabefeld', () => {
    render(<TextField label="Name von Team 1" defaultValue="Team A" />);
    expect(screen.getByLabelText('Name von Team 1')).toHaveValue('Team A');
  });
});

describe('modal', () => {
  it('rendert den inhalt erst im geöffneten zustand', () => {
    const { rerender } = render(
      <Modal open={false} onClose={vi.fn()} labelledBy="titel">
        <h2 id="titel">Inhalt</h2>
      </Modal>,
    );
    expect(screen.queryByText('Inhalt')).not.toBeInTheDocument();

    rerender(
      <Modal open onClose={vi.fn()} labelledBy="titel">
        <h2 id="titel">Inhalt</h2>
      </Modal>,
    );
    expect(screen.getByText('Inhalt')).toBeInTheDocument();
  });

  it('meldet das schließen des dialogs', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} labelledBy="titel">
        <h2 id="titel">Inhalt</h2>
      </Modal>,
    );

    const dialog = document.querySelector('dialog');
    dialog?.close();

    expect(onClose).toHaveBeenCalled();
  });
});
