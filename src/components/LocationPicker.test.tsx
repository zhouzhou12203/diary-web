import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocationPicker } from './LocationPicker';
import { renderWithTheme } from '../test/renderWithTheme';

describe('LocationPicker', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('adds a manual location and clears it afterwards', async () => {
    const user = userEvent.setup();
    const onLocationChange = vi.fn();

    renderWithTheme(
      <LocationPicker location={null} onLocationChange={onLocationChange} />
    );

    await user.click(screen.getByRole('button', { name: /手动输入/ }));
    await user.type(screen.getByPlaceholderText('输入位置名称，如：咖啡厅、家里、公司...'), '静安寺咖啡馆');
    await user.click(screen.getByRole('button', { name: '添加' }));

    expect(onLocationChange).toHaveBeenCalledWith({
      name: '静安寺咖啡馆',
      address: '静安寺咖啡馆',
    });

    cleanup();
    renderWithTheme(
      <LocationPicker
        location={{ name: '静安寺咖啡馆', address: '静安寺咖啡馆' }}
        onLocationChange={onLocationChange}
      />
    );

    await user.click(screen.getByTitle('清除位置'));
    expect(onLocationChange).toHaveBeenLastCalledWith(null);
  });
});
