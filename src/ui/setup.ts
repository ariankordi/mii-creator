import localforage from "localforage";
import { getMusicManager } from "../class/audio/MusicManager";
import {
  getSoundManager,
  setupSoundManager,
} from "../class/audio/SoundManager";
import Modal from "./components/Modal";
import { Library } from "./pages/Library";
import Mii from "../external/mii-js/mii";
import { MiiEditor } from "../class/MiiEditor";
import { updateSettings } from "./pages/Settings";
import { getMiiRender, MiiCustomRenderType } from "../util/miiImageUtils";
import { Buffer } from "../../node_modules/buffer/index";
import { SelectionLibrary } from "./pages/SelectionLibrary";

export async function setupUi() {
  let mm = getMusicManager();

  updateSettings(true);

  // for U theme
  let state: "main" | "edit" = "main";
  document.addEventListener("editor-launch", () => {
    state = "edit";
    setTimeout(() => {
      updateMusicVol();
    }, 100);
  });
  document.addEventListener("editor-shutdown", () => {
    state = "main";
    setTimeout(() => {
      updateMusicVol();
    }, 100);
  });

  function updateMusicVol() {
    if (mm.editGainNode === undefined) return;
    // a bit repetitive
    if (state === "main") {
      mm.mainGainNode.gain.linearRampToValueAtTime(
        -0.6,
        getMusicManager().audioContext.currentTime + 0.5
      );
      mm.editGainNode.gain.linearRampToValueAtTime(
        -1,
        getMusicManager().audioContext.currentTime + 0.5
      );
    }
    if (state === "edit") {
      mm.mainGainNode.gain.linearRampToValueAtTime(
        -1,
        getMusicManager().audioContext.currentTime + 0.5
      );
      mm.editGainNode.gain.linearRampToValueAtTime(
        -0.6,
        getMusicManager().audioContext.currentTime + 0.5
      );
    }
  }

  mm.initMusic();
  setupSoundManager();

  if (location.search !== "") {
    const searchParams = new URLSearchParams(location.search);

    // open editor with specific data
    if (searchParams.has("data")) {
      new MiiEditor(
        0,
        async (data, shutdownProperly) => {
          if (window.parent !== window.self) {
            // In iframe (UNTESTED)
            const miiData = new Mii(Buffer.from(data, "base64"));

            let headshot: string | null = null;
            let headOnly: string | null = null;
            let fullBody: string | null = null;

            if (shutdownProperly === true) {
              if (searchParams.has("renderTypes")) {
                const renderTypes = searchParams.get("renderTypes")!.split(",");

                if (renderTypes.includes("headshot")) {
                  headshot = (
                    await getMiiRender(
                      miiData,
                      MiiCustomRenderType.Head,
                      true,
                      false
                    )
                  ).src;
                }
                if (renderTypes.includes("headOnly")) {
                  headOnly = (
                    await getMiiRender(
                      miiData,
                      MiiCustomRenderType.HeadOnly,
                      true,
                      false
                    )
                  ).src;
                }
                if (renderTypes.includes("fullBody")) {
                  fullBody = (
                    await getMiiRender(
                      miiData,
                      MiiCustomRenderType.Body,
                      true,
                      false
                    )
                  ).src;
                }
              }
            }

            mm.mainGainNode.gain.linearRampToValueAtTime(
              -1,
              mm.audioContext.currentTime + 0.5
            );

            window.parent.postMessage(
              {
                type: "miic-data-finalize",
                properSave: shutdownProperly,
                data,
                name: miiData.miiName,
                creator: miiData.creatorName,
                headshot,
                headOnly,
                fullBody,
              },
              searchParams.get("origin")!
            );
          } else {
            Library();
          }
        },
        searchParams.get("data")!
      );
    } else if (searchParams.has("select")) {
      const miiData = await SelectionLibrary();

      console.log("selection:", miiData);

      let headshot: string | null = null;
      let headOnly: string | null = null;
      let fullBody: string | null = null;

      if (searchParams.has("renderTypes")) {
        const renderTypes = searchParams.get("renderTypes")!.split(",");

        if (renderTypes.includes("headshot")) {
          headshot = (
            await getMiiRender(miiData, MiiCustomRenderType.Head, true, false)
          ).src;
        }
        if (renderTypes.includes("headOnly")) {
          headOnly = (
            await getMiiRender(
              miiData,
              MiiCustomRenderType.HeadOnly,
              true,
              false
            )
          ).src;
        }
        if (renderTypes.includes("fullBody")) {
          fullBody = (
            await getMiiRender(miiData, MiiCustomRenderType.Body, true, false)
          ).src;
        }
      }

      window.parent.postMessage(
        {
          type: "miic-select",
          data: miiData.encode(),
          name: miiData.miiName,
          creator: miiData.creatorName,
          headshot,
          headOnly,
          fullBody,
        },
        location.origin
      );
    } else Library();
  } else Library();

  getSoundManager().setVolume(0.28);
  mm.setVolume(0.28);

  window.addEventListener("blur", () => {
    if (mm.mainGainNode) {
      mm.mainGainNode.gain.linearRampToValueAtTime(
        -1,
        getMusicManager().audioContext.currentTime + 0.5
      );
      if (mm.editGainNode) {
        mm.editGainNode.gain.linearRampToValueAtTime(
          -1,
          getMusicManager().audioContext.currentTime + 0.5
        );
      }
    } else getMusicManager().setVolume(0);
    getSoundManager().setVolume(0);
  });
  window.addEventListener("focus", () => {
    if (mm.mainGainNode) {
      if (state === "main") {
        mm.mainGainNode.gain.setValueAtTime(-1, mm.audioContext.currentTime);
        mm.mainGainNode.gain.linearRampToValueAtTime(
          -0.6,
          getMusicManager().audioContext.currentTime + 0.5
        );
      } else if (state === "edit") {
        if (mm.editGainNode) {
          mm.editGainNode.gain.setValueAtTime(-1, mm.audioContext.currentTime);
          mm.editGainNode.gain.linearRampToValueAtTime(
            -0.6,
            getMusicManager().audioContext.currentTime + 0.5
          );
        } else {
          mm.mainGainNode.gain.setValueAtTime(-1, mm.audioContext.currentTime);
          mm.mainGainNode.gain.linearRampToValueAtTime(
            -0.6,
            getMusicManager().audioContext.currentTime + 0.5
          );
        }
      }
    } else getMusicManager().setVolume(0);
    getSoundManager().setVolume(getSoundManager().previousVolume);
  });

  //@ts-expect-error
  window.MusicManager = getMusicManager();
  //@ts-expect-error
  window.soundManager = getSoundManager();

  document.addEventListener("keydown", (e) => {
    if (document.activeElement === document.body) {
      if (e.code === "KeyS") {
        Modal.modal(
          "sound test",
          "choose a sound",
          "body",
          ...Object.keys(getSoundManager().soundBufs).map((k) => ({
            text: k,
            callback() {
              getSoundManager().playSound(k);
              //@ts-expect-error used for debugging
              window.lastPlayedSound = k;
            },
          }))
        )
          .qs(".modal-content")!
          .style({ "max-width": "unset", "max-height": "unset" });
      }
      if (e.code === "KeyD") {
        // debug key enables debug options
        window.localforage = localforage;
        window.Mii = Mii;
      }
      if (e.code === "KeyV") {
        const vol = Number(
          prompt("Enter volume level from 0-1 (default is 0.35)")
        );

        if (vol < 0) return;
        if (vol > 1) return;

        getSoundManager().setVolume(vol);
        mm.setVolume(vol);
      }
    }
  });
}
