export type CollectionSnapshot<T> = {
  items: T[];
  isHydrated: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: boolean;
  saveError: boolean;
};

/** Keeps read failures distinct from a genuinely empty collection. */
export function createCollectionController<T>(
  load: () => Promise<T[]>,
  save: (items: T[]) => Promise<void>,
) {
  let snapshot: CollectionSnapshot<T> = {
    items: [],
    isHydrated: false,
    isLoading: true,
    isSaving: false,
    loadError: false,
    saveError: false,
  };
  const listeners = new Set<() => void>();
  let pendingLoad: Promise<void> | null = null;
  let writeQueue = Promise.resolve();
  let revision = 0;

  function publish(patch: Partial<CollectionSnapshot<T>>) {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  }

  function loadItems(): Promise<void> {
    if (snapshot.isHydrated) return Promise.resolve();
    if (pendingLoad) return pendingLoad;
    publish({ isLoading: true, loadError: false });
    pendingLoad = Promise.resolve()
      .then(load)
      .then((items) => {
        // Loading itself never writes, including after a successful retry.
        publish({
          items,
          isHydrated: true,
          isLoading: false,
          loadError: false,
        });
      })
      .catch(() => {
        publish({ isLoading: false, loadError: true });
      })
      .finally(() => {
        pendingLoad = null;
      });
    return pendingLoad;
  }

  function persist(): Promise<void> {
    if (!snapshot.isHydrated) return Promise.resolve();
    const items = snapshot.items;
    const currentRevision = ++revision;
    publish({ isSaving: true, saveError: false });
    writeQueue = writeQueue.then(async () => {
      try {
        await save(items);
        if (currentRevision === revision)
          publish({ isSaving: false, saveError: false });
      } catch {
        if (currentRevision === revision)
          publish({ isSaving: false, saveError: true });
      }
    });
    return writeQueue;
  }

  function setItems(update: T[] | ((current: T[]) => T[])) {
    // A failed startup read cannot be overwritten by edits or cleanup effects.
    if (!snapshot.isHydrated) return;
    const items =
      typeof update === 'function' ? update(snapshot.items) : update;
    if (items === snapshot.items) return;
    publish({ items });
    void persist();
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    load: loadItems,
    setItems,
    retrySave: persist,
  };
}
