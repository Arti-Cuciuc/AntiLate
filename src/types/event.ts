export type EventState = 'active' | 'planned';

export type DateChoice = 'today' | 'tomorrow' | 'custom';

export type PlannedEvent = {
  id: string;
  place: string;
  detail?: string;
  eventDate?: string;
  arrivalTime: string;
  leaveTime: string;
  travelMinutes: number;
  preparationMinutes: number;
  state: EventState;
  groupId: string | null;
};
