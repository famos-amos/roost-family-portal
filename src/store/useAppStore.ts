import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { makeId } from '../lib/id';
import {
  seedBoardColumns,
  seedBoardItems,
  seedChores,
  seedEvents,
  seedFamily,
  seedMeals,
} from '../data/seed';
import {
  BoardColumn,
  BoardItem,
  CalendarEvent,
  Chore,
  DashboardWidgetLayout,
  FamilyMember,
  Meal,
  ThemePreference,
  WidgetId,
} from './types';

const storage = createJSONStorage(() => AsyncStorage);

// ---------------------------------------------------------------------------
// Family members
// ---------------------------------------------------------------------------
type FamilyState = {
  members: FamilyMember[];
  addMember: (m: Omit<FamilyMember, 'id'>) => string;
  updateMember: (id: string, patch: Partial<Omit<FamilyMember, 'id'>>) => void;
  removeMember: (id: string) => void;
};

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      members: seedFamily,
      addMember: (m) => {
        const id = makeId();
        set((s) => ({ members: [...s.members, { ...m, id }] }));
        return id;
      },
      updateMember: (id, patch) =>
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      removeMember: (id) =>
        set((s) => ({ members: s.members.filter((m) => m.id !== id) })),
    }),
    { name: 'roost.family', storage },
  ),
);

// ---------------------------------------------------------------------------
// Chores
// ---------------------------------------------------------------------------
type ChoresState = {
  chores: Chore[];
  addChore: (c: Omit<Chore, 'id' | 'done'>) => void;
  updateChore: (id: string, patch: Partial<Omit<Chore, 'id'>>) => void;
  toggleChore: (id: string) => void;
  claimChore: (id: string, assigneeId: string) => void;
  removeChore: (id: string) => void;
  resetWeek: () => void;
};

export const useChoresStore = create<ChoresState>()(
  persist(
    (set) => ({
      chores: seedChores,
      addChore: (c) =>
        set((s) => ({ chores: [...s.chores, { ...c, id: makeId(), done: false }] })),
      updateChore: (id, patch) =>
        set((s) => ({ chores: s.chores.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      toggleChore: (id) =>
        set((s) => ({
          chores: s.chores.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
        })),
      claimChore: (id, assigneeId) =>
        set((s) => ({
          chores: s.chores.map((c) => (c.id === id ? { ...c, assigneeId } : c)),
        })),
      removeChore: (id) => set((s) => ({ chores: s.chores.filter((c) => c.id !== id) })),
      resetWeek: () => set((s) => ({ chores: s.chores.map((c) => ({ ...c, done: false })) })),
    }),
    { name: 'roost.chores', storage },
  ),
);

// ---------------------------------------------------------------------------
// Meal plans
// ---------------------------------------------------------------------------
type MealsState = {
  meals: Meal[];
  upsertMeal: (m: Omit<Meal, 'id'> & { id?: string }) => void;
  removeMeal: (id: string) => void;
};

export const useMealsStore = create<MealsState>()(
  persist(
    (set) => ({
      meals: seedMeals,
      upsertMeal: (m) =>
        set((s) => {
          if (m.id) {
            return { meals: s.meals.map((x) => (x.id === m.id ? { ...x, ...m, id: m.id! } : x)) };
          }
          return { meals: [...s.meals, { ...m, id: makeId() }] };
        }),
      removeMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
    }),
    { name: 'roost.meals', storage },
  ),
);

// ---------------------------------------------------------------------------
// Boards (To-Do / Wishlist / Shopping List / custom)
// ---------------------------------------------------------------------------
type BoardsState = {
  columns: BoardColumn[];
  items: BoardItem[];
  addColumn: (c: Omit<BoardColumn, 'id'>) => void;
  removeColumn: (id: string) => void;
  addItem: (i: Omit<BoardItem, 'id' | 'done'>) => void;
  updateItem: (id: string, patch: Partial<Omit<BoardItem, 'id'>>) => void;
  toggleItem: (id: string) => void;
  removeItem: (id: string) => void;
};

export const useBoardsStore = create<BoardsState>()(
  persist(
    (set) => ({
      columns: seedBoardColumns,
      items: seedBoardItems,
      addColumn: (c) => set((s) => ({ columns: [...s.columns, { ...c, id: makeId() }] })),
      removeColumn: (id) =>
        set((s) => ({
          columns: s.columns.filter((c) => c.id !== id),
          items: s.items.filter((i) => i.columnId !== id),
        })),
      addItem: (i) => set((s) => ({ items: [...s.items, { ...i, id: makeId(), done: false }] })),
      updateItem: (id, patch) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      toggleItem: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
        })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
    }),
    { name: 'roost.boards', storage },
  ),
);

// ---------------------------------------------------------------------------
// Calendar events
// ---------------------------------------------------------------------------
type CalendarState = {
  events: CalendarEvent[];
  addEvent: (e: Omit<CalendarEvent, 'id' | 'source'>) => void;
  removeEvent: (id: string) => void;
  replaceSyncedEvents: (source: 'google' | 'apple', events: Omit<CalendarEvent, 'source'>[]) => void;
};

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: seedEvents,
      addEvent: (e) =>
        set((s) => ({ events: [...s.events, { ...e, id: makeId(), source: 'local' }] })),
      removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
      // Swaps out all previously-synced events from one source with a fresh
      // batch — called after a Google/Apple calendar sync round-trip.
      replaceSyncedEvents: (source, events) =>
        set((s) => ({
          events: [
            ...s.events.filter((e) => e.source !== source),
            ...events.map((e) => ({ ...e, source })),
          ],
        })),
    }),
    { name: 'roost.calendar', storage },
  ),
);

// ---------------------------------------------------------------------------
// Settings (theme, notifications, calendar visibility filter, sync status)
// ---------------------------------------------------------------------------
type SettingsState = {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;

  hiddenPersonIds: string[];
  togglePersonVisibility: (personId: string) => void;

  notifications: { chores: boolean; events: boolean; daily: boolean };
  setNotification: (key: 'chores' | 'events' | 'daily', value: boolean) => void;

  google: { connected: boolean; email?: string };
  setGoogleConnection: (connected: boolean, email?: string) => void;

  apple: { connected: boolean; appleId?: string };
  setAppleConnection: (connected: boolean, appleId?: string) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      hiddenPersonIds: [],
      togglePersonVisibility: (personId) =>
        set((s) => ({
          hiddenPersonIds: s.hiddenPersonIds.includes(personId)
            ? s.hiddenPersonIds.filter((id) => id !== personId)
            : [...s.hiddenPersonIds, personId],
        })),

      notifications: { chores: true, events: true, daily: false },
      setNotification: (key, value) =>
        set((s) => ({ notifications: { ...s.notifications, [key]: value } })),

      google: { connected: false },
      setGoogleConnection: (connected, email) => set({ google: { connected, email } }),

      apple: { connected: false },
      setAppleConnection: (connected, appleId) => set({ apple: { connected, appleId } }),
    }),
    { name: 'roost.settings', storage },
  ),
);

// ---------------------------------------------------------------------------
// Home dashboard layout (drag to reorder, resize)
// ---------------------------------------------------------------------------
const defaultLayout: DashboardWidgetLayout[] = [
  { id: 'calendar', order: 0, size: 'lg' },
  { id: 'events', order: 1, size: 'md' },
  { id: 'meal', order: 2, size: 'md' },
  { id: 'todo', order: 3, size: 'sm' },
  { id: 'challenge', order: 4, size: 'sm' },
  { id: 'verse', order: 5, size: 'sm' },
  { id: 'chores', order: 6, size: 'lg' },
];

type DashboardLayoutState = {
  layout: DashboardWidgetLayout[];
  reorder: (nextOrderIds: WidgetId[]) => void;
  setSize: (id: WidgetId, size: DashboardWidgetLayout['size']) => void;
  resetLayout: () => void;
};

// ---------------------------------------------------------------------------
// Daily challenge answer (resets each day)
// ---------------------------------------------------------------------------
type DailyState = {
  answeredDate: string | null;
  answer: 'A' | 'B' | null;
  setAnswer: (date: string, answer: 'A' | 'B') => void;
};

export const useDailyStore = create<DailyState>()(
  persist(
    (set) => ({
      answeredDate: null,
      answer: null,
      setAnswer: (date, answer) => set({ answeredDate: date, answer }),
    }),
    { name: 'roost.daily', storage },
  ),
);

export const useDashboardLayoutStore = create<DashboardLayoutState>()(
  persist(
    (set) => ({
      layout: defaultLayout,
      reorder: (nextOrderIds) =>
        set((s) => ({
          layout: nextOrderIds.map((id, order) => {
            const existing = s.layout.find((w) => w.id === id)!;
            return { ...existing, order };
          }),
        })),
      setSize: (id, size) =>
        set((s) => ({ layout: s.layout.map((w) => (w.id === id ? { ...w, size } : w)) })),
      resetLayout: () => set({ layout: defaultLayout }),
    }),
    { name: 'roost.dashboardLayout', storage },
  ),
);
