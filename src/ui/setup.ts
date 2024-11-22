import localforage from "localforage";
import { getMusicManager, MusicManager } from "../class/audio/MusicManager";
import { getSoundManager, initSoundManager } from "../class/audio/SoundManager";
import Modal from "./components/Modal";
import { Library } from "./pages/Library";
import Mii from "../external/mii-js/mii";
import { MiiEditor } from "../class/MiiEditor";
import { updateSettings } from "./pages/Settings";

export async function setupUi() {
  let mm = getMusicManager();

  updateSettings();

  let gn: GainNode;

  function playMusic() {
    mm.playSong("mii_maker_music", 0, 41.5, true, true, (source, gainNode) => {
      gn = gainNode;
      gainNode.gain.setValueAtTime(-1, mm.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        -0.6,
        mm.audioContext.currentTime + 2
      );
    });
  }

  mm.loadSong("./assets/aud/miimakermusic.mp3", "mii_maker_music").then(() => {
    playMusic();
    setTimeout(() => {
      if (mm.audioContext.state === "suspended") {
        Modal.alert(
          "Audio needs action",
          "Music will start playing on first click. You can press V to change sound volume (default is 0.35)"
        );
        document.onclick = () => {
          document.onclick = null;
          playMusic();
        };
      }
    }, 100);
  });

  await initSoundManager();

  if (location.search !== "") {
    const searchParams = new URLSearchParams(location.search);

    if (searchParams.has("data")) {
      new MiiEditor(
        0,
        (data, shutdownProperly) => {
          if (window.parent !== window) {
            // In iframe (UNTESTED)
            window.postMessage({
              type: "data-finalize",
              properSave: shutdownProperly,
              data,
            });
          } else {
            Library();
          }
        },
        searchParams.get("data")!
      );
    } else Library();
  } else Library();

  getSoundManager().setVolume(0.28);
  mm.setVolume(0.28);

  window.addEventListener("blur", () => {
    if (gn)
      gn.gain.linearRampToValueAtTime(
        -1,
        getMusicManager().audioContext.currentTime + 0.5
      );
    else getMusicManager().setVolume(0);
    getSoundManager().setVolume(0);
  });
  window.addEventListener("focus", () => {
    if (gn) {
      gn.gain.setValueAtTime(-1, mm.audioContext.currentTime);
      gn.gain.linearRampToValueAtTime(
        -0.6,
        getMusicManager().audioContext.currentTime + 0.5
      );
    } else getMusicManager().setVolume(0);
    getSoundManager().setVolume(0.28);
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
