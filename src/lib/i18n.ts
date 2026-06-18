const messages: Record<string, Record<string, string>> = {
  en: {
    "button.cancel": "Cancel",
    "button.save": "Save",
    "button.saving": "Saving...",
    "button.adding": "Adding...",
    "button.add_new_experience": "New experience",
    "button.edit": "Edit",
    "button.editing": "Editing...",
    "button.delete": "Delete",
    "button.deleting": "Deleting...",
    "dialog.add_title": "New experience",
    "dialog.edit_title": "Edit experience",
  },
};

export function t(key: string, locale = "en") {
  return messages[locale]?.[key] ?? key;
}
