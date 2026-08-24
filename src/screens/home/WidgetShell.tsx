import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { DragHandleIcon, ResizeHandleIcon } from '../../components/icons';
import { WidgetSize } from '../../store/types';

const SIZE_ORDER: WidgetSize[] = ['sm', 'md', 'lg'];

export function WidgetShell({
  children,
  backgroundColor,
  size,
  onCycleSize,
  onDrag,
  isActive,
}: {
  children: React.ReactNode;
  backgroundColor?: string;
  size: WidgetSize;
  onCycleSize: (next: WidgetSize) => void;
  onDrag: () => void;
  isActive?: boolean;
}) {
  const theme = useTheme();

  const cycle = () => {
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
          opacity: isActive ? 0.85 : 1,
          borderWidth: isActive ? 2 : 0,
          borderColor: theme.colors.ink,
        },
      ]}
    >
      {children}

      <Pressable onLongPress={onDrag} delayLongPress={150} style={styles.dragHandle} hitSlop={8}>
        <DragHandleIcon size={15} color={theme.colors.inkSoft} />
      </Pressable>

      <Pressable onPress={cycle} style={styles.resizeHandle} hitSlop={8}>
        <ResizeHandleIcon size={13} color={theme.colors.inkSoft} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, position: 'relative' },
  dragHandle: { position: 'absolute', top: 12, right: 12, opacity: 0.5 },
  resizeHandle: { position: 'absolute', bottom: 10, right: 10, opacity: 0.4, padding: 4 },
});
