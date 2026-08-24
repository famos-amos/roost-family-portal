import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { useMealsStore } from '../store/useAppStore';
import { seedRecipes } from '../data/recipes';
import { MealIcon, PlusIcon, StarIcon } from '../components/icons';
import { AssignToPlanModal } from '../components/AssignToPlanModal';
import { assignMealToPlan } from '../lib/assignMeal';
import { notify } from '../lib/alerts';

export function SuggestionsScreen() {
  const theme = useTheme();
  const meals = useMealsStore((s) => s.meals);
  const upsertMeal = useMealsStore((s) => s.upsertMeal);

  const [customName, setCustomName] = useState('');
  const [assigningName, setAssigningName] = useState<string | null>(null);

  // "Existing meal" reuse: distinct names already used somewhere in the plan,
  // most-recent-ish first, so a family can quickly re-schedule a favorite
  // instead of retyping it.
  const existingNames = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const m of meals) {
      if (!seen.has(m.name)) {
        seen.add(m.name);
        names.push(m.name);
      }
    }
    return names;
  }, [meals]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.bg }]}>
      <TopBar />
      <View style={styles.toolbar}>
        <StarIcon size={18} color={theme.colors.mealDk} filled={false} />
        <Text style={{ fontFamily: theme.fonts.head, fontSize: 18, color: theme.colors.ink }}>Suggestions</Text>
      </View>
      <Text style={[styles.hint, { color: theme.colors.inkSoft, fontFamily: theme.fonts.body }]}>
        Suggest a new meal or reuse an old favorite, then pick a day to add it to the plan.
      </Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.colors.panel }]}>
          <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 14.5, color: theme.colors.ink, marginBottom: 10 }}>
            Suggest a meal
          </Text>
          <TextInput
            placeholder="New meal name…"
            placeholderTextColor={theme.colors.inkSoft}
            value={customName}
            onChangeText={setCustomName}
            style={[styles.input, { backgroundColor: theme.colors.fieldBg, color: theme.colors.ink }]}
          />
          <Pressable
            disabled={!customName.trim()}
            onPress={() => setAssigningName(customName.trim())}
            style={[styles.addBtn, { backgroundColor: theme.colors.mealDk, opacity: customName.trim() ? 1 : 0.4, alignSelf: 'flex-start' }]}
          >
            <PlusIcon size={14} color="#fff" />
            <Text style={{ fontFamily: theme.fonts.headSemiBold, color: '#fff', fontSize: 13 }}>Assign a date</Text>
          </Pressable>

          {existingNames.length > 0 && (
            <>
              <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 12.5, color: theme.colors.inkSoft, marginTop: 18, marginBottom: 8 }}>
                Or reuse a favorite
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {existingNames.map((name) => (
                  <Pressable
                    key={name}
                    onPress={() => setAssigningName(name)}
                    style={[styles.nameChip, { backgroundColor: theme.colors.fieldBg }]}
                  >
                    <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 12, color: theme.colors.ink }}>{name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 14.5, color: theme.colors.ink, marginTop: 20, marginBottom: 10 }}>
          Meal ideas
        </Text>
        {seedRecipes.map((recipe) => (
          <View key={recipe.id} style={[styles.ideaCard, { backgroundColor: theme.colors.panel }]}>
            <View style={[styles.typeIcon, { backgroundColor: theme.colors.mealBg }]}>
              <MealIcon size={14} color={theme.colors.mealDk} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 13.5, color: theme.colors.ink }}>{recipe.name}</Text>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.inkSoft }}>{recipe.time}</Text>
            </View>
            <Pressable onPress={() => setAssigningName(recipe.name)} style={[styles.smallAddBtn, { backgroundColor: theme.colors.mealDk }]}>
              <PlusIcon size={13} color="#fff" />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <AssignToPlanModal
        visible={assigningName !== null}
        mealName={assigningName ?? ''}
        onClose={() => setAssigningName(null)}
        onConfirm={(day, slot) => {
          if (!assigningName) return;
          assignMealToPlan({ meals, upsertMeal, name: assigningName, day, slot });
          setAssigningName(null);
          setCustomName('');
          notify('Added to plan', `${assigningName} is on the calendar.`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1, minHeight: 0 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 2, paddingBottom: 4 },
  hint: { paddingHorizontal: 24, fontSize: 12, marginBottom: 12 },
  content: { paddingHorizontal: 24, paddingBottom: 24, maxWidth: 680 },
  card: { borderRadius: 18, padding: 18 },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, fontSize: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  nameChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  ideaCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 10, marginBottom: 8 },
  typeIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  smallAddBtn: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
