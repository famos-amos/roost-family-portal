import React, { useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { useFamilyStore, useMealsStore } from '../store/useAppStore';
import { WEEKDAY_LABELS, dayOfWeek } from '../lib/date';
import { BoardsIcon, BookIcon, MealIcon, PlusIcon, StarIcon } from '../components/icons';
import { PrimaryButton, SegmentedControl } from '../components/ui';
import { DayOfWeek, Meal, MealSlotType } from '../store/types';

const SLOTS: MealSlotType[] = ['breakfast', 'lunch', 'dinner'];

export function MealPlansScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const meals = useMealsStore((s) => s.meals);
  const upsertMeal = useMealsStore((s) => s.upsertMeal);
  const family = useFamilyStore((s) => s.members);
  const today = dayOfWeek();

  const [editing, setEditing] = useState<{ day: DayOfWeek; slot: MealSlotType; meal?: Meal } | null>(null);

  const mealFor = (day: DayOfWeek, slot: MealSlotType) => meals.find((m) => m.day === day && m.slot === slot);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.bg }]}>
      <TopBar />
      <View style={styles.toolbar}>
        <Text style={{ fontFamily: theme.fonts.head, fontSize: 18, color: theme.colors.ink }}>This Week</Text>
        <View style={{ flex: 1 }} />
        <PrimaryButton
          label="Add Meal"
          color={theme.colors.mealDk}
          icon={<PlusIcon size={15} color="#fff" />}
          onPress={() => setEditing({ day: today, slot: 'dinner' })}
        />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.plannerWrap}>
        <View style={styles.planner}>
          {WEEKDAY_LABELS.map(({ key, label }) => (
            <Text
              key={key}
              style={[
                styles.dayHead,
                { fontFamily: theme.fonts.headSemiBold, color: key === today ? theme.colors.mealDk : theme.colors.inkSoft },
              ]}
            >
              {label}
              {key === today ? ' • Today' : ''}
            </Text>
          ))}

          {SLOTS.map((slot) => (
            <React.Fragment key={slot}>
              <Text style={[styles.rowLabel, { fontFamily: theme.fonts.headSemiBold, color: theme.colors.inkSoft }]}>
                {slot}
              </Text>
              {WEEKDAY_LABELS.map(({ key }) => {
                const meal = mealFor(key, slot);
                const chef = family.find((f) => f.id === meal?.chefId);
                const isToday = key === today;
                return (
                  <Pressable
                    key={key + slot}
                    onPress={() => setEditing({ day: key, slot, meal })}
                    style={[
                      styles.slot,
                      { backgroundColor: theme.colors.panel },
                      isToday && { backgroundColor: theme.colors.mealBg, borderWidth: 2, borderColor: theme.colors.meal },
                      !meal && styles.emptySlot,
                    ]}
                  >
                    {meal ? (
                      <>
                        <View style={[styles.typeIcon, { backgroundColor: isToday ? '#ffffffb0' : theme.colors.mealBg }]}>
                          <MealIcon size={13} color={theme.colors.mealDk} />
                        </View>
                        <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 13, color: theme.colors.ink, marginBottom: 'auto' }}>
                          {meal.name}
                        </Text>
                        {chef && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: chef.color }} />
                            <Text style={{ fontSize: 10.5, fontFamily: theme.fonts.bodyBold, color: theme.colors.inkSoft }}>
                              {chef.name}
                            </Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 12, color: theme.colors.inkSoft }}>+ Add</Text>
                    )}
                  </Pressable>
                );
              })}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      <View style={styles.quicklinks}>
        <Pressable style={[styles.qlink, { backgroundColor: theme.colors.panel }]} onPress={() => navigation.navigate('Boards')}>
          <BoardsIcon size={18} color={theme.colors.ink} />
          <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 14, color: theme.colors.ink }}>Grocery List</Text>
        </Pressable>
        <Pressable
          style={[styles.qlink, { backgroundColor: theme.colors.panel }]}
          onPress={() => Alert.alert('Recipes', 'Recipe library is coming in a future update.')}
        >
          <BookIcon size={18} color={theme.colors.ink} />
          <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 14, color: theme.colors.ink }}>Recipes</Text>
        </Pressable>
        <Pressable
          style={[styles.qlink, { backgroundColor: theme.colors.panel }]}
          onPress={() => Alert.alert('Suggestions', 'Meal suggestions are coming in a future update.')}
        >
          <StarIcon size={18} color={theme.colors.ink} filled={false} />
          <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 14, color: theme.colors.ink }}>Suggestions</Text>
        </Pressable>
      </View>

      <EditMealModal
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (!editing) return;
          upsertMeal({ id: editing.meal?.id, day: editing.day, ...patch });
          setEditing(null);
        }}
      />
    </SafeAreaView>
  );
}

function EditMealModal({
  editing,
  onClose,
  onSave,
}: {
  editing: { day: DayOfWeek; slot: MealSlotType; meal?: Meal } | null;
  onClose: () => void;
  onSave: (patch: { name: string; chefId: string | null; notes?: string; slot: MealSlotType }) => void;
}) {
  const theme = useTheme();
  const family = useFamilyStore((s) => s.members);
  const [name, setName] = useState('');
  const [chefId, setChefId] = useState<string | null>(null);
  const [slot, setSlot] = useState<MealSlotType>('dinner');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (editing) {
      setName(editing.meal?.name ?? '');
      setChefId(editing.meal?.chefId ?? null);
      setSlot(editing.slot);
      setNotes(editing.meal?.notes ?? '');
    }
  }, [editing]);

  if (!editing) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: theme.colors.panel }]}>
          <Text style={{ fontFamily: theme.fonts.head, fontSize: 17, color: theme.colors.ink, marginBottom: 14 }}>
            {editing.meal ? 'Edit Meal' : 'Add Meal'}
          </Text>

          <Text style={[styles.label, { color: theme.colors.inkSoft }]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Meal name"
            placeholderTextColor={theme.colors.inkSoft}
            style={[styles.input, { backgroundColor: theme.colors.fieldBg, color: theme.colors.ink }]}
          />

          <Text style={[styles.label, { color: theme.colors.inkSoft }]}>Chef</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {family.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setChefId(chefId === m.id ? null : m.id)}
                style={[styles.personChip, { backgroundColor: chefId === m.id ? m.color : theme.colors.fieldBg }]}
              >
                <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 12, color: chefId === m.id ? '#fff' : theme.colors.ink }}>
                  {m.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.colors.inkSoft }]}>Tag for</Text>
          <View style={{ marginBottom: 12 }}>
            <SegmentedControl
              value={slot}
              onChange={setSlot}
              options={[
                { value: 'breakfast', label: 'Breakfast' },
                { value: 'lunch', label: 'Lunch' },
                { value: 'dinner', label: 'Dinner' },
              ]}
            />
          </View>

          <Text style={[styles.label, { color: theme.colors.inkSoft }]}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            placeholderTextColor={theme.colors.inkSoft}
            multiline
            style={[styles.input, { backgroundColor: theme.colors.fieldBg, color: theme.colors.ink, minHeight: 56 }]}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Pressable onPress={onClose} style={[styles.modalBtn, { backgroundColor: theme.colors.fieldBg }]}>
              <Text style={{ fontFamily: theme.fonts.headSemiBold, color: theme.colors.inkSoft }}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!name.trim()}
              onPress={() => onSave({ name: name.trim(), chefId, notes: notes.trim() || undefined, slot })}
              style={[styles.modalBtn, { backgroundColor: theme.colors.mealDk, opacity: name.trim() ? 1 : 0.4 }]}
            >
              <Text style={{ fontFamily: theme.fonts.headSemiBold, color: '#fff' }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1, minHeight: 0 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingBottom: 10 },
  plannerWrap: { paddingHorizontal: 24 },
  planner: { flexDirection: 'row', flexWrap: 'wrap' },
  dayHead: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 13, paddingBottom: 8 },
  rowLabel: { width: '100%', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginVertical: 8 },
  slot: {
    width: `${100 / 7}%`,
    minHeight: 110,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  emptySlot: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 2, borderColor: '#00000015', borderStyle: 'dashed' },
  typeIcon: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quicklinks: { flexDirection: 'row', gap: 14, paddingHorizontal: 24, paddingVertical: 16 },
  qlink: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
  modalBackdrop: { flex: 1, backgroundColor: '#00000050', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: 420, borderRadius: 24, padding: 22 },
  label: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, fontSize: 14 },
  personChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 14 },
});
