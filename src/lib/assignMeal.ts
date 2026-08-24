// Shared "schedule this meal name into a day/slot" logic used by the
// Suggestions and Recipes screens — looks up whatever's already in that
// slot and confirms before overwriting it, otherwise just adds fresh.
import { DayOfWeek, Meal, MealSlotType } from '../store/types';
import { confirmAction } from './alerts';

export function assignMealToPlan({
  meals,
  upsertMeal,
  name,
  day,
  slot,
  chefId = null,
}: {
  meals: Meal[];
  upsertMeal: (m: Omit<Meal, 'id'> & { id?: string }) => void;
  name: string;
  day: DayOfWeek;
  slot: MealSlotType;
  chefId?: string | null;
}) {
  const existing = meals.find((m) => m.day === day && m.slot === slot);
  const dayLabel = day[0].toUpperCase() + day.slice(1);
  const slotLabel = slot[0].toUpperCase() + slot.slice(1);

  const doAssign = () => {
    upsertMeal({ id: existing?.id, day, slot, name, chefId: existing?.chefId ?? chefId });
  };

  if (existing && existing.name !== name) {
    confirmAction(
      `Replace ${slotLabel.toLowerCase()} on ${dayLabel}?`,
      `"${existing.name}" is already planned — swap it for "${name}"?`,
      'Replace',
      doAssign,
    );
    return;
  }
  doAssign();
}
