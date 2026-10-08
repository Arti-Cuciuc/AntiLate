import { useTheme } from '../components/theme-provider';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionView } from '../components/motion/motion-view';
import { MotionToggle } from '../components/motion/motion-toggle';
import { MotionPressable as Pressable } from '../components/motion/motion-pressable';
import { DeleteConfirmationModal } from '../components/delete-confirmation-modal';
import { GroupPicker } from '../components/group-picker';
import { APP_TEXT, FORM_LABEL_TEXT } from '../constants/typography';
import type { Group } from '../types/group';
import type { MeetingTemplate, TemplateWeekday } from '../types/template';
import { cn } from '../utils/cn';
import {
  TEMPLATE_WEEKDAYS,
  TEMPLATE_WEEKDAY_FULL_LABELS,
  TEMPLATE_WEEKDAY_SHORT_LABELS,
} from '../utils/templates';
import { formatTimeInput, getTimeInputError, parseTime } from '../utils/time';

export type TemplateFormDraft = Omit<MeetingTemplate, 'id' | 'createdAt'>;

export type TemplateFormScreenProps = {
  mode: 'add' | 'edit';
  template?: MeetingTemplate;
  templates: MeetingTemplate[];
  groups: Group[];
  onBack: () => void;
  onSave: (draft: TemplateFormDraft) => void;
  onDelete?: () => void;
};

type InvalidField =
  | 'name'
  | 'place'
  | 'arrivalTime'
  | 'travelTime'
  | 'preparationTime'
  | 'weekdays';

const inputFrameClassName =
  'h-[54px] rounded-[18px] border-[2.5px] border-outline bg-canvas px-4 text-ink';
const labelClassName = cn(FORM_LABEL_TEXT, 'ml-4 text-ink');
const DEFAULT_WEEKDAYS: TemplateWeekday[] = [1, 2, 3, 4, 5];

function getInitialValues(template?: MeetingTemplate) {
  return {
    name: template?.name ?? '',
    place: template?.place ?? '',
    detail: template?.detail ?? '',
    arrivalTime: template?.arrivalTime ?? '',
    travelTime: template ? String(template.travelMinutes) : '',
    preparationTime: template ? String(template.preparationMinutes) : '',
    groupId: template?.groupId ?? null,
    isRecurring: template?.recurrence.isEnabled ?? false,
    weekdays: template?.recurrence.weekdays ?? [],
  };
}

function isValidDuration(value: number) {
  return Number.isInteger(value) && value > 0 && value <= 720;
}

export function TemplateFormScreen({
  mode,
  template,
  templates,
  groups,
  onBack,
  onSave,
  onDelete,
}: TemplateFormScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isCompact = height < 820;
  const initialValues = getInitialValues(template);
  const [name, setName] = useState(initialValues.name);
  const [place, setPlace] = useState(initialValues.place);
  const [detail, setDetail] = useState(initialValues.detail);
  const [arrivalTime, setArrivalTime] = useState(initialValues.arrivalTime);
  const [travelTime, setTravelTime] = useState(initialValues.travelTime);
  const [preparationTime, setPreparationTime] = useState(
    initialValues.preparationTime,
  );
  const [groupId, setGroupId] = useState<string | null>(
    groups.some((group) => group.id === initialValues.groupId)
      ? initialValues.groupId
      : null,
  );
  const [isRecurring, setIsRecurring] = useState(initialValues.isRecurring);
  const [weekdays, setWeekdays] = useState<TemplateWeekday[]>(
    initialValues.weekdays,
  );
  const [invalidFields, setInvalidFields] = useState<InvalidField[]>([]);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const values = getInitialValues(template);

    setName(values.name);
    setPlace(values.place);
    setDetail(values.detail);
    setArrivalTime(values.arrivalTime);
    setTravelTime(values.travelTime);
    setPreparationTime(values.preparationTime);
    setGroupId(
      groups.some((group) => group.id === values.groupId)
        ? values.groupId
        : null,
    );
    setIsRecurring(values.isRecurring);
    setWeekdays(values.weekdays);
    setInvalidFields([]);
    setError('');
  }, [groups, template]);

  const arrivalTimeError = getTimeInputError(arrivalTime);
  const travelMinutes = Number(travelTime);
  const preparationMinutes = Number(preparationTime);
  const travelTimeError =
    travelTime && !isValidDuration(travelMinutes) ? 'От 1 до 720 минут' : '';
  const preparationTimeError =
    preparationTime && !isValidDuration(preparationMinutes)
      ? 'От 1 до 720 минут'
      : '';

  const clearError = (field?: InvalidField) => {
    if (field) {
      setInvalidFields((currentFields) =>
        currentFields.filter((currentField) => currentField !== field),
      );
    }
    setError('');
  };

  const toggleRecurrence = () => {
    setIsRecurring((currentValue) => {
      const nextValue = !currentValue;

      if (nextValue && weekdays.length === 0) {
        setWeekdays(DEFAULT_WEEKDAYS);
      }

      return nextValue;
    });
    clearError('weekdays');
  };

  const toggleWeekday = (weekday: TemplateWeekday) => {
    setWeekdays((currentWeekdays) =>
      currentWeekdays.includes(weekday)
        ? currentWeekdays.filter((option) => option !== weekday)
        : TEMPLATE_WEEKDAYS.filter(
            (option) => currentWeekdays.includes(option) || option === weekday,
          ),
    );
    clearError('weekdays');
  };

  const handleDeletePress = () => {
    if (!onDelete) {
      return;
    }

    Keyboard.dismiss();
    setIsDeleteConfirmationVisible(true);
  };

  const handleSave = () => {
    const normalizedName = name.trim();
    const normalizedPlace = place.trim();
    const parsedArrivalTime = arrivalTime ? parseTime(arrivalTime) : null;
    const duplicateName = templates.some(
      (option) =>
        option.id !== template?.id &&
        option.name.trim().toLocaleLowerCase('ru') ===
          normalizedName.toLocaleLowerCase('ru'),
    );
    const nextInvalidFields: InvalidField[] = [];

    if (!normalizedName || duplicateName) {
      nextInvalidFields.push('name');
    }

    if (!normalizedPlace) {
      nextInvalidFields.push('place');
    }

    if (
      arrivalTimeError ||
      (arrivalTime.length > 0 && parsedArrivalTime === null) ||
      (isRecurring && parsedArrivalTime === null)
    ) {
      nextInvalidFields.push('arrivalTime');
    }

    if (!isValidDuration(travelMinutes)) {
      nextInvalidFields.push('travelTime');
    }

    if (!isValidDuration(preparationMinutes)) {
      nextInvalidFields.push('preparationTime');
    }

    if (isRecurring && weekdays.length === 0) {
      nextInvalidFields.push('weekdays');
    }

    if (nextInvalidFields.length > 0) {
      setInvalidFields(nextInvalidFields);

      if (duplicateName) {
        setError('Шаблон с таким названием уже существует.');
      } else if (!normalizedName) {
        setError('Укажите название шаблона.');
      } else if (!normalizedPlace) {
        setError('Укажите место встречи.');
      } else if (isRecurring && parsedArrivalTime === null) {
        setError('Для расписания укажите время в формате ЧЧ:ММ.');
      } else if (isRecurring && weekdays.length === 0) {
        setError('Выберите хотя бы один день повторения.');
      } else {
        setError('Проверьте выделенные поля.');
      }
      return;
    }

    onSave({
      name: normalizedName,
      place: normalizedPlace,
      detail: detail.trim() || undefined,
      arrivalTime: arrivalTime || undefined,
      travelMinutes,
      preparationMinutes,
      groupId,
      recurrence: {
        isEnabled: isRecurring,
        weekdays,
      },
    });
  };

  const hasInvalidField = (field: InvalidField) =>
    invalidFields.includes(field);

  return (
    <View className="flex-1 bg-paper">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(insets.bottom + 24, 36),
            paddingTop: Math.max(insets.top + 14, 30),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[596px] flex-1 self-center px-[18px]">
            <View className="h-[45px] flex-row items-center justify-between">
              <Text
                className={cn(APP_TEXT.large, 'flex-1 pr-3 text-ink')}
                style={{ includeFontPadding: false }}
              >
                {mode === 'edit' ? 'Редактирование' : 'Новый шаблон'}
              </Text>
              <Pressable
                accessibilityLabel="Вернуться к шаблонам"
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

            <View className={cn('mt-6 gap-[17px]', isCompact && 'mt-4 gap-3')}>
              <View className="gap-[7px]">
                <Text className={labelClassName}>НАЗВАНИЕ ШАБЛОНА</Text>
                <TextInput
                  accessibilityLabel="Название шаблона"
                  autoCapitalize="sentences"
                  className={cn(inputFrameClassName, APP_TEXT.medium)}
                  maxLength={32}
                  onChangeText={(value) => {
                    setName(value);
                    clearError('name');
                  }}
                  placeholder="Например, Университет"
                  placeholderTextColor={colors.placeholder}
                  returnKeyType="next"
                  selectionColor={colors.wine}
                  style={{
                    borderColor: hasInvalidField('name')
                      ? colors.error
                      : colors.outline,
                  }}
                  value={name}
                />
              </View>

              <View className="gap-[7px]">
                <Text className={labelClassName}>МЕСТО</Text>
                <TextInput
                  accessibilityLabel="Место встречи"
                  autoCapitalize="sentences"
                  className={cn(inputFrameClassName, APP_TEXT.medium)}
                  maxLength={80}
                  onChangeText={(value) => {
                    setPlace(value);
                    clearError('place');
                  }}
                  placeholder="Например, Политех"
                  placeholderTextColor={colors.placeholder}
                  returnKeyType="next"
                  selectionColor={colors.wine}
                  style={{
                    borderColor: hasInvalidField('place')
                      ? colors.error
                      : colors.outline,
                  }}
                  value={place}
                />
              </View>

              <View className="gap-[7px]">
                <Text className={labelClassName}>КОММЕНТАРИЙ</Text>
                <TextInput
                  accessibilityLabel="Комментарий шаблона"
                  className={cn(
                    inputFrameClassName,
                    APP_TEXT.medium,
                    'h-[76px] pt-[14px]',
                    isCompact && 'h-16 pt-3',
                  )}
                  maxLength={140}
                  multiline
                  onChangeText={setDetail}
                  placeholder="Например, первая пара"
                  placeholderTextColor={colors.placeholder}
                  selectionColor={colors.wine}
                  style={{ textAlignVertical: 'top' }}
                  value={detail}
                />
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1 gap-[7px]">
                  <Text className={labelClassName}>БЫТЬ К</Text>
                  <TextInput
                    accessibilityLabel="Время встречи"
                    className={cn(
                      inputFrameClassName,
                      APP_TEXT.large,
                      'tabular-nums',
                    )}
                    keyboardType="number-pad"
                    maxLength={5}
                    onChangeText={(value) => {
                      setArrivalTime(formatTimeInput(value, arrivalTime));
                      clearError('arrivalTime');
                    }}
                    placeholder="14:30"
                    placeholderTextColor={colors.placeholder}
                    selectionColor={colors.wine}
                    style={{
                      borderColor:
                        arrivalTimeError || hasInvalidField('arrivalTime')
                          ? colors.error
                          : colors.outline,
                    }}
                    value={arrivalTime}
                  />
                </View>

                <View className="flex-1 gap-[7px]">
                  <Text className={labelClassName}>В ДОРОГЕ</Text>
                  <View className="relative">
                    <TextInput
                      accessibilityLabel="Время в дороге в минутах"
                      className={cn(
                        inputFrameClassName,
                        APP_TEXT.large,
                        'w-full pr-12 tabular-nums',
                      )}
                      keyboardType="number-pad"
                      maxLength={3}
                      onChangeText={(value) => {
                        setTravelTime(value.replace(/\D/g, ''));
                        clearError('travelTime');
                      }}
                      placeholder="30"
                      placeholderTextColor={colors.placeholder}
                      selectionColor={colors.wine}
                      style={{
                        borderColor:
                          travelTimeError || hasInvalidField('travelTime')
                            ? colors.error
                            : colors.outline,
                      }}
                      value={travelTime}
                    />
                    <Text
                      className={cn(
                        APP_TEXT.small,
                        'absolute right-3 top-5 text-muted',
                      )}
                    >
                      мин
                    </Text>
                  </View>
                </View>

                <View className="flex-1 gap-[7px]">
                  <Text className={labelClassName}>НА СБОРЫ</Text>
                  <View className="relative">
                    <TextInput
                      accessibilityLabel="Время на сборы в минутах"
                      className={cn(
                        inputFrameClassName,
                        APP_TEXT.large,
                        'w-full pr-10 tabular-nums',
                      )}
                      keyboardType="number-pad"
                      maxLength={3}
                      onChangeText={(value) => {
                        setPreparationTime(value.replace(/\D/g, ''));
                        clearError('preparationTime');
                      }}
                      placeholder="30"
                      placeholderTextColor={colors.placeholder}
                      selectionColor={colors.wine}
                      style={{
                        borderColor:
                          preparationTimeError ||
                          hasInvalidField('preparationTime')
                            ? colors.error
                            : colors.outline,
                      }}
                      value={preparationTime}
                    />
                    <Text
                      className={cn(
                        APP_TEXT.small,
                        'absolute right-3 top-5 text-muted',
                      )}
                    >
                      мин
                    </Text>
                  </View>
                </View>
              </View>

              {arrivalTimeError || travelTimeError || preparationTimeError ? (
                <Text
                  accessibilityRole="alert"
                  className={cn(APP_TEXT.small, '-mt-1 text-wine-dark')}
                >
                  {arrivalTimeError || travelTimeError || preparationTimeError}
                </Text>
              ) : (
                <Text className={cn(APP_TEXT.small, '-mt-1 text-muted')}>
                  {isRecurring
                    ? 'Время используется во все выбранные дни'
                    : 'Время можно оставить пустым и выбрать при создании'}
                </Text>
              )}

              <GroupPicker
                groups={groups}
                isCompact={isCompact}
                onChange={setGroupId}
                value={groupId}
              />

              <View className="gap-[7px]">
                <Text className={labelClassName}>РАСПИСАНИЕ</Text>
                <View
                  className="gap-4 rounded-[20px] border-[2.5px] border-outline bg-canvas p-[14px]"
                  style={{
                    borderColor: hasInvalidField('weekdays')
                      ? colors.error
                      : colors.outline,
                  }}
                >
                  <Pressable
                    accessibilityLabel="Повторять шаблон по расписанию"
                    accessibilityRole="switch"
                    accessibilityState={{ checked: isRecurring }}
                    className="min-h-9 flex-row items-center justify-between gap-4"
                    onPress={toggleRecurrence}
                  >
                    <View className="flex-1">
                      <Text className={cn(APP_TEXT.mediumStrong, 'text-ink')}>
                        Повторять по расписанию
                      </Text>
                      <Text className={cn(APP_TEXT.small, 'mt-1 text-muted')}>
                        {isRecurring
                          ? 'Встреча всегда остаётся на главном экране'
                          : weekdays.length > 0
                            ? 'Расписание на паузе'
                            : 'Шаблон используется только вручную'}
                      </Text>
                    </View>
                    <MotionToggle checked={isRecurring} />
                  </Pressable>

                  {isRecurring ? (
                    <MotionView className="gap-2">
                      <Text className={cn(APP_TEXT.small, 'text-muted')}>
                        Дни повторения
                      </Text>
                      <View className="flex-row gap-1">
                        {TEMPLATE_WEEKDAYS.map((weekday) => {
                          const isSelected = weekdays.includes(weekday);

                          return (
                            <Pressable
                              accessibilityLabel={
                                TEMPLATE_WEEKDAY_FULL_LABELS[weekday]
                              }
                              accessibilityRole="button"
                              accessibilityState={{ selected: isSelected }}
                              className="h-9 flex-1 items-center justify-center rounded-[12px] border-2"
                              key={weekday}
                              onPress={() => toggleWeekday(weekday)}
                              style={{
                                backgroundColor: isSelected
                                  ? colors.action
                                  : colors.paper,
                                borderColor: isSelected
                                  ? colors.action
                                  : colors.divider,
                              }}
                            >
                              <Text
                                className={
                                  isSelected
                                    ? APP_TEXT.mediumStrong
                                    : APP_TEXT.medium
                                }
                                style={{
                                  color: isSelected
                                    ? colors.onAction
                                    : colors.ink,
                                }}
                              >
                                {TEMPLATE_WEEKDAY_SHORT_LABELS[weekday]}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </MotionView>
                  ) : null}
                </View>
              </View>

              {error ? (
                <Text
                  accessibilityRole="alert"
                  className={cn(APP_TEXT.small, 'text-wine-dark')}
                >
                  {error}
                </Text>
              ) : null}
            </View>

            <View className="mt-auto pt-7">
              <Pressable
                accessibilityLabel={
                  mode === 'edit' ? 'Сохранить шаблон' : 'Добавить шаблон'
                }
                accessibilityRole="button"
                className="h-[58px] items-center justify-center rounded-[20px] bg-action"
                onPress={handleSave}
              >
                <Text className={cn(FORM_LABEL_TEXT, 'text-on-action')}>
                  {mode === 'edit' ? 'Сохранить' : 'Добавить'}
                </Text>
              </Pressable>

              {mode === 'edit' && onDelete ? (
                <Pressable
                  accessibilityLabel="Удалить шаблон"
                  accessibilityRole="button"
                  className="mt-3 h-14 items-center justify-center rounded-[20px] border-2 border-wine-dark active:bg-[rgba(157,23,77,0.08)]"
                  onPress={handleDeletePress}
                >
                  <Text className={cn(FORM_LABEL_TEXT, 'text-wine-dark')}>
                    Удалить шаблон
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <DeleteConfirmationModal
        description={
          isRecurring
            ? 'Шаблон и его встреча из расписания исчезнут. Это действие нельзя отменить.'
            : 'Шаблон больше нельзя будет использовать при создании встречи.'
        }
        onCancel={() => setIsDeleteConfirmationVisible(false)}
        onConfirm={() => {
          setIsDeleteConfirmationVisible(false);
          onDelete?.();
        }}
        visible={isDeleteConfirmationVisible}
      />
    </View>
  );
}
