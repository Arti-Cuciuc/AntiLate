const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs')();
const dates = load('src/utils/date.ts');
const events = load('src/utils/events.ts');
const time = load('src/utils/time.ts');
const plan = load('src/utils/notification-plan.ts');
const { normalizeNotificationState } = load('src/utils/notification-state.ts');
const { getNextRecurringEvent } = load('src/utils/templates.ts');
const event = { id:'one', place:'Университет', eventDate:'2026-09-15', arrivalTime:'13:15', leaveTime:'13:00', travelMinutes:15, preparationMinutes:10, state:'planned', groupId:null };

test('tomorrow becomes today across a month boundary', () => {
  assert.equal(dates.formatEventDateLabel('2026-08-01', new Date(2026,6,31)), 'завтра');
  assert.equal(dates.formatEventDateLabel('2026-08-01', new Date(2026,7,1)), 'сегодня');
});
test('day selection rolls into next year and rejects impossible dates', () => {
  assert.equal(dates.toLocalDateId(dates.resolveEventDay('5', new Date(2026,11,20))), '2027-01-05');
  assert.equal(dates.resolveEventDay('31', new Date(2026,3,15)), null);
  assert.equal(dates.isValidLocalDateId('2026-02-29'), false);
  assert.equal(dates.isValidLocalDateId('2028-02-29'), true);
});
test('invalid stored events cannot enter scheduler', () => {
  for (const change of [{travelMinutes:Infinity},{travelMinutes:-1},{travelMinutes:1.5},{eventDate:'2026-02-31'},{arrivalTime:'24:00'},{id:''}]) {
    assert.equal(events.normalizePlannedEvent({...event,...change}), null);
  }
  assert.equal(events.normalizePlannedEvent({...event,leaveTime:'00:00'}).leaveTime, '13:00');
});
test('departure and preparation can cross midnight', () => {
  const midnight = {...event,arrivalTime:'00:10',travelMinutes:30};
  assert.equal(events.getEventDepartureTimestamp(midnight), new Date(2026,8,14,23,40).getTime());
  assert.equal(events.getEventPreparationTimestamp(midnight), new Date(2026,8,14,23,30).getTime());
});
test('midpoint is exactly halfway from preparation to departure', () => {
  assert.equal(plan.getEventMidpointTimestamp(event), new Date(2026,8,15,12,55).getTime());
});
test('payload roundtrip and malformed timestamp rejection', () => {
  const payload = plan.createAlarmPayload(event,'preparation');
  assert.deepEqual(plan.parseAlarmPayload(plan.serializeAlarmPayload(payload)),payload);
  for (const change of [{arrivalTimestamp:'NaN'},{midpointTimestamp:'Infinity'},{preparationTimestamp:'0'},{eventDate:'oops'},{arrivalTime:'09:99'}]) {
    assert.equal(plan.parseAlarmPayload({...plan.serializeAlarmPayload(payload),...change}), null);
  }
});
test('test alarm fires after three seconds', () => {
  assert.equal(plan.createTestAlarmPayload(100000).preparationTimestamp,103000);
});
test('corrupt plans and prototype keys are discarded', () => {
  const value = JSON.parse('{"plans":{"x":null,"__proto__":{"eventId":"__proto__"}},"activeAlarm":{"stage":"test"},"soundEnabled":"true"}');
  assert.deepEqual(normalizeNotificationState(value), {plans:{},activeAlarm:null,soundEnabled:false});
});
test('weekday recurrence skips weekend and disabled templates', () => {
  const template={...event,name:'Универ',createdAt:0,recurrence:{isEnabled:true,weekdays:[1,2,3,4,5]}};
  assert.equal(getNextRecurringEvent(template,new Date(2026,8,18,20)).eventDate,'2026-09-21');
  assert.equal(getNextRecurringEvent({...template,recurrence:{...template.recurrence,isEnabled:false}}),null);
});
test('time constraints and ordering do not mutate input', () => {
  assert.equal(time.parseTime('23:59'),1439);
  assert.equal(time.parseTime('23:60'),null);
  const later={...event,id:'later',eventDate:'2026-09-16'};
  const input=[later,event];
  assert.deepEqual(events.sortEventsByDeparture(input).map(x=>x.id),['one','later']);
  assert.equal(input[0],later);
});
