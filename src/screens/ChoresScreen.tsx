import React, { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { useChoresStore, useFamilyStore } from '../store/useAppStore';
import { PlusIcon, StarIcon } from '../components/icons';
import { Checkbox, PrimaryButton } from '../components/ui';
import { Chore } from '../store/types';

export function ChoresScreen() {
  const theme = useTheme();
  const chores = useChoresStore((s) => s.chores);
  const toggleChore = useChoresStore((s) => s.toggleChore);
  const claimChore = useChoresStore((s) => s.claimChore);
  const addChore = useChoresStore((s) => s.addChore);
  const resetWeek = useChoresStore((s) => s.resetWeek);
  const family = useFamilyStore((s) => s.members);

  const [addingFor, setAddingFor] = useState<string | null | 'new'>(null);

  const totalStarsThisWeek = chores.filter((c) => c.done).reduce((sum, c) => sum + c.points, 0);

  const columns: { key: string | null; title: string; color: string }[] = [
    { key: null, title: 'Up for Grabs', color: theme.isDark ? '#3A3226' : '#F3EEE3' },
    ...family.map((m) => ({ key: m.id, title: m.name, color: m.color + '22' })),
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.bg }]}>
      <TopBar />
      <View style={styles.toolbar}>
        <View style={[styles.weekPill, { backgroundColor: theme.isDark ? '#FFFFFF10' : '#ffffffb0' }]}>
          <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 13, color: theme.colors.ink }}>This Week</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={[styles.starsPill, { backgroundColor: theme.colors.mealBg }]}>
          <StarIcon size={14} color={theme.colors.star} />
          <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 13, color: theme.colors.mealDk }}>
            {totalStarsThisWeek} stars earned this week
          </Text>
        </View>
        <PrimaryButton label="Reset Week" color={theme.colors.inkSoft} onPress={resetWeek} />
      </View>

      <ScrollView horizontal contentContainerStyle={styles.board}>
        {columns.map((col) => {
          const items = chores.filter((c) => c.assigneeId === col.key);
          const assigneeName = col.key ? family.find((f) => f.id === col.key)?.name : undefined;
          return (
            <View key={col.key ?? 'grabs'} style={[styles.col, { backgroundColor: col.color }]}>
              <View style={styles.colHead}>
                <Text style={{ fontFamily: theme.fonts.head, fontSize: 15, color: theme.colors.ink }}>{col.title}</Text>
                <View style={[styles.countBadge, { backgroundColor: theme.isDark ? '#FFFFFF20' : '#ffffffa0' }]}>
                  <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 11, color: theme.colors.ink }}>
                    {items.filter((c) => c.done).length}/{items.length}
                  </Text>
                </View>
              </View>

              {items.map((chore) => (
                <ChoreCard
                  key={chore.id}
                  chore={chore}
                  onToggle={() => toggleChore(chore.id)}
                  onClaim={col.key === null ? () => claimChore(chore.id, family[0]?.id ?? '') : undefined}
                  claimLabel={col.key === null ? 'Claim' : undefined}
                />
              ))}

              <Pressable
                onPress={() => setAddingFor(col.key ?? 'new')}
                style={[styles.addItem, { borderColor: theme.colors.border }]}
              >
                <PlusIcon size={13} color={theme.colors.inkSoft} />
                <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 12.5, color: theme.colors.inkSoft }}>
                  Add chore
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <AddChoreModal
        visible={addingFor !== null}
        assigneeId={addingFor === 'new' ? null : addingFor}
        onClose={() => setAddingFor(null)}
        onSave={(title, points, assigneeId) => {
          addChore({ title, points, assigneeId });
          setAddingFor(null);
        }}
      />
    </SafeAreaView>
  );
}

function ChoreCard({
  chore,
  onToggle,
  onClaim,
  claimLabel,
}: {
  chore: Chore;
  onToggle: () => void;
  onClaim?: () => void;
  claimLabel?: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.choreCard, { backgroundColor: theme.colors.panel }]}>
      {!claimLabel && <Checkbox checked={chore.done} onPress={onToggle} />}
      <Text
        style={{
          flex: 1,
          fontFamily: theme.fonts.bodySemiBold,
          fontSize: 13.5,
          color: theme.colors.ink,
          textDecorationLine: chore.done ? 'line-through' : 'none',
          opacity: chore.done ? 0.55 : 1,
        }}
      >
        {chore.title}
      </Text>
      {claimLabel ? (
        <Pressable onPress={onClaim} style={[styles.claimBtn, { backgroundColor: theme.colors.ink }]}>
          <Text style={{ color: '#fff', fontFamily: theme.fonts.headSemiBold, fontSize: 10.5 }}>{claimLabel}</Text>
        </Pressable>
      ) : chore.points > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <StarIcon size={12} color={theme.colors.star} />
          <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 11, color: theme.colors.mealDk }}>
            {chore.points}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function AddChoreModal({
  visible,
  assigneeId,
  onClose,
  onSave,
}: {
  visible: boolean;
  assigneeId: string | null;
  onClose: () => void;
  onSave: (title: string, points: number, assigneeId: string | null) => void;
}) {
  const theme = useTheme();
  const family = useFamilyStore((s) => s.members);
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('1');
  const [assignee, setAssignee] = useState<string | null>(assigneeId);

  React.useEffect(() => {
    if (visible) {
      setTitle('');
      setPoints('1');
      setAssignee(assigneeId);
    }
  }, [visible, assigneeId]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: theme.colors.panel }]}>
          <Text style={{ fontFamily: theme.fonts.head, fontSize: 17, color: theme.colors.ink, marginBottom: 14 }}>
            New Chore
          </Text>
          <TextInput
            placeholder="Chore title"
            placeholderTextColor={theme.colors.inkSoft}
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: theme.colors.fieldBg, color: theme.colors.ink }]}
          />
          <TextInput
            placeholder="Stars (0-5)"
            placeholderTextColor={theme.colors.inkSoft}
            value={points}
            onChangeText={setPoints}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: theme.colors.fieldBg, color: theme.colors.ink }]}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            <Pressable
              onPress={() => setAssignee(null)}
              style={[styles.personChip, { backgroundColor: assignee === null ? theme.colors.ink : theme.colors.fieldBg }]}
            >
              <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 12, color: assignee === null ? '#fff' : theme.colors.ink }}>
                Up for Grabs
              </Text>
            </Pressable>
            {family.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setAssignee(m.id)}
                style={[styles.personChip, { backgroundColor: assignee === m.id ? m.color : theme.colors.fieldBg }]}
              >
                <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 12, color: assignee === m.id ? '#fff' : theme.colors.ink }}>
                  {m.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={onClose} style={[styles.modalBtn, { backgroundColor: theme.colors.fieldBg }]}>
              <Text style={{ fontFamily: theme.fonts.headSemiBold, color: theme.colors.inkSoft }}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!title.trim()}
              onPress={() => onSave(title.trim(), Number(points) || 0, assignee)}
              style={[styles.modalBtn, { backgroundColor: theme.colors.ink, opacity: title.trim() ? 1 : 0.4 }]}
            >
              <Text style={{ fontFamily: theme.fonts.headSemiBold, color: '#fff' }}>Add</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingBottom: 12, flexWrap: 'wrap' },
  weekPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  starsPill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  board: { paddingHorizontal: 24, paddingBottom: 24, gap: 16 },
  col: { width: 260, borderRadius: 22, padding: 14, gap: 10 },
  colHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 },
  choreCard: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, padding: 11 },
  claimBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  addItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed' },
  modalBackdrop: { flex: 1, backgroundColor: '#00000050', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: 420, borderRadius: 24, padding: 22 },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, fontSize: 14 },
  personChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 14 },
});
