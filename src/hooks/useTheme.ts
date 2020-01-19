import { useMemo } from 'react';
import { useStoreState } from 'store';
import { themeColors, ThemeColors } from 'theme/colors';

/**
 * React hook which returns the ThemeColors based on which
 * theme is currently specified in the app settings
 */
export const useTheme = (): ThemeColors => {
  const { theme } = useStoreState(s => s.app.settings);

  const colors = useMemo(() => {
    return themeColors[theme];
  }, [theme]);

  return colors;
};
