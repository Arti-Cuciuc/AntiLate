const test = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-typescript.cjs');
const flush = () => new Promise((resolve) => setImmediate(resolve));

const cases = [
  {
    name: 'events',
    file: 'src/storage/eventsStorage.ts',
    load: 'loadStoredEvents',
    save: 'saveStoredEvents',
    key: '@antilate/events/v2',
    item: {
      id: 'one',
      place: 'Университет',
      eventDate: '2040-09-15',
      arrivalTime: '13:15',
      leaveTime: '13:00',
      travelMinutes: 15,
      preparationMinutes: 10,
      state: 'planned',
      groupId: null,
    },
  },
  {
    name: 'groups',
    file: 'src/storage/groups-storage.ts',
    load: 'loadStoredGroups',
    save: 'saveStoredGroups',
    key: '@antilate/groups/v1',
    item: { id: 'one', name: 'Работа', color: '#38BDF8' },
  },
  {
    name: 'templates',
    file: 'src/storage/templates-storage.ts',
    load: 'loadStoredTemplates',
    save: 'saveStoredTemplates',
    key: '@antilate/templates/v1',
    item: {
      id: 'one',
      name: 'Университет',
      place: 'Университет',
      travelMinutes: 15,
      preparationMinutes: 10,
      groupId: null,
      createdAt: 1,
      recurrence: { isEnabled: false, weekdays: [] },
    },
  },
];

function setup(spec, initial) {
  const disk = new Map(initial === null ? [] : [[spec.key, initial]]);
  let readFails = false,
    writeFails = false;
  const writes = [];
  const load = createLoader({
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => {
        if (readFails) throw new Error('temporary read failure');
        return disk.get(key) ?? null;
      },
      setItem: async (key, value) => {
        if (writeFails) throw new Error('disk full');
        writes.push({ key, value });
        disk.set(key, value);
      },
    },
  });
  const storage = load(spec.file);
  const { createCollectionController } = load(
    'src/storage/collection-controller.ts',
  );
  const controller = createCollectionController(
    storage[spec.load],
    storage[spec.save],
  );
  return {
    controller,
    storage,
    disk,
    writes,
    setReadFails: (value) => {
      readFails = value;
    },
    setWriteFails: (value) => {
      writeFails = value;
    },
  };
}

for (const spec of cases) {
  test(`${spec.name}: first launch is genuinely empty, with no hydration write`, async () => {
    const s = setup(spec, null);
    await s.controller.load();
    assert.equal(s.controller.getSnapshot().isHydrated, true);
    assert.deepEqual(s.controller.getSnapshot().items, []);
    assert.equal(s.writes.length, 0);
  });

  test(`${spec.name}: failed read cannot overwrite data; retry restores it`, async () => {
    const original = JSON.stringify([spec.item]);
    const s = setup(spec, original);
    s.setReadFails(true);
    await s.controller.load();
    assert.equal(s.controller.getSnapshot().isHydrated, false);
    assert.equal(s.controller.getSnapshot().loadError, true);
    s.controller.setItems([]);
    await s.controller.retrySave();
    assert.equal(s.writes.length, 0);
    assert.equal(s.disk.get(spec.key), original);
    s.setReadFails(false);
    await s.controller.load();
    assert.equal(s.controller.getSnapshot().loadError, false);
    assert.equal(s.controller.getSnapshot().items[0].id, spec.item.id);
    assert.equal(s.writes.length, 0);
  });

  test(`${spec.name}: invalid JSON or wrong root cannot be saved as an empty list`, async () => {
    for (const original of ['', '{broken', '{}', 'null', '[null]']) {
      const s = setup(spec, original);
      await s.controller.load();
      s.controller.setItems([]);
      await s.controller.retrySave();
      assert.equal(s.controller.getSnapshot().loadError, true);
      assert.equal(s.controller.getSnapshot().isHydrated, false);
      assert.equal(s.disk.get(spec.key), original);
      assert.equal(s.writes.length, 0);
    }
  });

  test(`${spec.name}: failed write is visible, retains edits, and retries successfully`, async () => {
    const s = setup(spec, '[]');
    await s.controller.load();
    s.setWriteFails(true);
    s.controller.setItems([spec.item]);
    await flush();
    assert.equal(s.controller.getSnapshot().saveError, true);
    assert.equal(s.controller.getSnapshot().items[0].id, spec.item.id);
    assert.equal(s.disk.get(spec.key), '[]');
    s.setWriteFails(false);
    await s.controller.retrySave();
    assert.equal(s.controller.getSnapshot().saveError, false);
    assert.equal((await s.storage[spec.load]())[0].id, spec.item.id);
  });
}

test('rapid edits are written in order and an old success cannot hide a newer failure', async () => {
  const { createCollectionController } = createLoader()(
    'src/storage/collection-controller.ts',
  );
  let releaseFirst;
  const first = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const writes = [];
  let fail = true;
  const controller = createCollectionController(
    async () => [],
    async (items) => {
      writes.push(items);
      if (writes.length === 1) await first;
      else if (fail) throw new Error('disk full');
    },
  );
  await controller.load();
  controller.setItems(['old']);
  controller.setItems(['latest']);
  await flush();
  assert.deepEqual(writes, [['old']]);
  releaseFirst();
  await flush();
  assert.equal(controller.getSnapshot().saveError, true);
  assert.deepEqual(controller.getSnapshot().items, ['latest']);
  fail = false;
  await controller.retrySave();
  assert.deepEqual(writes, [['old'], ['latest'], ['latest']]);
  assert.equal(controller.getSnapshot().saveError, false);
});
