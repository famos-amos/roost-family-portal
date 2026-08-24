import React, { useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { useCalendarStore, useFamilyStore, useSettingsStore } from '../store/useAppStore';
import { buildMonthGrid, formatMonthTitle, todayIso } from '../lib/date';
import { CalendarIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../components/icons';
import { PrimaryButton, SegmentedControl } from '../components/ui';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarScreen() {
  const theme = useTheme();
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());

  const events = useCalendarStore((s) => s.events);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const removeEvent = useCalendarStore((s) => s.removeEvent);
  const family = useFamilyStore((s) => s.members);
  const hidden = useSettingsStore((s) => s.hiddenPersonIds);
  const toggleVisibility = useSettingsStore((s) => s.togglePersonVisibility);

  const grid = useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor.getFullYear(), cursor.getMonth()],
  );

  const visibleEvents = events.filter((e) => !e.personId || !hidden.includes(e.personId));

  const today = todayIso();
  const todayIdx = grid.findIndex((g) => g.date.toISOString().slice(0, 10) === today);
  const days =
    view === 'month'
      ? grid
      : view === 'week'
      ? grid.slice(Math.floor(Math.max(todayIdx, 0) / 7) * 7, Math.floor(Math.max(todayIdx, 0) / 7) * 7 + 7)
      : grid.filter((d) => d.date.toISOString().slice(0, 10) === today);

  const changeMonth = (delta: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  const anyHidden = family.some((m) => hidden.includes(m.id));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.bg }]}>
      <TopBar />
      <View style={styles.toolbar}>
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
        />
        <View style={styles.monthTitle}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <ChevronLeftIcon size={13} color={theme.colors.ink} />
          </Pressable>
          <Text style={{ fontFamily: theme.fonts.head, fontSize: 20, color: theme.colors.ink }}>
            {formatMonthTitle(cursor)}
          </Text>
          <Pressable onPress={() => changeMonth(1)} style={styles.navBtn}>
            <ChevronRightIcon size={13} color={theme.colors.ink} />
          </Pressable>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.legend}>
          {family.map((m) => {
            const on = !hidden.includes(m.id);
            return (
              <Pressable
                key={m.id}
                onPress={() => toggleVisibility(m.id)}
                style={[
                  styles.legendChip,
                  { backgroundColor: on ? (theme.isDark ? '#FFFFFF14' : '#FFFFFFB0') : 'transparent', opacity: on ? 1 : 0.45 },
                ]}
              >
                <View style={[styles.legendBox, on && { backgroundColor: m.color, borderColor: 'transparent' }]}>
                  {on && <CheckIcon size={10} color="#fff" />}
                </View>
                <Text
                  style={{
                    fontFamily: theme.fonts.headSemiBold,
                    fontSize: 12.5,
                    color: theme.colors.ink,
                    textDecorationLine: on ? 'none' : 'line-through',
                  }}
                >
                  {m.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <PrimaryButton
          label="Add Event"
          color={theme.colors.calDk}
          icon={<PlusIcon size={15} color="#fff" />}
          onPress={() => {
            setSelectedDate(today);
            setModalOpen(true);
          }}
        />
      </View>

      {anyHidden && (
        <Text style={[styles.filterHint, { color: theme.colors.inkSoft, fontFamily: theme.fonts.bodyBold }]}>
          Tap a name above to show or hide their events — some calendars are hidden right now.
        </Text>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.gridWrap}>
        <View style={[styles.gridCard, { backgroundColor: theme.colors.panel }]}>
          {view !== 'day' && (
            <View style={styles.dowRow}>
              {DOW.map((d) => (
                <Text key={d} style={[styles.dow, { color: theme.colors.inkSoft, fontFamily: theme.fonts.headSemiBold }]}>
                  {d}
                </Text>
              ))}
            </View>
          )}
          <View style={[styles.monthGrid, view === 'day' && { flexWrap: 'nowrap' }]}>
            {days.map(({ date, inMonth }, i) => {
              const iso = date.toISOString().slice(0, 10);
              const isToday = iso === today;
              const dayEvents = visibleEvents.filter((e) => e.date === iso);
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    setSelectedDate(iso);
                    setModalOpen(true);
                  }}
                  style={[
                    styles.dayCell,
                    view === 'day' && { width: '100%', aspectRatio: undefined, minHeight: 300 },
                    { backgroundColor: theme.isDark ? '#FFFFFF08' : '#FBF7EF' },
                    isToday && { backgroundColor: theme.colors.calBg, borderWidth: 2, borderColor: theme.colors.cal },
                    !inMonth && view === 'month' && { opacity: 0.4 },
                  ]}
                >
                  <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 13, color: theme.colors.ink }}>
                    {date.getDate()}
                  </Text>
                  {dayEvents.slice(0, view === 'day' ? 20 : 3).map((e) => {
                    const person = family.find((m) => m.id === e.personId);
                    return (
                      <Pressable
                        key={e.id}
                        onLongPress={() => removeEvent(e.id)}
                        style={[
                          styles.chip,
                          { backgroundColor: (person?.color ?? theme.colors.inkSoft) + '30' },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 9.5, fontFamily: theme.fonts.bodyBold, color: person?.color ?? theme.colors.ink }}
                        >
                          {e.time ? `${e.time} ` : ''}
                          {e.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {dayEvents.length > 3 && view !== 'day' && (
                    <Text style={{ fontSize: 9, fontFamily: theme.fonts.bodyBold, color: theme.colors.inkSoft }}>
                      +{dayEvents.length - 3} more
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <AddEventModal
        visible={modalOpen}
        date={selectedDate}
        onClose={() => setModalOpen(false)}
        onSave={(title, time, personId) => {
          addEvent({ date: selectedDate, title, time: time || undefined, personId });
          setModalOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

function AddEventModal({
  visible,
  date,
  onClose,
  onSave,
}: {
  visible: boolean;
  date: string;
  onClose: () => void;
  onSave: (title: string, time: string, personId: string | null) => void;
}) {
  const theme = useTheme();
  const family = useFamilyStore((s) => s.members);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [personId, setPersonId] = useState<string | null>(null);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: theme.colors.panel }]}>
          <Text style={{ fontFamily: theme.fonts.head, fontSize: 17, color: theme.colors.ink, marginBottom: 4 }}>
            Add Event
          </Text>
          <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 12, color: theme.colors.inkSoft, marginBottom: 14 }}>
            {date}
          </Text>

          <TextInput
            placeholder="Event title"
            placeholderTextColor={theme.colors.inkSoft}
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: theme.colors.fieldBg, color: theme.colors.ink }]}
          />
          <TextInput
            placeholder="Time (optional), e.g. 3:30 PM"
            placeholderTextColor={theme.colors.inkSoft}
            value={time}
            onChangeText={setTime}
            style={[styles.input, { backgroundColor: theme.colors.fieldBg, color: theme.colors.ink }]}
          />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {family.map((m) => {
              const active = personId === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setPersonId(active ? null : m.id)}
                  style={[
                    styles.personChip,
                    { backgroundColor: active ? m.color : theme.colors.fieldBg },
                  ]}
                >
                  <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 12, color: active ? '#fff' : theme.colors.ink }}>
                    {m.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={onClose} style={[styles.modalBtn, { backgroundColor: theme.colors.fieldBg }]}>
              <Text style={{ fontFamily: theme.fonts.headSemiBold, color: theme.colors.inkSoft }}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!title.trim()}
              onPress={() => onSave(title.trim(), time.trim(), personId)}
              style={[styles.modalBtn, { backgroundColor: theme.colors.ink, opacity: title.trim() ? 1 : 0.4 }]}
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
  // Without an explicit flex here, the ScrollView has no bounded height on
  // web (react-native-web needs a flex child with minHeight:0 to know it's
  // allowed to scroll internally instead of just growing past the screen).
  scroll: { flex: 1, minHeight: 0 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingBottom: 10, flexWrap: 'wrap' },
  monthTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffffffb0', alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  legendChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  legendBox: { width: 15, height: 15, borderRadius: 5, borderWidth: 2, borderColor: '#00000022', alignItems: 'center', justifyContent: 'center' },
  filterHint: { fontSize: 11.5, paddingHorizontal: 24, marginBottom: 8 },
  gridWrap: { paddingHorizontal: 24, paddingBottom: 24 },
  gridCard: { borderRadius: 22, padding: 14 },
  dowRow: { flexDirection: 'row', marginBottom: 6 },
  dow: { flex: 1, textAlign: 'center', fontSize: 12 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, borderRadius: 10, padding: 5, marginBottom: 0 },
  chip: { borderRadius: 6, paddingHorizontal: 4, paddingVertical: 2, marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: '#00000050', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: 420, borderRadius: 24, padding: 22 },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, fontSize: 14 },
  personChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 14 },
});
