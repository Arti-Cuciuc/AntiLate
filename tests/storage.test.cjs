const test = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-typescript.cjs');

test('notification writes are serialized without losing settings', async () => {
  let value = null;
  const load = createLoader({'@react-native-async-storage/async-storage':{
    getItem:async()=>value,setItem:async(_key,next)=>{value=next;},
  }});
  const storage = load('src/storage/notifications-storage.ts');
  await Promise.all([
    storage.setNotificationSoundEnabled(true),
    storage.updateNotificationState(state=>({...state,activeAlarm:null})),
  ]);
  assert.equal((await storage.loadNotificationState()).soundEnabled,true);
});
test('failed notification write is reported and does not poison queue', async () => {
  let fail = true;
  const load = createLoader({'@react-native-async-storage/async-storage':{
    getItem:async()=>null,setItem:async()=>{if(fail) throw Error('disk full');},
  }});
  const storage = load('src/storage/notifications-storage.ts');
  await assert.rejects(storage.setNotificationSoundEnabled(true), /disk full/);
  fail=false;
  await storage.setNotificationSoundEnabled(false);
});
