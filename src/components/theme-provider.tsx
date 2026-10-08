import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Appearance, processColor, useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { vars } from 'nativewind';
import { requireOptionalNativeModule } from 'expo';

import {
  DARK_COLORS,
  LIGHT_COLORS,
  resolveTheme,
  type ThemePreference,
} from '../constants/theme';
import {
  loadThemePreference,
  saveThemePreference,
} from '../storage/theme-storage';

function makeTheme(
  preference: ThemePreference,
  system: string | null | undefined,
) {
  const theme = resolveTheme(preference, system);
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  const variables = vars(
    Object.fromEntries(
      Object.entries(colors).map(([name, value]) => [
        `--color-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
        value,
      ]),
    ),
  );
  return { theme, colors, variables };
}

type ThemeContextValue = ReturnType<typeof makeTheme> & {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  storageError: string | null;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Optional while an older development APK is still installed.
const nativeSystemUI = requireOptionalNativeModule<{
  setBackgroundColorAsync: (
    color: ReturnType<typeof processColor>,
  ) => Promise<void>;
}>('ExpoSystemUI');

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, updatePreference] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const revision = useRef(0);
  const appearance = useMemo(
    () => makeTheme(preference, system),
    [preference, system],
  );

  useEffect(() => {
    let active = true;
    void loadThemePreference()
      .then((value) => {
        if (active) updatePreference(value);
      })
      .catch(() => {
        if (active)
          setStorageError('Не удалось загрузить тему. Выберите её ещё раз.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void nativeSystemUI
      ?.setBackgroundColorAsync(processColor(appearance.colors.paper))
      .catch(() => {});
  }, [appearance.colors.paper]);

  useEffect(() => {
    if (ready)
      Appearance.setColorScheme(preference === 'system' ? null : preference);
  }, [preference, ready]);

  const setPreference = useCallback((value: ThemePreference) => {
    updatePreference(value);
    setStorageError(null);
    const currentRevision = ++revision.current;
    void saveThemePreference(value).catch(() => {
      if (revision.current === currentRevision) {
        setStorageError(
          'Тема применена, но не сохранена. Нажмите на неё ещё раз.',
        );
      }
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{ ...appearance, preference, setPreference, storageError }}
    >
      <View
        style={[
          { flex: 1, backgroundColor: appearance.colors.paper },
          appearance.variables,
        ]}
      >
        <StatusBar style={appearance.theme === 'dark' ? 'light' : 'dark'} />
        {ready ? children : null}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
