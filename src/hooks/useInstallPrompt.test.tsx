import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getManualInstallHint, useInstallPrompt } from './useInstallPrompt';

function InstallPromptProbe({ isStandalone = false }: { isStandalone?: boolean }) {
  const { canPromptInstall, lastOutcome, manualInstallHint, promptInstall } = useInstallPrompt(isStandalone);

  return (
    <div>
      <div data-testid="can-install">{canPromptInstall ? 'yes' : 'no'}</div>
      <div data-testid="manual-hint">{manualInstallHint ?? ''}</div>
      <div data-testid="outcome">{lastOutcome ?? ''}</div>
      <button type="button" onClick={() => void promptInstall()}>
        安装应用
      </button>
    </div>
  );
}

describe('useInstallPrompt', () => {
  afterEach(() => {
    cleanup();
  });

  it('captures the browser install prompt and records accepted outcome', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const userChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
    const promptEvent = new Event('beforeinstallprompt');

    Object.defineProperty(promptEvent, 'prompt', { value: prompt });
    Object.defineProperty(promptEvent, 'userChoice', { value: userChoice });

    render(<InstallPromptProbe />);

    window.dispatchEvent(promptEvent);
    await waitFor(() => {
      expect(screen.getByTestId('can-install')).toHaveTextContent('yes');
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '安装应用' }));

    await waitFor(() => {
      expect(prompt).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('outcome')).toHaveTextContent('accepted');
      expect(screen.getByTestId('can-install')).toHaveTextContent('no');
    });
  });

  it('returns a manual ios install hint when the install prompt is unavailable', () => {
    expect(
      getManualInstallHint(
        {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
          platform: 'iPhone',
          maxTouchPoints: 5,
        },
        false
      )
    ).toContain('添加到主屏幕');
  });
});
