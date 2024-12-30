import Mii from "../../external/mii-js/mii";
import { AddButtonSounds } from "../../util/AddButtonSounds";
import { Button } from "../components/Button";
import {
  FeatureSetType,
  MiiPagedFeatureSet,
} from "../components/MiiPagedFeatureSet";
import Modal from "../components/Modal";
import { Buffer as Buf } from "../../../node_modules/buffer/index";
import { RenderPart } from "../../class/MiiEditor";
import Html from "@datkat21/html";
import localforage from "localforage";
import { getMusicManager } from "../../class/audio/MusicManager";
import { getSoundManager } from "../../class/audio/SoundManager";
import { Library } from "./Library";

export const updateSettings = async (force: boolean = false) => {
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
  if (
    prevSetting["wiiu"] !== (await localforage.getItem("settings_wiiu")) ||
    force
  ) {
    setTimeout(async () => {
      document.dispatchEvent(new CustomEvent("theme-change"));
    }, 33.33);
  }
};

let prevSetting: Record<string, any> = {};

export const settingsInfo: Record<string, any> = {
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
  editMode: {
    type: "multi",
    label: "Editing Mode",
    description: "Changes the default edit mode option.",
    default: "3d",
    choices: [
      { label: "2D", value: "2d" },
      { label: "3D (default)", value: "3d" },
    ],
  },
  shaderType: {
    type: "multi",
    label: "Shader Type",
    description: "Sorry that most of the shaders are not yet ready for use.",
    default: "wiiu",
    choices: [
      { label: "No Lighting", value: "lightDisabled" },
      { label: "Simple", value: "none" },
      { label: "Wii U (default)", value: "wiiu" },
      { label: "Switch (WIP)", value: "switch", disabled: true },
      { label: "Miitomo", value: "miitomo", disabled: true },
    ],
  },
  bodyModel: {
    type: "multi",
    label: "Body Model",
    description:
      "Pose selections are different depending on the body model you use.\n* Does not apply to 2D mode.",
    default: "wiiu",
    choices: [
      { label: "Wii U (default)", value: "wiiu" },
      { label: "Switch", value: "switch", disabled: true },
      { label: "Miitomo", value: "miitomo", disabled: true },
    ],
  },
  saveData: {
    type: "non-settings-multi",
    label: "Save Data",
    description: "Not implemented yet.",
    choices: [
      {
        label: "Import",
        async select() {
          if (
            (await Modal.prompt(
              "WARNING",
              "This will overwrite ALL of your currently saved Miis and delete them forever! Please back up your save data before using this option.\n\nAre you certain that you understand the risk?",
              "body"
            )) === false
          )
            return;

          const input = document.createElement("input");
          input.type = "file";
          input.accept = "application/json";
          document.body.appendChild(input);
          input.click();
          requestAnimationFrame(() => {
            document.body.removeChild(input);
          });
          input.addEventListener("change", async (e) => {
            if (input.files === null) return;
            if (input.files[0] === undefined) return;
            console.log(input.files);

            const reader = new FileReader();

            reader.onload = function (event) {
              const fileContent = event.target!.result;
              console.log(fileContent);
            };

            reader.onerror = function (event) {
              console.error("File reading error:", event);
            };

            reader.readAsText(input.files[0]);
          });
        },
        disabled: true,
      },
      {
        label: "Export",
        async select() {
          let data: Record<string, string> = {};
          for (const key of (await localforage.keys()).filter((k) =>
            k.startsWith("mii")
          )) {
            console.log(key);
            data[key] = (await localforage.getItem(key)) as string;
          }
          console.log(data);
          const url = URL.createObjectURL(
            new Blob([JSON.stringify(data)], { type: "application/json" })
          );
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.download = "mii-editor-save-data.json";
          document.body.appendChild(a);
          a.click();
          requestAnimationFrame(() => {
            a.remove();
          });
        },
        disabled: true,
      },
      {
        label: "Delete",
        type: "danger",
        async select() {},
        disabled: true,
      },
    ],
  },
};

const prefix = "settings_";

for (const key in settingsInfo) {
  let prefixedKey = prefix + key;
  prevSetting[key] = await localforage.getItem(prefixedKey);
}

export async function Settings() {
  const modal = Modal.modal("Settings", "", "body", {
    text: "Cancel",
    callback(e) {
      // Library();
    },
  });

  const modalBody = modal.qs(".modal-body")!.clear();
  // fix wii u theme center-aligning items
  modalBody.elm.style.setProperty("align-items", "flex-start", "important");

  for (const key in settingsInfo) {
    let prefixedKey = prefix + key;

    if ((await localforage.getItem(prefixedKey)) === null) {
      await localforage.setItem(prefixedKey, settingsInfo[key].default);
    }

    prevSetting[key] = await localforage.getItem(prefixedKey);

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
                prevSetting[key] = await localforage.getItem(prefixedKey);
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
      case "multi":
        const val = await localforage.getItem(prefixedKey);
        modalBody.appendMany(
          new Html("label").text(settingsInfo[key].label),
          new Html("small").text(settingsInfo[key].description),
          new Html("div").class("flex-group").appendMany(
            ...settingsInfo[key].choices.map((c: any) => {
              const button = AddButtonSounds(
                new Html("button")
                  .class(
                    c.value === val ? "selected-setting" : (undefined as any)
                  )
                  .attr({ "data-setting": prefixedKey })
                  .text(c.label)
                  .on("click", async (e) => {
                    prevSetting[key] = await localforage.getItem(prefixedKey);
                    await localforage.setItem(prefixedKey, c.value);
                    updateSettings();
                    const t = e.target as HTMLElement;
                    t.parentElement!.querySelectorAll(
                      `[data-setting="${prefixedKey}"]`
                    ).forEach((p) => {
                      p.classList.remove("selected-setting");
                    });
                    t.classList.add("selected-setting");
                  }),
                "hover",
                "select_misc"
              );

              if (c.disabled) {
                button.attr({ disabled: true });
              }

              return button;
            })
          )
        );
        break;
      case "non-settings-multi":
        modalBody.appendMany(
          new Html("label").text(settingsInfo[key].label),
          new Html("small").text(settingsInfo[key].description),
          new Html("div").class("flex-group").appendMany(
            ...settingsInfo[key].choices.map((c: any) => {
              const button = AddButtonSounds(
                new Html("button")
                  .attr({ disabled: c.disabled })
                  .class(c.type)
                  .text(c.label)
                  .on("click", async (e) => {
                    c.select();
                  }),
                "hover",
                "select_misc"
              );

              if (c.disabled) {
                button.attr({ disabled: true });
              }

              return button;
            })
          )
        );
        break;
    }
  }
}
