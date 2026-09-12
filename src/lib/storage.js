// This project started as a Claude.ai artifact, which persists data through
// a sandboxed `window.storage` API instead of the browser's real
// localStorage. That API isn't available outside Claude.ai, so this module
// re-implements the same shape (get/set/delete/list) on top of real
// localStorage — the rest of the app's code (App.jsx) didn't need to change.
//
// Note `get` throws for a missing key rather than resolving to null, to
// match the original API's documented behavior — callers already handle
// this with try/catch.

function readKeys() {
  try {
    return JSON.parse(localStorage.getItem("__team_roster_keys__") || "[]");
  } catch {
    return [];
  }
}

function writeKeys(keys) {
  localStorage.setItem("__team_roster_keys__", JSON.stringify(Array.from(new Set(keys))));
}

export const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    if (value === null) {
      throw new Error(`Key not found: ${key}`);
    }
    return { key, value };
  },

  async set(key, value) {
    localStorage.setItem(key, value);
    writeKeys([...readKeys(), key]);
    return { key, value };
  },

  async delete(key) {
    localStorage.removeItem(key);
    writeKeys(readKeys().filter((k) => k !== key));
    return { key, deleted: true };
  },

  async list(prefix = "") {
    return { keys: readKeys().filter((k) => k.startsWith(prefix)) };
  },
};
