import { MAX_TEMPLATES } from '../constants/templates';
import {
  loadStoredTemplates,
  saveStoredTemplates,
} from '../storage/templates-storage';
import type { MeetingTemplate } from '../types/template';
import { usePersistedCollection } from './use-persisted-collection';

export function useTemplates() {
  const storage = usePersistedCollection(
    loadStoredTemplates,
    saveStoredTemplates,
  );
  const { items: templates, setItems: setTemplates, isHydrated } = storage;

  const addTemplate = (template: MeetingTemplate) => {
    setTemplates((currentTemplates) => {
      if (
        currentTemplates.length >= MAX_TEMPLATES ||
        currentTemplates.some(
          (currentTemplate) => currentTemplate.id === template.id,
        )
      ) {
        return currentTemplates;
      }

      return [template, ...currentTemplates];
    });
  };

  const updateTemplate = (template: MeetingTemplate) => {
    setTemplates((currentTemplates) =>
      currentTemplates.map((currentTemplate) =>
        currentTemplate.id === template.id ? template : currentTemplate,
      ),
    );
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates((currentTemplates) =>
      currentTemplates.filter((template) => template.id !== templateId),
    );
  };

  const unassignDeletedGroups = (deletedGroupIds: string[]) => {
    const deletedIds = new Set(deletedGroupIds);

    if (deletedIds.size === 0) {
      return;
    }

    setTemplates((currentTemplates) =>
      currentTemplates.map((template) =>
        template.groupId !== null && deletedIds.has(template.groupId)
          ? { ...template, groupId: null }
          : template,
      ),
    );
  };

  return {
    storage,
    addTemplate,
    deleteTemplate,
    isHydrated,
    templates,
    unassignDeletedGroups,
    updateTemplate,
  };
}
