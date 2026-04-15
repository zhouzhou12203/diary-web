import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ThemeProvider } from '../components/ThemeProvider';

export function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}
