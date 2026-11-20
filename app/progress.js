const STORAGE_KEY = 'leonida-progress-v1';
const SPOILER_KEY = 'leonida-spoilers-v1';

export function loadProgress(trophies) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return validateProgress(saved, trophies);
  } catch { return new Set(); }
}

export function validateProgress(value, trophies) {
  const ids = Array.isArray(value) ? value : value?.earned;
  if (!Array.isArray(ids) || ids.some(id => !Number.isInteger(id) || !trophies.some(t => t.id === id))) {
    throw new Error('Choose a Leonida progress file containing valid trophy IDs.');
  }
  return new Set(ids);
}

export function saveProgress(earned) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned])); return true; }
  catch { return false; }
}

export function loadSpoilerSetting() {
  try { return localStorage.getItem(SPOILER_KEY) === 'true'; } catch { return false; }
}

export function saveSpoilerSetting(enabled) {
  try { localStorage.setItem(SPOILER_KEY, String(enabled)); } catch { /* Session setting still works. */ }
}

export function exportProgress(earned) {
  const payload = { format: 'leonida-progress-v1', earned: [...earned].sort((a, b) => a - b) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
