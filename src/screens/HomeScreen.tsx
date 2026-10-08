import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MotionView } from '../components/motion/motion-view';
import { useAppReducedMotion } from '../components/motion/motion-provider';
import { MOTION_TIMING } from '../constants/motion';
import { AppNavigationIsland } from '../components/app-navigation-island';
import { CountdownCard } from '../components/CountdownCard';
import { EmptyStateArrow } from '../components/EmptyStateArrow';
import { EventCard } from '../components/EventCard';
import { GroupFilter, type GroupFilterValue } from '../components/group-filter';
import { ALL_GROUPS_FILTER_ID, UNGROUPED_FILTER_ID } from '../constants/groups';
import { getAppContentTop } from '../constants/layout';
import { SCHEDULE_FILTER_ID } from '../constants/templates';
import { APP_TEXT } from '../constants/typography';
import { useCurrentTime } from '../hooks/use-current-time';
import type { DisplayEvent } from '../types/display-event';
import type { Group } from '../types/group';
import type { MeetingTemplate } from '../types/template';
import { cn } from '../utils/cn';
import { sortEventsByDeparture } from '../utils/events';
import { getGroup } from '../utils/groups';
import { getNextRecurringEvents } from '../utils/templates';

type HomeScreenProps = {
  groups: Group[];
  events: DisplayEvent[];
  templates: MeetingTemplate[];
  onAddPress: () => void;
  onEventPress: (event: DisplayEvent) => void;
  onSettingsPress: () => void;
};

export function HomeScreen({
  groups,
  events,
  templates,
  onAddPress,
  onEventPress,
  onSettingsPress,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useAppReducedMotion();
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
  const navigationCollapseProgress = useSharedValue(0);
  const isNavigationCollapsed = useSharedValue(false);
  const currentTime = useCurrentTime();
  const isNarrow = width < 360;
  const [emptyLayout, setEmptyLayout] = useState({ height: 0, width: 0 });
  const [selectedGroup, setSelectedGroup] =
    useState<GroupFilterValue>(ALL_GROUPS_FILTER_ID);
  const recurringEvents = useMemo(
    () => getNextRecurringEvents(templates, currentTime),
    [currentTime, templates],
  );
  const displayEvents = useMemo(
    () => [...events, ...recurringEvents],
    [events, recurringEvents],
  );
  const sortedEvents = useMemo(
    () => sortEventsByDeparture(displayEvents),
    [displayEvents],
  );
  const showSchedule = recurringEvents.length > 0;
  const isEmpty = displayEvents.length === 0;
  const groupIds = useMemo(
    () => new Set(groups.map((group) => group.id)),
    [groups],
  );
  const showUngrouped = useMemo(
    () =>
      displayEvents.some(
        (event) => event.groupId === null || !groupIds.has(event.groupId),
      ),
    [displayEvents, groupIds],
  );
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {
      [ALL_GROUPS_FILTER_ID]: displayEvents.length,
      [SCHEDULE_FILTER_ID]: recurringEvents.length,
    };

    for (const event of displayEvents) {
      const key =
        event.groupId !== null && groupIds.has(event.groupId)
          ? event.groupId
          : UNGROUPED_FILTER_ID;

      counts[key] = (counts[key] ?? 0) + 1;
    }

    return counts;
  }, [displayEvents, groupIds, recurringEvents.length]);
  const visibleEvents = useMemo(() => {
    if (selectedGroup === ALL_GROUPS_FILTER_ID) {
      return sortedEvents;
    }

    if (selectedGroup === UNGROUPED_FILTER_ID) {
      return sortedEvents.filter(
        (event) => event.groupId === null || !groupIds.has(event.groupId),
      );
    }

    if (selectedGroup === SCHEDULE_FILTER_ID) {
      return sortedEvents.filter((event) => event.recurringTemplateId);
    }

    return sortedEvents.filter((event) => event.groupId === selectedGroup);
  }, [groupIds, selectedGroup, sortedEvents]);

  useEffect(() => {
    if (
      (selectedGroup === UNGROUPED_FILTER_ID && !showUngrouped) ||
      (selectedGroup === SCHEDULE_FILTER_ID && !showSchedule) ||
      (selectedGroup !== ALL_GROUPS_FILTER_ID &&
        selectedGroup !== SCHEDULE_FILTER_ID &&
        selectedGroup !== UNGROUPED_FILTER_ID &&
        !groupIds.has(selectedGroup))
    ) {
      setSelectedGroup(ALL_GROUPS_FILTER_ID);
    }
  }, [groupIds, selectedGroup, showSchedule, showUngrouped]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: ({ contentOffset }) => {
      if (!isNavigationCollapsed.value && contentOffset.y > 12) {
        isNavigationCollapsed.value = true;
        navigationCollapseProgress.value = withTiming(1, {
          ...MOTION_TIMING,
          duration: reducedMotion ? 0 : MOTION_TIMING.duration,
        });
      } else if (isNavigationCollapsed.value && contentOffset.y <= 0) {
        isNavigationCollapsed.value = false;
        navigationCollapseProgress.value = withTiming(0, {
          ...MOTION_TIMING,
          duration: reducedMotion ? 0 : MOTION_TIMING.duration,
        });
      }
    },
  });

  return (
    <View className="flex-1 bg-paper">
      <Animated.ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Math.max(insets.bottom + 30, 44),
          paddingTop: getAppContentTop(insets.top),
        }}
        onScroll={scrollHandler}
        ref={scrollViewRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View
          className={cn(
            'w-full max-w-[596px] self-center px-[18px]',
            isEmpty && 'flex-1',
          )}
          onLayout={
            isEmpty
              ? ({ nativeEvent }) => {
                  const { height, width: layoutWidth } = nativeEvent.layout;
                  setEmptyLayout({ height, width: layoutWidth });
                }
              : undefined
          }
        >
          {isEmpty ? (
            <>
              <EmptyStateArrow
                height={emptyLayout.height}
                width={emptyLayout.width}
              />
              <MotionView className="relative flex-1 items-center justify-center">
                <Text
                  className={cn(
                    APP_TEXT.medium,
                    'max-w-[280px] text-center text-muted',
                  )}
                >
                  У вас нет активных встреч,{'\n'}создайте новую
                </Text>
              </MotionView>
            </>
          ) : (
            <>
              <CountdownCard event={sortedEvents[0]} />
              <View className="mt-[18px] border-y-[1.5px] border-divider py-3">
                <GroupFilter
                  counts={groupCounts}
                  groups={groups}
                  onChange={setSelectedGroup}
                  showSchedule={showSchedule}
                  showUngrouped={showUngrouped}
                  value={selectedGroup}
                />
              </View>
              {visibleEvents.length > 0 ? (
                <View className="mt-[18px] gap-[18px]">
                  {visibleEvents.map((event) => (
                    <MotionView key={event.id}>
                      <EventCard
                        compact={isNarrow}
                        currentDate={currentTime}
                        event={event}
                        group={getGroup(groups, event.groupId)}
                        onPress={() => onEventPress(event)}
                      />
                    </MotionView>
                  ))}
                </View>
              ) : (
                <MotionView className="mt-[18px] min-h-[150px] items-center justify-center px-6">
                  <Text
                    className={cn(APP_TEXT.medium, 'text-center text-muted')}
                  >
                    В этой группе пока нет встреч
                  </Text>
                </MotionView>
              )}
            </>
          )}
        </View>
      </Animated.ScrollView>
      <AppNavigationIsland
        collapseProgress={navigationCollapseProgress}
        onAddPress={onAddPress}
        onHomePress={() =>
          scrollViewRef.current?.scrollTo({ animated: !reducedMotion, y: 0 })
        }
        onSettingsPress={onSettingsPress}
      />
    </View>
  );
}
