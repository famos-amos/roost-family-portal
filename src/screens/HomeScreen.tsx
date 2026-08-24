import React, { useCallback } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { useDashboardLayoutStore } from '../store/useAppStore';
import { DashboardWidgetLayout, WidgetSize } from '../store/types';
import { WidgetShell } from './home/WidgetShell';
import {
  CalendarWidgetContent,
  ChallengeWidgetContent,
  ChoresWidgetContent,
  EventsWidgetContent,
  MealWidgetContent,
  TodoWidgetContent,
  VerseWidgetContent,
} from './home/widgets';

const HEIGHT_BY_SIZE: Record<WidgetSize, number> = { sm: 150, md: 230, lg: 320 };

export function HomeScreen() {
  const theme = useTheme();
  const layout = useDashboardLayoutStore((s) => s.layout);
  const reorder = useDashboardLayoutStore((s) => s.reorder);
  const setSize = useDashboardLayoutStore((s) => s.setSize);

  const sorted = [...layout].sort((a, b) => a.order - b.order);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<DashboardWidgetLayout>) => {
      const bg = backgroundFor(item.id, theme);
      return (
        <View style={{ minHeight: HEIGHT_BY_SIZE[item.size], marginBottom: 16 }}>
          <WidgetShell
            backgroundColor={bg}
            size={item.size}
            onCycleSize={(next) => setSize(item.id, next)}
            onDrag={drag}
            isActive={isActive}
          >
            {renderWidget(item.id, item.size)}
          </WidgetShell>
        </View>
      );
    },
    [theme, setSize],
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.bg }]}>
      <TopBar />
      <Text style={[styles.hint, { color: theme.colors.inkSoft, fontFamily: theme.fonts.bodyBold }]}>
        Long-press the dots to drag a widget, tap the corner marks to resize it.
      </Text>
      <DraggableFlatList
        style={styles.list}
        containerStyle={styles.list}
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => reorder(data.map((d) => d.id))}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function renderWidget(id: DashboardWidgetLayout['id'], size: WidgetSize) {
  switch (id) {
    case 'calendar':
      return <CalendarWidgetContent size={size} />;
    case 'events':
      return <EventsWidgetContent size={size} />;
    case 'meal':
      return <MealWidgetContent size={size} />;
    case 'todo':
      return <TodoWidgetContent size={size} />;
    case 'challenge':
      return <ChallengeWidgetContent />;
    case 'verse':
      return <VerseWidgetContent />;
    case 'chores':
      return <ChoresWidgetContent />;
  }
}

function backgroundFor(id: DashboardWidgetLayout['id'], theme: ReturnType<typeof useTheme>) {
  switch (id) {
    case 'calendar':
      return theme.colors.calBg;
    case 'meal':
      return theme.colors.mealBg;
    case 'todo':
    case 'challenge':
      return theme.colors.boardsBg;
    case 'verse':
      return theme.colors.verseBg;
    case 'chores':
      return theme.colors.choresBg;
    default:
      return theme.colors.panel;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hint: { paddingHorizontal: 24, fontSize: 11.5, marginBottom: 6 },
  // `flex: 1` + `minHeight: 0` lets the list claim exactly the remaining
  // space below the header/hint and manage its own internal scrolling,
  // instead of growing past the viewport (which is what was clipping the
  // page on web, where nothing scrolls unless a flex child explicitly
  // gives up the "never shrink below content size" default).
  list: { flex: 1, minHeight: 0 },
  listContent: { paddingHorizontal: 24, paddingBottom: 24 },
});
