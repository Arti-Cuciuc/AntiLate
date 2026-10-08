const test = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-typescript.cjs');

function setup() {
  let state = {plans:{},activeAlarm:null,soundEnabled:false};
  const cancelled = [], scheduled = [];
  let stopped = 0;
  const api = {
    createChannel:async()=>{},getNotificationSettings:async()=>({authorizationStatus:1,android:{alarm:1}}),
    isBatteryOptimizationEnabled:async()=>false,getChannel:async()=>({vibration:true,importance:4}),
    getTriggerNotifications:async()=>[],createTriggerNotification:async(n,t)=>{scheduled.push({notification:n,trigger:t});return n.id;},
    cancelNotification:async id=>cancelled.push(id),stopForegroundService:async()=>{},getInitialNotification:async()=>null,
  };
  const native={canUseFullScreenIntent:()=>true,hasVibrator:()=>true,startAlarmVibration:()=>{},stopAlarmVibration:()=>{stopped++;}};
  const pkg={default:api,AndroidImportance:{HIGH:4},AndroidVisibility:{PUBLIC:1},AndroidCategory:{ALARM:'alarm'},
    AuthorizationStatus:{AUTHORIZED:1},AndroidNotificationSetting:{DISABLED:0},TriggerType:{TIMESTAMP:0},AlarmType:{SET_EXACT_AND_ALLOW_WHILE_IDLE:0}};
  const load = createLoader({
    'react-native':{Platform:{OS:'android'}},'../../modules/antilate-alarm/src':native,
    '../storage/templates-storage':{loadStoredTemplates:async()=>[]},
    '../storage/notifications-storage':{
      loadNotificationState:async()=>structuredClone(state),
      updateNotificationState:async f=>{state=await f(state);return state;},
      setStoredActiveAlarm:async alarm=>{state.activeAlarm=alarm;},setNotificationSoundEnabled:async enabled=>{state.soundEnabled=enabled;},
    },
    './notifee-runtime':{getNotifeePackage:()=>pkg,hasNotificationRuntime:()=>true},
  });
  return {service:load('src/notifications/notification-service.ts'),plan:load('src/utils/notification-plan.ts'),api,cancelled,scheduled,
    get state(){return state;},get stopped(){return stopped;}};
}

test('stale notification action cannot stop current alarm', async()=>{
  const s=setup();
  s.state.activeAlarm=s.plan.createTestAlarmPayload(Date.now());
  await s.service.performAlarmAction({...s.state.activeAlarm,notificationId:'old'},'acknowledge');
  assert.equal(s.stopped,0);
  assert.ok(s.state.activeAlarm);
  assert.deepEqual(s.cancelled,['old']);
});
test('expired stored alarm is cleared on launch', async()=>{
  const s=setup();
  s.state.activeAlarm=s.plan.createTestAlarmPayload(Date.now()-7200000);
  assert.equal(await s.service.restoreActiveAlarmFromLaunch(),null);
  assert.equal(s.state.activeAlarm,null);
});
test('concurrent sync is idempotent and sound migration preserves midpoint trigger',async()=>{
  const s=setup();
  const date=new Date(Date.now()+86400000);
  const event={id:'one',place:'Тест',eventDate:`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`,arrivalTime:'13:15',leaveTime:'13:00',travelMinutes:15,preparationMinutes:10,state:'planned',groupId:null};
  await Promise.all([s.service.syncMeetingNotifications([event],[]),s.service.syncMeetingNotifications([event],[])]);
  assert.equal(s.scheduled.length,2);
  const payload=s.plan.createAlarmPayload(event,'midpoint');
  const trigger={type:0,timestamp:payload.midpointTimestamp};
  s.api.getTriggerNotifications=async()=>[{notification:{id:payload.notificationId,data:s.plan.serializeAlarmPayload(payload)},trigger}];
  s.state.plans.one.midpointNotificationId=payload.notificationId;
  s.state.soundEnabled=true;
  await s.service.syncMeetingNotifications([event],[]);
  assert.equal(s.scheduled.length,3);
  assert.deepEqual(s.scheduled[2].trigger,trigger);
  assert.equal(s.cancelled.length,0);
  assert.equal(s.state.plans.one.midpointNotificationId,payload.notificationId);
});
