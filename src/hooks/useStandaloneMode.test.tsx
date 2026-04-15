import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStandaloneMode } from './useStandaloneMode';

function StandaloneProbe() {
  const isStandalone = useStandaloneMode();

  return <div data-testid="standalone-state">{isStandalone ? 'yes' : 'no'}</div>;
}

function mockMatchMedia(matches = false) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

describe('useStandaloneMode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window.navigator, 'standalone');
  });

  it('detects iOS standalone mode on initial render via navigator.standalone', () => {
    mockMatchMedia(false);
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: true,
    });

    render(<StandaloneProbe />);

    expect(screen.getByTestId('standalone-state')).toHaveTextContent('yes');
  });
});
