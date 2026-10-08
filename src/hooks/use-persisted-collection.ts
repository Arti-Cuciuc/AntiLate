import { useEffect, useState, useSyncExternalStore } from 'react';
import { createCollectionController } from '../storage/collection-controller';

export function usePersistedCollection<T>(
  load: () => Promise<T[]>,
  save: (items: T[]) => Promise<void>,
) {
  const [controller] = useState(() => createCollectionController(load, save));
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  useEffect(() => {
    void controller.load();
  }, [controller]);
  return {
    ...state,
    setItems: controller.setItems,
    retryLoad: controller.load,
    retrySave: controller.retrySave,
  };
}
