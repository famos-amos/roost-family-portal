// react-native-web's Alert.alert() is a documented no-op (it does nothing —
// no window.alert/confirm fallback), so every confirm/delete/notify dialog
// in the app needs a web-safe path or it silently does nothing on the web
// build. These two helpers are the cross-platform replacement for
// `Alert.alert(...)` wherever the app needs to confirm a destructive action
// or show a simple heads-up message.
import { Alert, Platform } from 'react-native';

/** A Cancel/Confirm dialog. Calls `onConfirm` only if the user confirms. */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  opts?: { destructive?: boolean },
) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: opts?.destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

/** A simple heads-up message with a single acknowledgement. */
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
