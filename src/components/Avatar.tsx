import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Avatar({
  initials,
  color,
  size = 34,
  style,
}: {
  initials: string;
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderColor: theme.colors.bg,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontFamily: theme.fonts.head, fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  text: { color: '#fff' },
});
