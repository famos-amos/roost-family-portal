export type RootStackParamList = {
  Home: undefined;
  Calendar: undefined;
  Chores: undefined;
  MealPlans: undefined;
  Boards: undefined;
  Settings: undefined;
};

// Lets `useNavigation()` calls infer route names/params without passing a
// generic everywhere.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
