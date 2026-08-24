import {
  useFonts as useQuicksandFonts,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

/** Loads the Warm & Playful type system. Returns `true` once fonts are ready. */
export function useAppFonts(): boolean {
  const [loaded] = useQuicksandFonts({
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  return loaded;
}
