import localforage from "localforage";
import { settingsInfo } from "../ui/pages/Settings";

export const getSetting = async (key: string) => {
  const result = await localforage.getItem("settings_" + key);
  // Null fix
  if (result === null) {
    return settingsInfo[key].default;
  } else return result;
};
