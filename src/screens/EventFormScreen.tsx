import { useTheme } from '../components/theme-provider';
import { useRef, useState } from 'react';
import {
  Alert,
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

import { MotionPressable as Pressable } from '../components/motion/motion-pressable';
import { DateSelector } from '../components/DateSelector';
import { DeleteConfirmationModal } from '../components/delete-confirmation-modal';
import { GroupPicker } from '../components/group-picker';
import { TemplatePickerModal } from '../components/template-picker-modal';
import { APP_TEXT, FORM_LABEL_TEXT } from '../constants/typography';
import type { DateChoice, PlannedEvent } from '../types/event';
import type { Group } from '../types/group';
import type { MeetingTemplate } from '../types/template';
import { cn } from '../utils/cn';
import {
  addDays,
  formatEventDateLabel,
  formatResolvedDate,
  resolveEventDay,
  toLocalDateId,
} from '../utils/date';
import {
  formatMinutes,
  formatTimeInput,
  getTimeInputError,
  parseTime,
} from '../utils/time';

type EventFormScreenProps = {
  groups: Group[];
  event?: PlannedEvent;
  templates?: MeetingTemplate[];
  onSubmit: (event: PlannedEvent) => void;
  onBack: () => void;
  onDelete?: () => void;
};

const inputFrameClassName =
  'h-[54px] rounded-[18px] border-[2.5px] border-outline bg-canvas px-4 text-ink';
const labelClassName = cn(FORM_LABEL_TEXT, 'text-ink');

export function EventFormScreen({
  groups,
  event,
  templates = [],
  onSubmit,
  onBack,
  onDelete,
}: EventFormScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isShortFormScreen = height < 780;
  const scrollViewRef = useRef<ScrollView>(null);
  const dayInputRef = useRef<TextInput>(null);
  const eventDateLabel = formatEventDateLabel(event?.eventDate);
  const initialDateChoice: DateChoice =
    eventDateLabel === 'завтра'
      ? 'tomorrow'
      : event?.eventDate && eventDateLabel !== 'сегодня'
        ? 'custom'
        : 'today';
  const [place, setPlace] = useState(event?.place ?? '');
  const [detail, setDetail] = useState(event?.detail ?? '');
  const [arrivalTime, setArrivalTime] = useState(event?.arrivalTime ?? '');
  const [travelTime, setTravelTime] = useState(
    event ? String(event.travelMinutes) : '',
  );
  const [preparationTime, setPreparationTime] = useState(
    event ? String(event.preparationMinutes) : '',
  );
  const [dateChoice, setDateChoice] = useState<DateChoice>(initialDateChoice);
  const [customDay, setCustomDay] = useState(
    initialDateChoice === 'custom' && event?.eventDate
      ? String(Number(event.eventDate.slice(-2)))
      : '',
  );
  const [groupId, setGroupId] = useState<string | null>(
    groups.some((group) => group.id === event?.groupId)
      ? (event?.groupId ?? null)
      : null,
  );
  const [isTemplatePickerVisible, setIsTemplatePickerVisible] = useState(false);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
  const [error, setError] = useState('');

  const arrivalMinutes = parseTime(arrivalTime);
  const arrivalTimeError = getTimeInputError(arrivalTime);
  const travelMinutes = Number(travelTime);
  const preparationMinutes = Number(preparationTime);
  const hasValidTravelTime =
    Number.isInteger(travelMinutes) &&
    travelMinutes > 0 &&
    travelMinutes <= 720;
  const hasValidPreparationTime =
    Number.isInteger(preparationMinutes) &&
    preparationMinutes > 0 &&
    preparationMinutes <= 720;
  const resolvedCustomDate = resolveEventDay(customDay, new Date());
  const resolvedMonth = resolvedCustomDate
    ? formatResolvedDate(resolvedCustomDate).replace(/^\d+\s/, '')
    : null;

  const revealDateField = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 250);
  };

  const selectDateChoice = (choice: DateChoice) => {
    setDateChoice(choice);
    setError('');

    if (choice === 'custom') {
      setTimeout(() => {
        dayInputRef.current?.focus();
      }, 100);
    }
  };

  const handleDeletePress = () => {
    if (!onDelete) {
      return;
    }

    Keyboard.dismiss();
    setIsDeleteConfirmationVisible(true);
  };

  const applyTemplate = (template: MeetingTemplate) => {
    setPlace(template.place);
    setDetail(template.detail ?? '');
    setArrivalTime(template.arrivalTime ?? '');
    setTravelTime(String(template.travelMinutes));
    setPreparationTime(String(template.preparationMinutes));
    setGroupId(
      template.groupId && groups.some((group) => group.id === template.groupId)
        ? template.groupId
        : null,
    );
    setError('');
  };

  const handleTemplateSelect = (template: MeetingTemplate) => {
    const hasEnteredValues = Boolean(
      place ||
      detail ||
      arrivalTime ||
      travelTime ||
      preparationTime ||
      groupId,
    );

    if (!hasEnteredValues) {
      applyTemplate(template);
      return;
    }

    Alert.alert(
      'Применить шаблон?',
      'Введённые данные заменятся. Выбранная дата останется без изменений.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Применить', onPress: () => applyTemplate(template) },
      ],
    );
  };

  const handleSubmit = () => {
    if (!place.trim()) {
      setError('Укажите место встречи.');
      return;
    }

    if (arrivalTimeError) {
      setError(arrivalTimeError);
      return;
    }

    if (arrivalMinutes === null) {
      setError('Введите время в формате ЧЧ:ММ, например 14:30.');
      return;
    }

    if (!hasValidTravelTime) {
      setError('Укажите время в дороге от 1 до 720 минут.');
      return;
    }

    if (!hasValidPreparationTime) {
      setError('Укажите время на сборы от 1 до 720 минут.');
      return;
    }

    const now = new Date();
    const todayId = toLocalDateId(now);
    const customDateValue = resolveEventDay(customDay, now);
    const eventDate =
      dateChoice === 'today'
        ? todayId
        : dateChoice === 'tomorrow'
          ? toLocalDateId(addDays(now, 1))
          : customDateValue
            ? toLocalDateId(customDateValue)
            : null;

    if (!eventDate) {
      setError('Укажите существующий день текущего или следующего месяца.');
      return;
    }

    if (eventDate < todayId) {
      setError('Дата встречи не может быть в прошлом.');
      return;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (!event && eventDate === todayId && arrivalMinutes <= currentMinutes) {
      setError('Укажите время встречи, которое ещё не прошло.');
      return;
    }

    onSubmit({
      id: event?.id ?? `event-${Date.now()}`,
      place: place.trim(),
      detail: detail.trim() || undefined,
      eventDate,
      arrivalTime,
      leaveTime: formatMinutes(arrivalMinutes - travelMinutes),
      travelMinutes,
      preparationMinutes,
      state: event?.state ?? 'planned',
      groupId,
    });
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
            paddingBottom: Math.max(
              insets.bottom + (isShortFormScreen ? 14 : 22),
              isShortFormScreen ? 24 : 34,
            ),
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
                {event ? 'Редактирование' : 'Новая встреча'}
              </Text>
              <Pressable
                accessibilityLabel="Вернуться на главный экран"
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

            <View
              className={isShortFormScreen ? 'mt-4 gap-3' : 'mt-6 gap-[17px]'}
            >
              <View className="gap-[7px]">
                <View className="ml-4 mr-1 flex-row items-center justify-between">
                  <Text className={labelClassName}>МЕСТО</Text>
                  {!event && templates.length > 0 ? (
                    <Pressable
                      accessibilityLabel="Выбрать шаблон встречи"
                      accessibilityRole="button"
                      onPress={() => setIsTemplatePickerVisible(true)}
                    >
                      <Text className={cn(APP_TEXT.mediumStrong, 'text-ink')}>
                        Из шаблона →
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <TextInput
                  accessibilityLabel="Место встречи"
                  autoCapitalize="sentences"
                  className={cn(inputFrameClassName, APP_TEXT.medium)}
                  onChangeText={(value) => {
                    setPlace(value);
                    setError('');
                  }}
                  placeholder="Например, Gym One"
                  placeholderTextColor={colors.placeholder}
                  returnKeyType="next"
                  selectionColor={colors.wine}
                  value={place}
                />
              </View>

              <View className="gap-[7px]">
                <Text className={cn(labelClassName, 'ml-4')}>КОММЕНТАРИЙ</Text>
                <TextInput
                  accessibilityLabel="Комментарий к встрече"
                  className={cn(
                    inputFrameClassName,
                    APP_TEXT.medium,
                    'h-[76px] pt-[14px]',
                    isShortFormScreen && 'h-16 pt-3',
                  )}
                  maxLength={140}
                  multiline
                  onChangeText={setDetail}
                  placeholder="Например, встреча с Максимом"
                  placeholderTextColor={colors.placeholder}
                  selectionColor={colors.wine}
                  style={{ textAlignVertical: 'top' }}
                  value={detail}
                />
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1 gap-[7px]">
                  <Text className={cn(labelClassName, 'ml-4')}>БЫТЬ К</Text>
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
                      setError('');
                    }}
                    placeholder="14:30"
                    placeholderTextColor={colors.placeholder}
                    selectionColor={colors.wine}
                    style={{
                      borderColor: arrivalTimeError
                        ? colors.error
                        : colors.outline,
                    }}
                    value={arrivalTime}
                  />
                </View>

                <View className="flex-1 gap-[7px]">
                  <Text className={cn(labelClassName, 'ml-4')}>В ДОРОГЕ</Text>
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
                        setError('');
                      }}
                      placeholder="30"
                      placeholderTextColor={colors.placeholder}
                      selectionColor={colors.wine}
                      value={travelTime}
                    />
                    <Text
                      className={cn(
                        APP_TEXT.small,
                        'absolute right-4 top-5 text-muted',
                      )}
                    >
                      мин
                    </Text>
                  </View>
                </View>

                <View className="flex-1 gap-[7px]">
                  <Text className={cn(labelClassName, 'ml-4')}>НА СБОРЫ</Text>
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
                        setError('');
                      }}
                      placeholder="30"
                      placeholderTextColor={colors.placeholder}
                      selectionColor={colors.wine}
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

              {arrivalTimeError ? (
                <Text
                  accessibilityRole="alert"
                  className={cn(APP_TEXT.small, '-mt-1 text-wine-dark')}
                >
                  {arrivalTimeError}
                </Text>
              ) : null}

              <DateSelector
                choice={dateChoice}
                customDay={customDay}
                dayInputRef={dayInputRef}
                isCompact={isShortFormScreen}
                onChoiceChange={selectDateChoice}
                onCustomDayChange={(value) => {
                  setCustomDay(value.replace(/\D/g, ''));
                  setError('');
                }}
                onCustomDayFocus={revealDateField}
                resolvedMonth={resolvedMonth}
              />

              <GroupPicker
                groups={groups}
                isCompact={isShortFormScreen}
                onChange={setGroupId}
                value={groupId}
              />

              {error ? (
                <Text
                  accessibilityRole="alert"
                  className={cn(APP_TEXT.small, '-mt-2 text-wine-dark')}
                >
                  {error}
                </Text>
              ) : null}
            </View>

            <View
              className={cn('mt-auto pt-7', isShortFormScreen && 'pt-[18px]')}
            >
              <Pressable
                accessibilityLabel={
                  event ? 'Сохранить встречу' : 'Добавить встречу'
                }
                accessibilityRole="button"
                className="h-[58px] items-center justify-center rounded-[20px] bg-action"
                onPress={handleSubmit}
              >
                <Text className={cn(FORM_LABEL_TEXT, 'text-on-action')}>
                  {event ? 'Сохранить' : 'Добавить'}
                </Text>
              </Pressable>

              {event && onDelete ? (
                <Pressable
                  accessibilityLabel="Удалить встречу"
                  accessibilityRole="button"
                  className="mt-3 h-14 items-center justify-center rounded-[20px] border-2 border-wine-dark active:bg-[rgba(157,23,77,0.08)]"
                  onPress={handleDeletePress}
                >
                  <Text className={cn(FORM_LABEL_TEXT, 'text-wine-dark')}>
                    Удалить встречу
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <TemplatePickerModal
        onClose={() => setIsTemplatePickerVisible(false)}
        onSelect={handleTemplateSelect}
        templates={templates}
        visible={isTemplatePickerVisible}
      />
      <DeleteConfirmationModal
        description="Встреча исчезнет с главного экрана. Это действие нельзя отменить."
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
