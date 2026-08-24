// Starter recipe library — a small curated set so Recipes and Suggestions
// have real content on first launch. Fully editable feel isn't wired up yet
// (no "add your own recipe" UI), but every recipe here can be sent straight
// to the meal planner from Recipes or Suggestions.
import { MealSlotType } from '../store/types';

export type Recipe = {
  id: string;
  name: string;
  slot: MealSlotType;
  time: string;
  ingredients: string[];
  steps: string[];
};

export const seedRecipes: Recipe[] = [
  {
    id: 'r1',
    name: 'Spaghetti & Meatballs',
    slot: 'dinner',
    time: '40 min',
    ingredients: ['1 lb ground beef', 'Spaghetti', 'Marinara sauce', 'Breadcrumbs', '1 egg', 'Parmesan'],
    steps: [
      'Mix ground beef, breadcrumbs, egg, and a handful of parmesan; roll into meatballs.',
      'Brown meatballs in a hot pan, then simmer in marinara sauce for 20 minutes.',
      'Boil spaghetti according to package directions.',
      'Serve meatballs and sauce over spaghetti, topped with extra parmesan.',
    ],
  },
  {
    id: 'r2',
    name: 'Sheet-Pan Fajitas',
    slot: 'dinner',
    time: '30 min',
    ingredients: ['Chicken breast, sliced', 'Bell peppers', 'Onion', 'Fajita seasoning', 'Tortillas'],
    steps: [
      'Toss sliced chicken, peppers, and onion with fajita seasoning and oil.',
      'Spread on a sheet pan and roast at 425°F for 18-20 minutes.',
      'Warm tortillas and serve with the chicken and veggies, plus your favorite toppings.',
    ],
  },
  {
    id: 'r3',
    name: 'Veggie Fried Rice',
    slot: 'dinner',
    time: '20 min',
    ingredients: ['Cooked rice (day-old is best)', 'Frozen peas & carrots', '2 eggs', 'Soy sauce', 'Green onion'],
    steps: [
      'Scramble eggs in a hot wok or pan, then set aside.',
      'Stir-fry peas and carrots for 2-3 minutes.',
      'Add rice, breaking up clumps, and stir-fry until heated through.',
      'Stir in soy sauce and eggs, top with sliced green onion.',
    ],
  },
  {
    id: 'r4',
    name: 'Overnight Oats',
    slot: 'breakfast',
    time: '5 min (+overnight)',
    ingredients: ['Rolled oats', 'Milk', 'Yogurt', 'Honey', 'Fruit of choice'],
    steps: [
      'Combine oats, milk, yogurt, and honey in a jar.',
      'Refrigerate overnight.',
      'Top with fresh fruit before serving.',
    ],
  },
  {
    id: 'r5',
    name: 'Turkey Club Wraps',
    slot: 'lunch',
    time: '15 min',
    ingredients: ['Tortillas', 'Sliced turkey', 'Bacon', 'Lettuce', 'Tomato', 'Mayo'],
    steps: [
      'Lay out tortillas and spread with mayo.',
      'Layer turkey, bacon, lettuce, and tomato.',
      'Roll tightly and slice in half to serve.',
    ],
  },
  {
    id: 'r6',
    name: 'Homemade Pizza Night',
    slot: 'dinner',
    time: '35 min',
    ingredients: ['Pizza dough', 'Marinara sauce', 'Mozzarella', 'Toppings of choice'],
    steps: [
      'Stretch dough onto a floured pan or pizza stone.',
      'Spread sauce, then cheese and toppings.',
      'Bake at 475°F for 12-15 minutes, until the crust is golden.',
    ],
  },
];
