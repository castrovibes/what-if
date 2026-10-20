import React, { useState } from 'react';
import { Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useSurface, PINK } from '../../ui/surface';
import { Card, ListRow, Dot, BottomSheet, SheetOption, SectionLabel } from '../../ui/components';
import { comingSoon } from '../../ui/comingSoon';
import { haptic } from '../../ui/haptics';
import { useActiveContext } from '../../providers/ActiveContextProvider';
import { ageGroups, findAgeGroup } from '../../data/ageGroups';
import { useTtsEnabled } from '../../hooks/useTtsEnabled';

const ageLabel = (label: string) => label.replace('-', ' – ');

/** Preferred age range, Listen (text-to-speech), dark mode, and the not-yet rows. */
export const PreferencesCard = () => {
  const { activeContext, setPreferredAgeGroup } = useActiveContext();
  const preferredAge = findAgeGroup(activeContext.ageGroupDefault);
  const [ageSheetOpen, setAgeSheetOpen] = useState(false);
  const { isDark, colors, toggleDarkMode } = useTheme();
  const surface = useSurface();
  const [ttsEnabled, setTtsEnabled] = useTtsEnabled();
  const track = { false: colors.switchTrackFalse, true: PINK };

  return (
    <>
      <SectionLabel>Preferences</SectionLabel>
      <Card padded={false}>
        <ListRow
          icon="users"
          iconColor={surface.accent}
          label="Preferred age range"
          detail={preferredAge ? `${ageLabel(preferredAge.label)} · the deck opens on a prompt` : 'Ask each time'}
          onPress={() => setAgeSheetOpen(true)}
        />
        <ListRow
          icon="volume-2"
          label="Listen (text-to-speech)"
          detail="Shows Listen on prompt cards"
          right={<Switch value={ttsEnabled} onValueChange={setTtsEnabled} trackColor={track} thumbColor="#fff" />}
        />
        <ListRow
          icon="moon"
          label="Dark mode"
          right={<Switch value={isDark} onValueChange={toggleDarkMode} trackColor={track} thumbColor="#fff" />}
        />
        <ListRow
          icon="bell"
          label="Notifications"
          detail="Coming soon"
          right={<Switch value={false} disabled trackColor={track} thumbColor="#fff" />}
        />
        <ListRow
          icon="globe"
          label="Language"
          detail="English · more coming soon"
          onPress={() => comingSoon('Other languages')}
          last
        />
      </Card>

      <BottomSheet visible={ageSheetOpen} title="Preferred age range" onClose={() => setAgeSheetOpen(false)}>
        <SheetOption
          label="Ask each time"
          selected={!preferredAge}
          leading={<Feather name="help-circle" size={16} color={colors.iconDefault} />}
          onPress={() => {
            haptic.selection();
            setPreferredAgeGroup(null);
            setAgeSheetOpen(false);
          }}
        />
        {ageGroups.map(g => (
          <SheetOption
            key={g.id}
            label={ageLabel(g.label)}
            selected={g.id === preferredAge?.id}
            leading={<Dot color={g.bgColor} />}
            onPress={() => {
              haptic.selection();
              setPreferredAgeGroup(g.id);
              setAgeSheetOpen(false);
            }}
          />
        ))}
      </BottomSheet>
    </>
  );
};
