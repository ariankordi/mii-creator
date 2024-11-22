import Mii from "../../external/mii-js/mii";
import { AddButtonSounds } from "../../util/AddButtonSounds";
import { Button } from "../components/Button";
import {
  FeatureSetType,
  MiiPagedFeatureSet,
} from "../components/MiiPagedFeatureSet";
import Modal from "../components/Modal";
import { MainMenu } from "./MainMenu";
import { Buffer as Buf } from "../../../node_modules/buffer/index";
import { RenderPart } from "../../class/MiiEditor";
import Html from "@datkat21/html";
import localforage from "localforage";
import { getMusicManager } from "../../class/audio/MusicManager";
import { getSoundManager } from "../../class/audio/SoundManager";

export const updateSettings = async () => {
  // Background Music
  let useBgm = await localforage.getItem("settings_bgm");
  if (useBgm === true) getMusicManager().unmute();
  else if (useBgm === false) getMusicManager().mute();
  // Sound Effects
  let useSfx = await localforage.getItem("settings_sfx");
  if (useSfx === true) getSoundManager().unmute();
  else if (useSfx === false) getSoundManager().mute();
  // Wii U Theme
  document.documentElement.dataset.theme =
    (await localforage.getItem("settings_wiiu")) === true ? "wiiu" : "normal";
  setTimeout(() => {
    document.dispatchEvent(new CustomEvent("theme-change"));
  }, 33.33);
};

const settingsInfo: Record<string, any> = {
  bgm: {
    type: "checkbox",
    label: "Background Music",
    default: true,
  },
  sfx: {
    type: "checkbox",
    label: "Sound Effects",
    default: true,
  },
  wiiu: {
    type: "checkbox",
    label: "Enable Wii U theme",
    default: false,
  },
  cameraPan: {
    type: "checkbox",
    label: "Static camera in editor",
    default: false,
  },
};

export async function Settings() {
  const modal = Modal.modal("Settings", "", "body", {
    text: "Cancel",
    callback(e) {
      MainMenu();
    },
  });

  const modalBody = modal.qs(".modal-body")!.clear();

  const prefix = "settings_";

  for (const key in settingsInfo) {
    let prefixedKey = prefix + key;

    if ((await localforage.getItem(prefixedKey)) === null) {
      await localforage.setItem(prefixedKey, settingsInfo[key].default);
    }

    switch (settingsInfo[key].type) {
      case "checkbox":
        modalBody.append(
          new Html("div").class("flex-group").appendMany(
            new Html("input")
              .attr({
                id: prefixedKey,
                type: "checkbox",
                checked:
                  (await localforage.getItem(prefixedKey)) === true
                    ? true
                    : undefined,
              })
              .on("input", async (e) => {
                await localforage.setItem(
                  prefixedKey,
                  (e.target as HTMLInputElement).checked
                );
                updateSettings();
              }),
            new Html("label")
              .attr({ for: prefixedKey })
              .text(settingsInfo[key].label)
          )
        );
        break;
    }
  }
}
