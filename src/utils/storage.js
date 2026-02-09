const STORAGE_KEY = 'moms-journal-entries';

export function getEntries() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry) {
  const entries = getEntries();
  const newEntry = {
    id: crypto.randomUUID(),
    text: entry.text,
    photo: entry.photo || null,
    createdAt: new Date().toISOString(),
    mood: entry.mood || null,
  };
  entries.unshift(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return newEntry;
}

export function deleteEntry(id) {
  const entries = getEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entries;
}

export function getEntryById(id) {
  return getEntries().find((e) => e.id === id) || null;
}
