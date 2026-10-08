export type TemplateWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type TemplateRecurrence = {
  isEnabled: boolean;
  weekdays: TemplateWeekday[];
};

export type MeetingTemplate = {
  id: string;
  name: string;
  place: string;
  detail?: string;
  arrivalTime?: string;
  travelMinutes: number;
  preparationMinutes: number;
  groupId: string | null;
  recurrence: TemplateRecurrence;
  createdAt: number;
};
