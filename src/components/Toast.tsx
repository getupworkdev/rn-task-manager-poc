import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';

export type ToastOptions = {
  message: string;
  variant?: 'info' | 'error';
  action?: { label: string; onPress: () => void };
  /** How long the toast stays up, in milliseconds. */
  duration?: number;
};

type ToastState = ToastOptions & { id: number };

type ToastContextValue = { show: (options: ToastOptions) => void; hide: () => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  }, []);

  const show = useCallback((options: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current);
    counter.current += 1;
    const next = { ...options, id: counter.current };
    setToast(next);
    AccessibilityInfo.announceForAccessibility(options.message);
    timer.current = setTimeout(() => setToast(null), options.duration ?? 3500);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <ToastView key={toast.id} toast={toast} onHide={hide} /> : null}
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onHide }: { toast: ToastState; onHide: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: false }).start();
  }, [opacity]);

  const isError = toast.variant === 'error';

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + theme.space.lg }]}
    >
      <Animated.View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        testID="toast"
        style={[
          styles.toast,
          {
            opacity,
            backgroundColor: isError ? theme.colors.danger : theme.colors.toast,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.space.lg,
            paddingVertical: theme.space.md,
          },
        ]}
      >
        <Text
          style={[
            styles.message,
            {
              color: isError ? theme.colors.onDanger : theme.colors.onToast,
              fontSize: theme.font.sm,
            },
          ]}
        >
          {toast.message}
        </Text>
        {toast.action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={toast.action.label}
            hitSlop={12}
            onPress={() => {
              toast.action?.onPress();
              onHide();
            }}
          >
            <Text
              style={{
                color: isError ? theme.colors.onDanger : theme.colors.toastAction,
                fontWeight: '700',
                fontSize: theme.font.sm,
              }}
            >
              {toast.action.label.toUpperCase()}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    maxWidth: 560,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  message: { flex: 1 },
});
