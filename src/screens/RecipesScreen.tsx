import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { useMealsStore } from '../store/useAppStore';
import { seedRecipes, Recipe } from '../data/recipes';
import { BookIcon, ChevronRightIcon, MealIcon, PlusIcon } from '../components/icons';
import { AssignToPlanModal } from '../components/AssignToPlanModal';
import { assignMealToPlan } from '../lib/assignMeal';
import { notify } from '../lib/alerts';

const SLOT_LABEL: Record<Recipe['slot'], string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

export function RecipesScreen() {
  const theme = useTheme();
  const meals = useMealsStore((s) => s.meals);
  const upsertMeal = useMealsStore((s) => s.upsertMeal);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<Recipe | null>(null);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.bg }]}>
      <TopBar />
      <View style={styles.toolbar}>
        <BookIcon size={18} color={theme.colors.mealDk} />
        <Text style={{ fontFamily: theme.fonts.head, fontSize: 18, color: theme.colors.ink }}>Recipes</Text>
      </View>
      <Text style={[styles.hint, { color: theme.colors.inkSoft, fontFamily: theme.fonts.body }]}>
        Tap a recipe to see ingredients and steps, or add it straight to the weekly plan.
      </Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        {seedRecipes.map((recipe) => {
          const expanded = expandedId === recipe.id;
          return (
            <View key={recipe.id} style={[styles.card, { backgroundColor: theme.colors.panel }]}>
              <Pressable style={styles.cardHead} onPress={() => setExpandedId(expanded ? null : recipe.id)}>
                <View style={[styles.typeIcon, { backgroundColor: theme.colors.mealBg }]}>
                  <MealIcon size={15} color={theme.colors.mealDk} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 15, color: theme.colors.ink }}>
                    {recipe.name}
                  </Text>
                  <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.inkSoft, marginTop: 2 }}>
                    {SLOT_LABEL[recipe.slot]} · {recipe.time}
                  </Text>
                </View>
                <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
                  <ChevronRightIcon size={16} color={theme.colors.inkSoft} />
                </View>
              </Pressable>

              {expanded && (
                <View style={styles.detail}>
                  <Text style={[styles.detailLabel, { color: theme.colors.inkSoft }]}>Ingredients</Text>
                  {recipe.ingredients.map((ing, i) => (
                    <Text key={i} style={{ fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.ink, marginBottom: 3 }}>
                      • {ing}
                    </Text>
                  ))}
                  <Text style={[styles.detailLabel, { color: theme.colors.inkSoft, marginTop: 12 }]}>Steps</Text>
                  {recipe.steps.map((step, i) => (
                    <Text key={i} style={{ fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.ink, marginBottom: 6 }}>
                      {i + 1}. {step}
                    </Text>
                  ))}
                  <Pressable
                    onPress={() => setAssigning(recipe)}
                    style={[styles.addBtn, { backgroundColor: theme.colors.mealDk }]}
                  >
                    <PlusIcon size={14} color="#fff" />
                    <Text style={{ fontFamily: theme.fonts.headSemiBold, color: '#fff', fontSize: 13 }}>Add to Plan</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <AssignToPlanModal
        visible={assigning !== null}
        mealName={assigning?.name ?? ''}
        defaultSlot={assigning?.slot}
        onClose={() => setAssigning(null)}
        onConfirm={(day, slot) => {
          if (!assigning) return;
          assignMealToPlan({ meals, upsertMeal, name: assigning.name, day, slot });
          setAssigning(null);
          notify('Added to plan', `${assigning.name} is on the calendar.`);
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
  list: { paddingHorizontal: 24, paddingBottom: 24, gap: 12, maxWidth: 680 },
  card: { borderRadius: 18, padding: 4 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  typeIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detail: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  detailLabel: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 16 },
});
