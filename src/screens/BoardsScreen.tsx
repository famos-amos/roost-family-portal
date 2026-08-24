import React, { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { useBoardsStore, useFamilyStore } from '../store/useAppStore';
import { PlusIcon } from '../components/icons';
import { Checkbox, PrimaryButton } from '../components/ui';
import { personColorOptions } from '../theme/colors';

export function BoardsScreen() {
  const theme = useTheme();
  const columns = useBoardsStore((s) => s.columns);
  const items = useBoardsStore((s) => s.items);
  const toggleItem = useBoardsStore((s) => s.toggleItem);
  const addItem = useBoardsStore((s) => s.addItem);
  const addColumn = useBoardsStore((s) => s.addColumn);
  const family = useFamilyStore((s) => s.members);

  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newColumnOpen, setNewColumnOpen] = useState(false);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.bg }]}>
      <TopBar />
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }} />
        <PrimaryButton
          label="New Board"
          color={theme.colors.boardsDk}
          icon={<PlusIcon size={15} color="#fff" />}
          onPress={() => setNewColumnOpen(true)}
        />
      </View>

      <ScrollView horizontal style={styles.scroll} contentContainerStyle={styles.board}>
        {columns.map((col) => {
          const colItems = items.filter((i) => i.columnId === col.id);
          return (
            <View key={col.id} style={[styles.col, { backgroundColor: col.color + '1A' }]}>
              <View style={styles.colHead}>
                <Text style={{ fontFamily: theme.fonts.head, fontSize: 16, color: col.color }}>{col.title}</Text>
                <View style={[styles.countBadge, { backgroundColor: theme.isDark ? '#FFFFFF20' : '#ffffffa0' }]}>
                  <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 11, color: theme.colors.ink }}>
                    {colItems.length}
                  </Text>
                </View>
              </View>

              {colItems.map((item) => {
                const owner = family.find((f) => f.id === item.ownerId);
                return (
                  <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.colors.panel }]}>
                    <Checkbox checked={item.done} onPress={() => toggleItem(item.id)} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.itemTopRow}>
                        <Text
                          style={{
                            fontFamily: theme.fonts.bodyBold,
                            fontSize: 14,
                            color: theme.colors.ink,
                            textDecorationLine: item.done ? 'line-through' : 'none',
                            opacity: item.done ? 0.55 : 1,
                            flex: 1,
                          }}
                        >
                          {item.title}
                        </Text>
                        {owner && (
                          <View style={[styles.ownerTag, { backgroundColor: owner.color }]}>
                            <Text style={{ color: '#fff', fontFamily: theme.fonts.headSemiBold, fontSize: 10 }}>
                              {owner.name}
                            </Text>
                          </View>
                        )}
                      </View>
                      {item.description && (
                        <Text style={{ fontSize: 11.5, color: theme.colors.inkSoft, marginTop: 3, fontFamily: theme.fonts.body }}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}

              <Pressable
                onPress={() => setAddingTo(col.id)}
                style={[styles.fab, { backgroundColor: col.color, alignSelf: 'center', marginTop: 8 }]}
              >
                <PlusIcon size={17} color="#fff" />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <AddItemModal
        columnId={addingTo}
        onClose={() => setAddingTo(null)}
        onSave={(title, description, ownerId) => {
          if (!addingTo) return;
          addItem({ columnId: addingTo, title, description: description || undefined, ownerId });
          setAddingTo(null);
        }}
      />

      <NewColumnModal
        visible={newColumnOpen}
        onClose={() => setNewColumnOpen(false)}
        onSave={(title, color) => {
          addColumn({ title, color });
          setNewColumnOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

function AddItemModal({
  columnId,
  onClose,
  onSave,
}: {
  columnId: string | null;
  onClose: () => void;
  onSave: (title: string, description: string, ownerId: string | undefined) => void;
}) {
  const theme = useTheme();
  const family = useFamilyStore((s) => s.members);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState<string | undefined>(undefined);

  if (!columnId) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: theme.colors.panel }]}>
          <Text style={{ fontFamily: theme.fonts.head, fontSize: 17, color: theme.colors.ink, marginBottom: 14 }}>
            Add Item
          </Text>
          <TextInput
            placeholder="Title"
            placeholderTextColor={theme.colors.inkSoft}
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: theme.colors.fieldBg, color: theme.colors.ink }]}
          />
          <TextInput
            placeholder="Description (optional)"
            placeholderTextColor={theme.colors.inkSoft}
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { backgroundColor: theme.colors.fieldBg, color: theme.colors.ink }]}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {family.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setOwnerId(ownerId === m.id ? undefined : m.id)}
                style={[styles.personChip, { backgroundColor: ownerId === m.id ? m.color : theme.colors.fieldBg }]}
              >
                <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 12, color: ownerId === m.id ? '#fff' : theme.colors.ink }}>
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
              onPress={() => onSave(title.trim(), description.trim(), ownerId)}
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

function NewColumnModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, color: string) => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [color, setColor] = useState<string>(personColorOptions[0]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: theme.colors.panel }]}>
          <Text style={{ fontFamily: theme.fonts.head, fontSize: 17, color: theme.colors.ink, marginBottom: 14 }}>
            New Board
          </Text>
          <TextInput
            placeholder="Board name"
            placeholderTextColor={theme.colors.inkSoft}
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: theme.colors.fieldBg, color: theme.colors.ink }]}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
            {personColorOptions.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.swatch, { backgroundColor: c }, color === c && { borderWidth: 3, borderColor: theme.colors.ink }]}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={onClose} style={[styles.modalBtn, { backgroundColor: theme.colors.fieldBg }]}>
              <Text style={{ fontFamily: theme.fonts.headSemiBold, color: theme.colors.inkSoft }}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!title.trim()}
              onPress={() => onSave(title.trim(), color)}
              style={[styles.modalBtn, { backgroundColor: theme.colors.ink, opacity: title.trim() ? 1 : 0.4 }]}
            >
              <Text style={{ fontFamily: theme.fonts.headSemiBold, color: '#fff' }}>Create</Text>
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
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 10 },
  board: { paddingHorizontal: 24, paddingBottom: 24, gap: 18 },
  col: { width: 300, borderRadius: 22, padding: 16, gap: 10 },
  colHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 },
  itemCard: { flexDirection: 'row', gap: 10, borderRadius: 16, padding: 12 },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ownerTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  fab: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: '#00000050', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: 420, borderRadius: 24, padding: 22 },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, fontSize: 14 },
  personChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 14 },
  swatch: { width: 32, height: 32, borderRadius: 16 },
});
