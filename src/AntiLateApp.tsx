import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';

import { ScreenTransition } from './components/motion/screen-transition';
import { StorageErrorModal } from './components/storage-error-modal';
import { useEvents } from './hooks/useEvents';
import { useGroups } from './hooks/use-groups';
import { useNotifications } from './hooks/use-notifications';
import { useTemplates } from './hooks/use-templates';
import { AppearanceScreen } from './screens/appearance-screen';
import { AboutScreen } from './screens/about-screen';
import { AlarmScreen } from './screens/alarm-screen';
import { EventFormScreen } from './screens/EventFormScreen';
import { GroupsScreen } from './screens/groups-screen';
import { HomeScreen } from './screens/HomeScreen';
import { NotificationsScreen } from './screens/notifications-screen';
import { SettingsScreen } from './screens/settings-screen';
import {
  TemplateFormScreen,
  type TemplateFormDraft,
} from './screens/template-form-screen';
import { TemplatesScreen } from './screens/templates-screen';
import type { PlannedEvent } from './types/event';
import type { Group } from './types/group';

type AppScreen =
  | 'home'
  | 'add'
  | 'edit'
  | 'settings'
  | 'groups'
  | 'templates'
  | 'notifications'
  | 'template-add'
  | 'template-edit'
  | 'appearance'
  | 'about';

export function AntiLateApp() {
  const {
    groups,
    isHydrated: areGroupsHydrated,
    setGroups,
    storage: groupStorage,
  } = useGroups();
  const {
    addEvent,
    deleteEvent,
    events,
    isHydrated: areEventsHydrated,
    unassignDeletedGroups,
    updateEvent,
    storage: eventStorage,
  } = useEvents();
  const {
    addTemplate,
    deleteTemplate,
    isHydrated: areTemplatesHydrated,
    templates,
    unassignDeletedGroups: unassignDeletedTemplateGroups,
    updateTemplate,
    storage: templateStorage,
  } = useTemplates();
  const [screen, setScreen] = useState<AppScreen>('home');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [templateReturnScreen, setTemplateReturnScreen] = useState<
    'home' | 'templates'
  >('templates');
  const [notificationsReturnScreen, setNotificationsReturnScreen] = useState<
    'home' | 'settings'
  >('settings');
  const notificationController = useNotifications({
    events,
    templates,
    isHydrated: areEventsHydrated && areGroupsHydrated && areTemplatesHydrated,
  });
  const notificationsReady =
    notificationController.capabilities.supported &&
    notificationController.capabilities.notificationsEnabled &&
    notificationController.capabilities.exactAlarmsEnabled &&
    notificationController.capabilities.fullScreenEnabled &&
    notificationController.capabilities.channelEnabled;

  useEffect(() => {
    if (screen === 'home') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setSelectedEventId(null);
        setSelectedTemplateId(null);
        setScreen(
          screen === 'groups' ||
            screen === 'templates' ||
            screen === 'appearance' ||
            screen === 'about'
            ? 'settings'
            : screen === 'notifications'
              ? notificationsReturnScreen
              : screen === 'template-add'
                ? 'templates'
                : screen === 'template-edit'
                  ? templateReturnScreen
                  : 'home',
        );
        return true;
      },
    );

    return () => subscription.remove();
  }, [notificationsReturnScreen, screen, templateReturnScreen]);

  const returnHome = () => {
    setSelectedEventId(null);
    setSelectedTemplateId(null);
    setScreen('home');
  };

  const handleAddEvent = (event: PlannedEvent) => {
    addEvent(event);

    if (notificationController.capabilities.supported && !notificationsReady) {
      setSelectedEventId(null);
      setSelectedTemplateId(null);
      setNotificationsReturnScreen('home');
      setScreen('notifications');
      return;
    }

    returnHome();
  };

  const handleEditEvent = (event: PlannedEvent) => {
    updateEvent(event);
    returnHome();
  };

  const handleDeleteEvent = () => {
    if (selectedEventId) {
      deleteEvent(selectedEventId);
    }

    returnHome();
  };

  const handleSaveGroups = (nextGroups: Group[]) => {
    const nextGroupIds = new Set(nextGroups.map((group) => group.id));
    const deletedGroupIds = groups
      .filter((group) => !nextGroupIds.has(group.id))
      .map((group) => group.id);

    unassignDeletedGroups(nextGroups.map((group) => group.id));
    unassignDeletedTemplateGroups(deletedGroupIds);
    setGroups(nextGroups);
    setScreen('settings');
  };

  const handleAddTemplate = (draft: TemplateFormDraft) => {
    const createdAt = Date.now();

    addTemplate({
      ...draft,
      id: `template-${createdAt}`,
      createdAt,
    });
    setSelectedTemplateId(null);
    setScreen('templates');
  };

  const handleEditTemplate = (draft: TemplateFormDraft) => {
    const selectedTemplate = templates.find(
      (template) => template.id === selectedTemplateId,
    );

    if (!selectedTemplate) {
      setScreen(templateReturnScreen);
      return;
    }

    updateTemplate({ ...selectedTemplate, ...draft });
    setSelectedTemplateId(null);
    setScreen(templateReturnScreen);
  };

  const handleDeleteTemplate = () => {
    if (selectedTemplateId) {
      deleteTemplate(selectedTemplateId);
    }

    setSelectedTemplateId(null);
    setScreen(templateReturnScreen);
  };

  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const selectedTemplate = templates.find(
    (template) => template.id === selectedTemplateId,
  );

  const alarm = notificationController.activeAlarm;
  const stores = [eventStorage, groupStorage, templateStorage];
  const loadError = stores.some((store) => store.loadError);
  const saveError = stores.some((store) => store.saveError);
  const storageFeedback = (
    <StorageErrorModal
      loadError={loadError}
      saveError={saveError}
      suspended={Boolean(alarm)}
      onRetry={() => {
        for (const store of stores) {
          if (store.loadError) void store.retryLoad();
          else if (store.saveError) void store.retrySave();
        }
      }}
    />
  );

  if (
    (!areEventsHydrated || !areGroupsHydrated || !areTemplatesHydrated) &&
    !alarm
  ) {
    return <View className="flex-1 bg-paper">{storageFeedback}</View>;
  }

  let activeScreen;

  if (alarm) {
    activeScreen = (
      <AlarmScreen alarm={alarm} onAction={notificationController.actOnAlarm} />
    );
  } else if (screen === 'add') {
    activeScreen = (
      <EventFormScreen
        groups={groups}
        onBack={returnHome}
        onSubmit={handleAddEvent}
        templates={templates}
      />
    );
  } else if (screen === 'edit' && selectedEvent) {
    activeScreen = (
      <EventFormScreen
        event={selectedEvent}
        groups={groups}
        onBack={returnHome}
        onDelete={handleDeleteEvent}
        onSubmit={handleEditEvent}
      />
    );
  } else if (screen === 'settings') {
    activeScreen = (
      <SettingsScreen
        onBack={returnHome}
        onAppearancePress={() => setScreen('appearance')}
        onAboutPress={() => setScreen('about')}
        onGroupsPress={() => setScreen('groups')}
        onNotificationsPress={() => {
          setNotificationsReturnScreen('settings');
          setScreen('notifications');
        }}
        onTemplatesPress={() => setScreen('templates')}
        notificationsReady={notificationsReady}
      />
    );
  } else if (screen === 'groups') {
    activeScreen = (
      <GroupsScreen
        groups={groups}
        onBack={() => setScreen('settings')}
        onSave={handleSaveGroups}
      />
    );
  } else if (screen === 'appearance') {
    activeScreen = <AppearanceScreen onBack={() => setScreen('settings')} />;
  } else if (screen === 'about') {
    activeScreen = <AboutScreen onBack={() => setScreen('settings')} />;
  } else if (screen === 'notifications') {
    activeScreen = (
      <NotificationsScreen
        capabilities={notificationController.capabilities}
        isRefreshing={notificationController.isRefreshing}
        onBack={() => setScreen(notificationsReturnScreen)}
        onOpenBackgroundSettings={
          notificationController.openBackgroundActivitySettings
        }
        onOpenChannelSettings={notificationController.openAlarmChannelSettings}
        onOpenExactAlarmSettings={notificationController.openExactAlarmSettings}
        onOpenFullScreenSettings={
          notificationController.openFullScreenAlarmSettings
        }
        onRefresh={notificationController.refresh}
        onRequestPermission={notificationController.requestPermission}
        onSoundEnabledChange={notificationController.updateSoundEnabled}
        onTest={notificationController.runTest}
        soundEnabled={notificationController.soundEnabled}
      />
    );
  } else if (screen === 'templates') {
    activeScreen = (
      <TemplatesScreen
        groups={groups}
        onBack={() => setScreen('settings')}
        onCreate={() => {
          setSelectedTemplateId(null);
          setTemplateReturnScreen('templates');
          setScreen('template-add');
        }}
        onEdit={(templateId) => {
          setSelectedTemplateId(templateId);
          setTemplateReturnScreen('templates');
          setScreen('template-edit');
        }}
        templates={templates}
      />
    );
  } else if (screen === 'template-add') {
    activeScreen = (
      <TemplateFormScreen
        groups={groups}
        mode="add"
        onBack={() => setScreen('templates')}
        onSave={handleAddTemplate}
        templates={templates}
      />
    );
  } else if (screen === 'template-edit' && selectedTemplate) {
    activeScreen = (
      <TemplateFormScreen
        groups={groups}
        mode="edit"
        onBack={() => {
          setSelectedTemplateId(null);
          setScreen(templateReturnScreen);
        }}
        onDelete={handleDeleteTemplate}
        onSave={handleEditTemplate}
        template={selectedTemplate}
        templates={templates}
      />
    );
  } else {
    activeScreen = (
      <HomeScreen
        events={events}
        groups={groups}
        templates={templates}
        onAddPress={() => {
          setSelectedEventId(null);
          setSelectedTemplateId(null);
          setScreen('add');
        }}
        onEventPress={(event) => {
          if (event.recurringTemplateId) {
            setSelectedEventId(null);
            setSelectedTemplateId(event.recurringTemplateId);
            setTemplateReturnScreen('home');
            setScreen('template-edit');
            return;
          }

          setSelectedEventId(event.id);
          setSelectedTemplateId(null);
          setScreen('edit');
        }}
        onSettingsPress={() => {
          setSelectedEventId(null);
          setSelectedTemplateId(null);
          setScreen('settings');
        }}
      />
    );
  }

  const depth =
    screen === 'home'
      ? 0
      : screen === 'add' || screen === 'edit' || screen === 'settings'
        ? 1
        : screen === 'template-add' || screen === 'template-edit'
          ? 3
          : 2;

  return (
    <View className="flex-1 bg-paper">
      <ScreenTransition
        screenKey={alarm ? `alarm-${alarm.notificationId}` : screen}
        depth={alarm ? 4 : depth}
        urgent={Boolean(alarm)}
      >
        {activeScreen}
      </ScreenTransition>
      {storageFeedback}
    </View>
  );
}
