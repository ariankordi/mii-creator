// Adapted from my language manager used in Cherry Tree TV
import localforage from "localforage";

let lang = (await localforage.getItem("settings_language")) || "en_US";
let strings: Record<string, any> = {};

export const langList = ["en_US"];

try {
  let languageModule = (await import(`./lang/${lang}.js`)).default;
  localforage.setItem("language", lang);
  strings = languageModule;
} catch (e) {
  console.log("error");
}


export const langManager = {
  async setLanguage(lang: string) {
    try {
      let languageModule = (await import(`./${lang}.js`)).default;
      await localforage.setItem("language", lang);
      strings = languageModule;
    } catch (e) {
      console.log("Failed to load strings!");
    }
  },
  getLanguage() {
    return lang;
  },
  getString(path: string, replacements: Record<string, any> = {}) {
    const parts = path.split(".");
    let current = strings;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (typeof current[part] === "undefined") {
        return path as string;
      }
      current = current[part];
    }
    if (typeof current === "string") {
      for (const key in replacements) {
        current = current.replace(`%${key}%`, replacements[key]);
      }
    }
    if (current === null || current === undefined) {
      return path as string;
    }
    return current as any as string;
  },
};
export const getString = (
  path: string,
  replacements: Record<string, any> = {}
) => langManager.getString(path, replacements);

//@ts-expect-error
window.langManager = langManager;
//@ts-expect-error
window.getString = getString;