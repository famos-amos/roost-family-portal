import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { ResizeHandleIcon } from '../../components/icons';
import { WidgetSize } from '../../store/types';

const SIZE_ORDER: WidgetSize[] = ['sm', 'md', 'lg'];

export function WidgetShell({
  children,
  backgroundColor,
  size,
  onCycleSize,
  style,
}: {
  children: React.ReactNode;
  backgroundColor?: string;
  /** Omit on widgets whose content doesn't change with size (Daily
   * Challenge, Verse, Chores summary) — the resize/detail-level control is
   * hidden rather than shown as a no-op. */
  size?: WidgetSize;
  onCycleSize?: (next: WidgetSize) => void;
  style?: any;
}) {
  const theme = useTheme();

  const cycle = () => {
    if (!size || !onCycleSize) return;
    const idx = SIZE_ORDER.indexOf(size);
    onCycleSize(SIZE_ORDER[(idx + 1) % SIZE_ORDER.length]);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: backgroundColor ?? theme.colors.panel,
          borderRadius: theme.radii.xl,
        },
        style,
      ]}
    >
      <View style={styles.content}>{children}</View>

      {size !== undefined && onCycleSize && (
        <Pressable onPress={cycle} style={styles.resizeHandle} hitSlop={8}>
          <ResizeHandleIcon size={13} color={theme.colors.inkSoft} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, position: 'relative', flex: 1 },
  content: { flex: 1 },
  resizeHandle: { position: 'absolute', bottom: 10, right: 10, opacity: 0.4, padding: 4 },
});
