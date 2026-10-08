import { loadStoredGroups, saveStoredGroups } from '../storage/groups-storage';
import { usePersistedCollection } from './use-persisted-collection';

export function useGroups() {
  const storage = usePersistedCollection(loadStoredGroups, saveStoredGroups);
  return {
    groups: storage.items,
    isHydrated: storage.isHydrated,
    setGroups: storage.setItems,
    storage,
  };
}
