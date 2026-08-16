import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RulesSetup } from './RulesSetup';
import { TimerSetup, timerSliderValue } from './TimerSetup';
import { VetoSetup } from './VetoSetup';

describe('bedenkzeit einstellen', () => {
  it('zeigt ohne zeitbegrenzung die erste position', () => {
    render(<TimerSetup value={null} onChange={vi.fn()} />);

    expect(screen.getByLabelText('Bedenkzeit je Frage')).toHaveValue('0');
    expect(screen.getByText('Ohne Zeitbegrenzung')).toBeInTheDocument();
  });

  it('beschriftet die gewählte stufe lesbar', () => {
    const { rerender } = render(<TimerSetup value={45} onChange={vi.fn()} />);
    expect(screen.getByText('45 Sekunden')).toBeInTheDocument();

    rerender(<TimerSetup value={90} onChange={vi.fn()} />);
    expect(screen.getByText('1:30 Minuten')).toBeInTheDocument();

    rerender(<TimerSetup value={300} onChange={vi.fn()} />);
    expect(screen.getAllByText('5 Minuten').length).toBeGreaterThan(0);
  });

  it('meldet die sekunden zur reglerposition', () => {
    const onChange = vi.fn();
    const { rerender } = render(<TimerSetup value={null} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Bedenkzeit je Frage'), { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith(10);

    rerender(<TimerSetup value={30} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Bedenkzeit je Frage'), { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('nennt die gewählte zeit auch für screenreader', () => {
    render(<TimerSetup value={30} onChange={vi.fn()} />);

    expect(screen.getByLabelText('Bedenkzeit je Frage')).toHaveAttribute(
      'aria-valuetext',
      '30 Sekunden',
    );
  });

  it('rechnet sekunden und reglerposition ineinander um', () => {
    expect(timerSliderValue(null)).toBe(0);
    expect(timerSliderValue(10)).toBe(1);
    expect(timerSliderValue(300)).toBe(11);
    // Ein Wert außerhalb der Stufen fällt auf „ohne Zeitbegrenzung" zurück.
    expect(timerSliderValue(7)).toBe(0);
  });
});

describe('veto-zeit einstellen', () => {
  const regler = () => screen.getByLabelText('Veto-Zeit je Übernahme');

  it('ist standardmäßig an die bedenkzeit gekoppelt und nennt den daraus folgenden wert', () => {
    render(<VetoSetup value={null} timerSeconds={45} onChange={vi.fn()} />);

    expect(regler()).toHaveValue(String(timerSliderValue(null)));
    expect(screen.getByText('Wie die Bedenkzeit')).toBeInTheDocument();
    expect(screen.getByText('Damit gilt: 45 Sekunden')).toBeInTheDocument();
    expect(regler()).toHaveAttribute('aria-valuetext', 'Wie die Bedenkzeit (45 Sekunden)');
  });

  it('meldet eine eigene zeit und zeigt sie im klartext', () => {
    const onChange = vi.fn();
    const { rerender } = render(<VetoSetup value={null} timerSeconds={45} onChange={onChange} />);

    fireEvent.change(regler(), { target: { value: String(timerSliderValue(20)) } });
    expect(onChange).toHaveBeenCalledWith(20);

    rerender(<VetoSetup value={20} timerSeconds={45} onChange={onChange} />);
    expect(screen.getByText('20 Sekunden')).toBeInTheDocument();
    expect(screen.queryByText(/Damit gilt/)).not.toBeInTheDocument();
    expect(regler()).toHaveAttribute('aria-valuetext', '20 Sekunden');
  });

  it('koppelt auf der ersten stufe wieder an die bedenkzeit', () => {
    const onChange = vi.fn();
    render(<VetoSetup value={20} timerSeconds={45} onChange={onChange} />);

    fireEvent.change(regler(), { target: { value: '0' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('sperrt den regler ohne bedenkzeit und erklärt den grund', () => {
    render(<VetoSetup value={20} timerSeconds={null} onChange={vi.fn()} />);

    expect(regler()).toBeDisabled();
    expect(screen.getByText('Ohne Zeitbegrenzung')).toBeInTheDocument();
    expect(screen.getByText(/Ohne Bedenkzeit läuft auch im Veto keine Uhr/)).toBeInTheDocument();
    expect(regler()).toHaveAccessibleDescription(/Ohne Bedenkzeit läuft auch im Veto keine Uhr/);
  });
});

describe('spielregeln wählen', () => {
  it('markiert die aktive regel', () => {
    render(<RulesSetup deductOnWrong onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Punkte werden abgezogen/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Punktestand bleibt/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('meldet die auswahl der anderen regel', async () => {
    const onChange = vi.fn();
    render(<RulesSetup deductOnWrong onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /Punktestand bleibt/ }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('beschreibt beide regeln', () => {
    render(<RulesSetup deductOnWrong={false} onChange={vi.fn()} />);

    expect(screen.getByText(/fällt nie unter null/)).toBeInTheDocument();
    expect(screen.getByText(/ändert den Punktestand nicht/)).toBeInTheDocument();
  });
});
