import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TopBar } from '../components/TopBar';
import { Avatar } from '../components/Avatar';
import { useTheme } from '../theme/ThemeProvider';
import { PrimaryButton, SegmentedControl, Switch } from '../components/ui';
import { EditIcon, PlusIcon, TrashIcon } from '../components/icons';
import { useFamilyStore, useCalendarStore, useSettingsStore } from '../store/useAppStore';
import { personColorOptions } from '../theme/colors';
import { FamilyMember, ThemePreference } from '../store/types';
import {
  exchangeGoogleCode,
  fetchGoogleEvents,
  isGoogleConfigured,
  useGoogleAuthRequest,
} from '../lib/googleCalendar';
import {
  AppleCredentials,
  clearAppleCredentials,
  discoverCalendarHome,
  fetchAppleEvents,
  loadAppleCredentials,
  saveAppleCredentials,
} from '../lib/appleCalendar';

type SectionId = 'family' | 'appearance' | 'calendars' | 'notifications' | 'about';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'family', label: 'Family Members' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'calendars', label: 'Connected Calendars' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'about', label: 'About' },
];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SettingsScreen() {
  const theme = useTheme();
  const [section, setSection] = useState<SectionId>('family');

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.bg }]}>
      <TopBar />
      <View style={styles.body}>
        <View style={[styles.sidebar, { backgroundColor: theme.colors.panel }]}>
          {SECTIONS.map((s) => {
            const active = s.id === section;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSection(s.id)}
                style={[
                  styles.sideItem,
                  active && { backgroundColor: theme.isDark ? '#FFFFFF14' : theme.colors.fieldBg },
                ]}
              >
                <Text
                  style={{
                    fontFamily: active ? theme.fonts.headSemiBold : theme.fonts.bodySemiBold,
                    fontSize: 14,
                    color: active ? theme.colors.ink : theme.colors.inkSoft,
                  }}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView style={styles.detail} contentContainerStyle={styles.detailContent}>
          {section === 'family' && <FamilyMembersSection />}
          {section === 'appearance' && <AppearanceSection />}
          {section === 'calendars' && <ConnectedCalendarsSection />}
          {section === 'notifications' && <NotificationsSection />}
          {section === 'about' && <AboutSection />}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Family Members
// ---------------------------------------------------------------------------
function FamilyMembersSection() {
  const theme = useTheme();
  const members = useFamilyStore((s) => s.members);
  const updateMember = useFamilyStore((s) => s.updateMember);
  const removeMember = useFamilyStore((s) => s.removeMember);
  const addMember = useFamilyStore((s) => s.addMember);

  return (
    <View>
      <Text style={[styles.h1, { fontFamily: theme.fonts.head, color: theme.colors.ink }]}>Family Members</Text>
      <Text style={[styles.sub, { fontFamily: theme.fonts.body, color: theme.colors.inkSoft }]}>
        Names, birthdays and colors here are used across the calendar, chores and meal plans instead of showing
        anyone's real name to us.
      </Text>

      {members.map((m) => (
        <MemberRow
          key={m.id}
          member={m}
          onChange={(patch) => updateMember(m.id, patch)}
          onRemove={() =>
            Alert.alert('Remove family member?', `This will remove "${m.name}" and unassign their items.`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => removeMember(m.id) },
            ])
          }
        />
      ))}

      <PrimaryButton
        label="Add Family Member"
        color={theme.colors.ink}
        icon={<PlusIcon size={15} color="#fff" />}
        onPress={() => {
          const name = 'New Member';
          addMember({
            name,
            initials: initialsFor(name),
            color: personColorOptions[members.length % personColorOptions.length],
            birthday: undefined,
          });
        }}
      />
    </View>
  );
}

function MemberRow({
  member,
  onChange,
  onRemove,
}: {
  member: FamilyMember;
  onChange: (patch: Partial<Omit<FamilyMember, 'id'>>) => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [birthday, setBirthday] = useState(member.birthday ?? '');

  useEffect(() => {
    setName(member.name);
    setBirthday(member.birthday ?? '');
  }, [member.name, member.birthday]);

  const commit = () => {
    const trimmedName = name.trim() || member.name;
    onChange({ name: trimmedName, initials: initialsFor(trimmedName), birthday: birthday.trim() || undefined });
    setEditing(false);
  };

  return (
    <View style={[styles.memberCard, { backgroundColor: theme.colors.fieldBg }]}>
      <Avatar initials={member.initials} color={member.color} size={40} />

      <View style={{ flex: 1, gap: 6 }}>
        {editing ? (
          <>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={theme.colors.inkSoft}
              style={[styles.input, { backgroundColor: theme.colors.panel, color: theme.colors.ink }]}
            />
            <TextInput
              value={birthday}
              onChangeText={setBirthday}
              placeholder="Birthday (YYYY-MM-DD)"
              placeholderTextColor={theme.colors.inkSoft}
              style={[styles.input, { backgroundColor: theme.colors.panel, color: theme.colors.ink }]}
            />
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {personColorOptions.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => onChange({ color: c })}
                  style={[
                    styles.swatch,
                    { backgroundColor: c },
                    member.color === c && { borderWidth: 3, borderColor: theme.colors.ink },
                  ]}
                />
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 15, color: theme.colors.ink }}>
              {member.name}
            </Text>
            <Text style={{ fontFamily: theme.fonts.body, fontSize: 12.5, color: theme.colors.inkSoft }}>
              {member.birthday ? `Birthday: ${member.birthday}` : 'No birthday set'}
            </Text>
          </>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => (editing ? commit() : setEditing(true))}
          style={[styles.iconBtn, { backgroundColor: theme.colors.panel }]}
        >
          {editing ? (
            <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 12, color: theme.colors.success }}>
              Save
            </Text>
          ) : (
            <EditIcon size={16} color={theme.colors.inkSoft} />
          )}
        </Pressable>
        <Pressable onPress={onRemove} style={[styles.iconBtn, { backgroundColor: theme.colors.panel }]}>
          <TrashIcon size={16} color={theme.colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Appearance
// ---------------------------------------------------------------------------
function AppearanceSection() {
  const theme = useTheme();
  const themePreference = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <View>
      <Text style={[styles.h1, { fontFamily: theme.fonts.head, color: theme.colors.ink }]}>Appearance</Text>
      <Text style={[styles.sub, { fontFamily: theme.fonts.body, color: theme.colors.inkSoft }]}>
        Choose how Roost looks on this tablet.
      </Text>
      <View style={{ maxWidth: 420, marginTop: 6 }}>
        <SegmentedControl<ThemePreference>
          value={themePreference}
          onChange={setTheme}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Connected Calendars
// ---------------------------------------------------------------------------
function ConnectedCalendarsSection() {
  const theme = useTheme();
  const google = useSettingsStore((s) => s.google);
  const setGoogleConnection = useSettingsStore((s) => s.setGoogleConnection);
  const apple = useSettingsStore((s) => s.apple);
  const setAppleConnection = useSettingsStore((s) => s.setAppleConnection);
  const replaceSyncedEvents = useCalendarStore((s) => s.replaceSyncedEvents);

  const googleConfigured = useMemo(() => isGoogleConfigured(), []);
  const [request, response, promptAsync] = useGoogleAuthRequest();
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (response?.type === 'success' && request) {
        setGoogleBusy(true);
        try {
          const { accessToken } = await exchangeGoogleCode(
            response.params.code,
            request.codeVerifier ?? '',
            request.redirectUri,
          );
          const events = await fetchGoogleEvents(accessToken);
          replaceSyncedEvents('google', events);
          setGoogleConnection(true);
          Alert.alert('Google Calendar connected', `Synced ${events.length} upcoming event(s).`);
        } catch (err: any) {
          Alert.alert('Google Calendar sync failed', String(err?.message ?? err));
        } finally {
          setGoogleBusy(false);
        }
      } else if (response?.type === 'error') {
        Alert.alert('Google sign-in failed', response.error?.message ?? 'Please try again.');
      }
    })();
  }, [response]);

  const [appleId, setAppleId] = useState('');
  const [applePassword, setApplePassword] = useState('');
  const [appleBusy, setAppleBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await loadAppleCredentials();
      if (saved) setAppleId(saved.appleId);
    })();
  }, []);

  const connectApple = async () => {
    if (!appleId.trim() || !applePassword.trim()) {
      Alert.alert('Missing info', 'Enter your Apple ID and an app-specific password.');
      return;
    }
    const creds: AppleCredentials = { appleId: appleId.trim(), appSpecificPassword: applePassword.trim() };
    setAppleBusy(true);
    try {
      await saveAppleCredentials(creds);
      const home = await discoverCalendarHome(creds);
      const events = await fetchAppleEvents(creds, home);
      replaceSyncedEvents('apple', events);
      setAppleConnection(true, creds.appleId);
      setApplePassword('');
      Alert.alert('Apple Calendar connected', `Synced ${events.length} upcoming event(s).`);
    } catch (err: any) {
      Alert.alert(
        'Apple Calendar sync failed',
        `${String(err?.message ?? err)}\n\nApple/iCloud sync is a first draft and hasn't been verified against a real Apple ID yet — see README.md.`,
      );
    } finally {
      setAppleBusy(false);
    }
  };

  const disconnectApple = async () => {
    await clearAppleCredentials();
    setAppleConnection(false);
    setApplePassword('');
  };

  return (
    <View>
      <Text style={[styles.h1, { fontFamily: theme.fonts.head, color: theme.colors.ink }]}>Connected Calendars</Text>
      <Text style={[styles.sub, { fontFamily: theme.fonts.body, color: theme.colors.inkSoft }]}>
        Two-way sync keeps Roost's calendar and your family's Google/Apple calendars matching.
      </Text>

      {/* Google */}
      <View style={[styles.calendarCard, { backgroundColor: theme.colors.fieldBg }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 15, color: theme.colors.ink }}>
            Google Calendar
          </Text>
          <Text style={{ fontFamily: theme.fonts.body, fontSize: 12.5, color: theme.colors.inkSoft, marginTop: 2 }}>
            {!googleConfigured
              ? 'Needs a Google Cloud OAuth Client ID — see README.md "Google Calendar setup".'
              : google.connected
              ? `Connected${google.email ? ` as ${google.email}` : ''}.`
              : 'Not connected yet.'}
          </Text>
        </View>
        {googleConfigured ? (
          <PrimaryButton
            label={googleBusy ? 'Syncing…' : google.connected ? 'Sync Now' : 'Connect'}
            color={theme.colors.calDk}
            onPress={() => (google.connected ? promptAsync() : promptAsync())}
          />
        ) : (
          <View style={[styles.disabledPill, { backgroundColor: theme.colors.border }]}>
            <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 12, color: theme.colors.inkSoft }}>
              Setup required
            </Text>
          </View>
        )}
      </View>

      {/* Apple */}
      <View style={[styles.calendarCard, { flexDirection: 'column', alignItems: 'stretch', backgroundColor: theme.colors.fieldBg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 15, color: theme.colors.ink }}>
              Apple / iCloud Calendar
            </Text>
            <Text style={{ fontFamily: theme.fonts.body, fontSize: 12.5, color: theme.colors.inkSoft, marginTop: 2 }}>
              {Platform.OS === 'web'
                ? "Not available in the web version — iCloud's servers block browser requests (CORS). Use the tablet's Expo Go / installed app build instead."
                : apple.connected
                ? `Connected as ${apple.appleId}.`
                : 'Sign in with an app-specific password.'}
            </Text>
          </View>
          {apple.connected && Platform.OS !== 'web' && (
            <PrimaryButton label="Disconnect" color={theme.colors.danger} onPress={disconnectApple} />
          )}
        </View>

        {!apple.connected && Platform.OS !== 'web' && (
          <View style={{ marginTop: 12, gap: 8 }}>
            <TextInput
              value={appleId}
              onChangeText={setAppleId}
              placeholder="Apple ID email"
              autoCapitalize="none"
              placeholderTextColor={theme.colors.inkSoft}
              style={[styles.input, { backgroundColor: theme.colors.panel, color: theme.colors.ink }]}
            />
            <TextInput
              value={applePassword}
              onChangeText={setApplePassword}
              placeholder="App-specific password"
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={theme.colors.inkSoft}
              style={[styles.input, { backgroundColor: theme.colors.panel, color: theme.colors.ink }]}
            />
            <Text style={{ fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.inkSoft }}>
              Generate one at appleid.apple.com → Sign-In and Security → App-Specific Passwords. Never use your
              real Apple ID password here.
            </Text>
            <PrimaryButton
              label={appleBusy ? 'Connecting…' : 'Connect'}
              color={theme.colors.ink}
              onPress={connectApple}
            />
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
function NotificationsSection() {
  const theme = useTheme();
  const notifications = useSettingsStore((s) => s.notifications);
  const setNotification = useSettingsStore((s) => s.setNotification);

  const rows: { key: 'chores' | 'events' | 'daily'; label: string; desc: string }[] = [
    { key: 'chores', label: 'Chore reminders', desc: 'Nudge when a chore is due or newly assigned.' },
    { key: 'events', label: 'Calendar events', desc: 'Alerts for upcoming family events.' },
    { key: 'daily', label: 'Daily Challenge & Verse', desc: 'A morning nudge for the daily card on the dashboard.' },
  ];

  return (
    <View>
      <Text style={[styles.h1, { fontFamily: theme.fonts.head, color: theme.colors.ink }]}>Notifications</Text>
      {rows.map((r) => (
        <View key={r.key} style={[styles.notifRow, { backgroundColor: theme.colors.fieldBg }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: theme.fonts.headSemiBold, fontSize: 14.5, color: theme.colors.ink }}>
              {r.label}
            </Text>
            <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.inkSoft, marginTop: 2 }}>
              {r.desc}
            </Text>
          </View>
          <Switch value={notifications[r.key]} onValueChange={(v) => setNotification(r.key, v)} />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------
function AboutSection() {
  const theme = useTheme();
  return (
    <View>
      <Text style={[styles.h1, { fontFamily: theme.fonts.head, color: theme.colors.ink }]}>About Roost</Text>
      <Text style={[styles.sub, { fontFamily: theme.fonts.body, color: theme.colors.inkSoft }]}>
        Roost is a shared family dashboard for a wall-mounted tablet: calendar, chores, meal plans and family
        boards in one warm, playful home screen.
      </Text>
      <Text style={{ fontFamily: theme.fonts.body, fontSize: 12.5, color: theme.colors.inkSoft, marginTop: 10 }}>
        Version 0.1.0 (local build)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, flexDirection: 'row', paddingHorizontal: 24, gap: 18, paddingBottom: 24 },
  sidebar: { width: 210, borderRadius: 20, padding: 10, gap: 4 },
  sideItem: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12 },
  detail: { flex: 1 },
  detailContent: { paddingBottom: 40, gap: 4 },
  h1: { fontSize: 20, marginBottom: 6 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: 16, maxWidth: 560 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13.5 },
  swatch: { width: 26, height: 26, borderRadius: 13 },
  iconBtn: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  calendarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  disabledPill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
});
