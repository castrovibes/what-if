import React, { useEffect, useState } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { ModuleRepo, Module } from '../db/repositories/modules';
import { PromptsStackParamList } from '../navigation/types';
import { Screen, ScreenHeader, ScreenScroll } from '../ui/components';
import { SeriesCard } from '../components/SeriesCard';

export const ModulesScreen = () => {
  const navigation = useNavigation<NavigationProp<PromptsStackParamList>>();
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    ModuleRepo.list().then(setModules);
  }, []);

  return (
    <Screen>
      <ScreenHeader
        title="Conversation Series"
        subtitle="Curated multi-prompt journeys with a theme."
        onBack={() => navigation.goBack()}
      />
      <ScreenScroll>
        {modules.map(m => (
          <SeriesCard
            key={m.id}
            module={m}
            onPress={() => navigation.navigate('ModuleDetail', { moduleId: m.id })}
          />
        ))}
      </ScreenScroll>
    </Screen>
  );
};
