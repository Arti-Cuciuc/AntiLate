import { useTheme } from '../components/theme-provider';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionView } from '../components/motion/motion-view';
import { MotionPressable as Pressable } from '../components/motion/motion-pressable';
import { DeleteConfirmationModal } from '../components/delete-confirmation-modal';
import { MAX_GROUPS } from '../constants/groups';
import { APP_TEXT } from '../constants/typography';
import type { Group } from '../types/group';
import { cn } from '../utils/cn';
import {
  getGroupAppearance,
  getGroupPaletteOptions,
  getNextGroupColor,
  isValidGroupColor,
} from '../utils/groups';

type GroupsScreenProps = {
  groups: Group[];
  onBack: () => void;
  onSave: (groups: Group[]) => void;
};

export function GroupsScreen({ groups, onBack, onSave }: GroupsScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const groupInputRefs = useRef<Record<string, TextInput | null>>({});
  const groupOffsets = useRef<Record<string, number>>({});
  const [drafts, setDrafts] = useState(() =>
    groups.map((group) => ({ ...group })),
  );
  const [openPaletteId, setOpenPaletteId] = useState<string | null>(null);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<Group | null>(
    null,
  );
  const [invalidGroupIds, setInvalidGroupIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const updateGroup = (groupId: string, changes: Partial<Group>) => {
    setDrafts((currentDrafts) =>
      currentDrafts.map((group) =>
        group.id === groupId ? { ...group, ...changes } : group,
      ),
    );
    if (changes.name !== undefined) {
      setInvalidGroupIds((currentIds) =>
        currentIds.filter((id) => id !== groupId),
      );
    }
    setError('');
  };

  const addGroup = () => {
    if (drafts.length >= MAX_GROUPS) {
      return;
    }

    setDrafts((currentDrafts) => [
      ...currentDrafts,
      {
        id: `group-${Date.now()}-${currentDrafts.length + 1}`,
        name: '',
        color: getNextGroupColor(currentDrafts),
      },
    ]);
    setError('');
    setInvalidGroupIds([]);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const requestDeleteGroup = (group: Group) => {
    Keyboard.dismiss();
    setPendingDeleteGroup(group);
  };

  const confirmDeleteGroup = () => {
    if (!pendingDeleteGroup) {
      return;
    }

    const groupId = pendingDeleteGroup.id;

    setDrafts((currentDrafts) =>
      currentDrafts.filter((draft) => draft.id !== groupId),
    );
    setOpenPaletteId((currentId) => (currentId === groupId ? null : currentId));
    setError('');
    setInvalidGroupIds((currentIds) =>
      currentIds.filter((id) => id !== groupId),
    );
    setPendingDeleteGroup(null);
  };

  const saveGroups = () => {
    const normalizedNames = drafts.map((group) =>
      group.name.trim().toLocaleLowerCase('ru'),
    );
    const duplicateNames = new Set(
      normalizedNames.filter(
        (name, index) => name && normalizedNames.indexOf(name) !== index,
      ),
    );
    const invalidNameIds = drafts
      .filter((group, index) => {
        const name = normalizedNames[index];

        return !name || duplicateNames.has(name);
      })
      .map((group) => group.id);
    const hasInvalidColor = drafts.some(
      (group) => !isValidGroupColor(group.color),
    );
    const hasDuplicateColor =
      new Set(drafts.map((group) => group.color.toUpperCase())).size !==
      drafts.length;

    if (invalidNameIds.length > 0) {
      const firstInvalidId = invalidNameIds[0];

      setInvalidGroupIds(invalidNameIds);
      setError(
        normalizedNames.some((name) => !name)
          ? 'Назовите каждую группу перед сохранением.'
          : 'Названия групп не должны повторяться.',
      );
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          animated: true,
          y: Math.max((groupOffsets.current[firstInvalidId] ?? 0) - 16, 0),
        });
        groupInputRefs.current[firstInvalidId]?.focus();
      }, 100);
      return;
    }

    if (hasInvalidColor || hasDuplicateColor) {
      setInvalidGroupIds([]);
      setError('У каждой группы должен быть свой цвет.');
      return;
    }

    onSave(
      drafts.map((group) => ({
        ...group,
        name: group.name.trim(),
        color: group.color.toUpperCase(),
      })),
    );
  };

  return (
    <View className="flex-1 bg-paper">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(insets.bottom + 30, 44),
            paddingTop: Math.max(insets.top + 14, 30),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[596px] flex-1 self-center px-[18px]">
            <View className="h-[45px] flex-row items-center justify-between">
              <Text className={cn(APP_TEXT.large, 'flex-1 pr-3 text-ink')}>
                Группы
              </Text>
              <Pressable
                accessibilityLabel="Вернуться к настройкам"
                accessibilityRole="button"
                className="h-[45px] w-[45px] items-center justify-center rounded-[22.5px] border-[2.5px] border-outline"
                onPress={onBack}
              >
                <Text
                  className="-mt-0.5 font-manrope text-[24px] leading-7 text-ink"
                  style={{ includeFontPadding: false }}
                >
                  ←
                </Text>
              </Pressable>
            </View>

            {drafts.length === 0 ? (
              <View className="mt-6 min-h-[150px] items-center justify-center rounded-[22px] border-[2.5px] border-outline bg-canvas px-8">
                <Text className={cn(APP_TEXT.medium, 'text-center text-ink')}>
                  Групп пока нет
                </Text>
                <Text
                  className={cn(APP_TEXT.small, 'mt-2 text-center text-muted')}
                >
                  Создайте, например, «Работа», «Личное» или «Спорт»
                </Text>
              </View>
            ) : (
              <View className="mt-6 gap-4">
                {drafts.map((group) => {
                  const isPaletteOpen = openPaletteId === group.id;
                  const appearance = getGroupAppearance(group);
                  const paletteOptions = getGroupPaletteOptions(group, drafts);

                  return (
                    <MotionView
                      className="gap-3 rounded-[22px] border-[2.5px] border-outline bg-canvas p-[18px]"
                      key={group.id}
                      onLayout={({ nativeEvent }) => {
                        groupOffsets.current[group.id] = nativeEvent.layout.y;
                      }}
                    >
                      <View className="flex-row items-center gap-[10px]">
                        <Pressable
                          accessibilityHint="Открывает палитру цветов группы"
                          accessibilityLabel={`Изменить цвет группы ${group.name || 'без названия'}`}
                          accessibilityRole="button"
                          accessibilityState={{ expanded: isPaletteOpen }}
                          className="h-[50px] w-[50px] items-center justify-center rounded-[25px] border-2"
                          onPress={() =>
                            setOpenPaletteId((currentId) =>
                              currentId === group.id ? null : group.id,
                            )
                          }
                          style={{
                            borderColor: isPaletteOpen
                              ? colors.ink
                              : 'transparent',
                          }}
                        >
                          <View
                            className="h-10 w-10 rounded-[20px] border-2"
                            style={{
                              backgroundColor: appearance.backgroundColor,
                              borderColor: appearance.borderColor,
                            }}
                          />
                        </Pressable>
                        <TextInput
                          accessibilityLabel={`Название группы ${group.name || 'без названия'}`}
                          autoCapitalize="sentences"
                          className={cn(
                            APP_TEXT.medium,
                            'h-[50px] flex-1 rounded-[16px] border-2 border-outline bg-paper px-3 text-ink',
                          )}
                          maxLength={24}
                          onChangeText={(name) =>
                            updateGroup(group.id, { name })
                          }
                          placeholder="Например, Работа"
                          placeholderTextColor={colors.placeholder}
                          ref={(input) => {
                            groupInputRefs.current[group.id] = input;
                          }}
                          selectionColor={colors.wine}
                          style={{
                            borderColor: invalidGroupIds.includes(group.id)
                              ? colors.error
                              : colors.outline,
                          }}
                          value={group.name}
                        />
                        <Pressable
                          accessibilityLabel={`Удалить группу ${group.name || 'без названия'}`}
                          accessibilityRole="button"
                          className="h-[50px] items-center justify-center rounded-[16px] border-2 border-wine-dark px-3"
                          onPress={() => requestDeleteGroup(group)}
                        >
                          <Text
                            className={cn(APP_TEXT.small, 'text-wine-dark')}
                          >
                            Удалить
                          </Text>
                        </Pressable>
                      </View>

                      {isPaletteOpen ? (
                        <MotionView className="flex-row flex-wrap rounded-[18px] border-2 border-divider bg-paper p-2">
                          {paletteOptions.map((option) => {
                            const isSelected = option.color === group.color;
                            const optionAppearance = getGroupAppearance(option);

                            return (
                              <View
                                className="items-center py-1"
                                key={option.color}
                                style={{ width: '20%' }}
                              >
                                <Pressable
                                  accessibilityLabel={
                                    option.isUnavailable
                                      ? `${option.name}, занят другой группой`
                                      : `Выбрать цвет ${option.name}`
                                  }
                                  accessibilityRole="button"
                                  accessibilityState={{
                                    disabled: option.isUnavailable,
                                    selected: isSelected,
                                  }}
                                  className="h-10 w-10 items-center justify-center rounded-[20px] border-2"
                                  disabled={option.isUnavailable}
                                  onPress={() => {
                                    updateGroup(group.id, {
                                      color: option.color,
                                    });
                                    setOpenPaletteId(null);
                                  }}
                                  style={{
                                    borderColor: isSelected
                                      ? colors.ink
                                      : 'transparent',
                                    opacity: option.isUnavailable ? 0.14 : 1,
                                  }}
                                >
                                  <View
                                    className="h-8 w-8 rounded-2xl border-[1.5px]"
                                    style={{
                                      backgroundColor: option.color,
                                      borderColor: optionAppearance.borderColor,
                                    }}
                                  />
                                </Pressable>
                              </View>
                            );
                          })}
                        </MotionView>
                      ) : null}
                    </MotionView>
                  );
                })}
              </View>
            )}

            <View className="mt-auto pt-5">
              <View className="flex-row items-center justify-between gap-4">
                <Text className={cn(APP_TEXT.small, 'text-muted')}>
                  {drafts.length} из {MAX_GROUPS}
                </Text>
                <Pressable
                  accessibilityLabel="Добавить группу"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: drafts.length >= MAX_GROUPS }}
                  className="h-11 items-center justify-center rounded-[16px] border-2 border-outline px-4 disabled:opacity-30"
                  disabled={drafts.length >= MAX_GROUPS}
                  onPress={addGroup}
                >
                  <Text className={cn(APP_TEXT.mediumStrong, 'text-ink')}>
                    + Новая группа
                  </Text>
                </Pressable>
              </View>

              {error ? (
                <Text
                  accessibilityRole="alert"
                  className={cn(APP_TEXT.small, 'mt-4 text-wine-dark')}
                >
                  {error}
                </Text>
              ) : null}

              <Pressable
                accessibilityLabel="Сохранить группы"
                accessibilityRole="button"
                className="mt-4 h-[58px] items-center justify-center rounded-[20px] bg-action"
                onPress={saveGroups}
              >
                <Text className={cn(APP_TEXT.mediumStrong, 'text-on-action')}>
                  Сохранить
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <DeleteConfirmationModal
        description={`Встречи и шаблоны из группы «${pendingDeleteGroup?.name || 'Без названия'}» останутся без группы.`}
        onCancel={() => setPendingDeleteGroup(null)}
        onConfirm={confirmDeleteGroup}
        visible={pendingDeleteGroup !== null}
      />
    </View>
  );
}
