import localforage from "localforage";
import Modal from "../../ui/components/Modal";

export const getMusicManager = () => mm;
export class MusicManager {
  SongBufs: Record<string, AudioBuffer>;
  audioContext: AudioContext;
  gainNode: GainNode;
  muted: boolean;
  previousVolume: number;

  constructor() {
    this.SongBufs = {};
    this.audioContext = new (window.AudioContext ||
      //@ts-ignore webkitaudiocontext exists
      window.webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.muted = false;
    this.previousVolume = 0.28;

    // prevent duplicate music
    setTimeout(() => {
      document.addEventListener("theme-change", () => {
        this.initMusic();
      });
    }, 2000);
    this.sources = [];
  }

  mainSource!: AudioBufferSourceNode;
  editSource!: AudioBufferSourceNode;
  mainGainNode!: GainNode;
  editGainNode!: GainNode;
  theme!: string;

  async initMusic() {
    this.sources.forEach((src) => src.stop());
    const theme =
      document.documentElement.dataset.theme !== undefined
        ? document.documentElement.dataset.theme
        : (await localforage.getItem("settings_wiiu")) === true
        ? "wiiu"
        : "default";
    this.theme = theme;

    console.error("initMusic()", theme, document.documentElement.dataset.theme);

    if (theme === "wiiu") {
      this.setVolume(0.65);
      this.previousVolume = 0.65;
      await this.loadSong("./assets/aud/ffl_app_menu.mp3", "mii_creator_music");
      await this.loadSong("./assets/aud/ffl_app_edit.mp3", "mii_editor_music");
    } else {
      this.setVolume(0.28);
      this.previousVolume = 0.28;
      await this.loadSong(
        "./assets/aud/miimakermusic.mp3",
        "mii_creator_music"
      );
    }

    this.initMusicReady();
  }

  initMusicReady() {
    this.playMusic();
    setTimeout(() => {
      if (this.audioContext.state === "suspended") {
        Modal.alert(
          "Audio needs action",
          "Music will start playing on first click. You can press V to change sound volume (default is 0.35)"
        );
        document.onclick = () => {
          document.onclick = null;
          this.playMusic();
        };
      }
    }, 100);
  }

  playMusic() {
    console.error("playMusic()");

    this.playSong(
      "mii_creator_music",
      0,
      100,
      true,
      true,
      (source, gainNode) => {
        this.mainSource = source;
        this.mainGainNode = gainNode;
        if (this.theme !== "wiiu") {
          //@ts-expect-error
          this.editSource = undefined;
          //@ts-expect-error
          this.editGainNode = undefined;
        }
        gainNode.gain.setValueAtTime(-1, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          -0.6,
          this.audioContext.currentTime + 2
        );
      }
    );
    if (this.theme === "wiiu")
      this.playSong(
        "mii_editor_music",
        0,
        100,
        true,
        true,
        (source, gainNode) => {
          this.editSource = source;
          this.editGainNode = gainNode;
          gainNode.gain.setValueAtTime(-1, this.audioContext.currentTime);
        }
      );
  }

  // playMain() {
  //   if (this.mainSource) {
  //     this.mainSource.stop();
  //   }
  //   if (this.editSource) {
  //     this.editGainNode.gain.linearRampToValueAtTime(
  //       -1,
  //       this.audioContext.currentTime + 1
  //     );
  //     this.editSource.stop(this.audioContext.currentTime + 1);
  //   }
  //   this.playSong(
  //     "mii_creator_music",
  //     0,
  //     100,
  //     true,
  //     true,
  //     (source, gainNode) => {
  //       this.mainSource = source;
  //       this.mainGainNode = gainNode;
  //       gainNode.gain.setValueAtTime(-1, this.audioContext.currentTime);
  //       gainNode.gain.linearRampToValueAtTime(
  //         -0.6,
  //         this.audioContext.currentTime + 2
  //       );
  //     }
  //   );
  // }
  // playEdit() {
  //   if (this.editSource) {
  //     this.editSource.stop();
  //   }
  //   if (this.mainSource) {
  //     this.mainGainNode.gain.linearRampToValueAtTime(
  //       -1,
  //       this.audioContext.currentTime + 1
  //     );
  //     this.mainSource.stop(this.audioContext.currentTime + 1);
  //   }
  //   this.playSong(
  //     "mii_editor_music",
  //     0,
  //     100,
  //     true,
  //     true,
  //     (source, gainNode) => {
  //       this.editSource = source;
  //       this.editGainNode = gainNode;
  //       gainNode.gain.setValueAtTime(-1, this.audioContext.currentTime);
  //     }
  //   );
  // }

  async loadSong(url: string, name: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.SongBufs[name] = audioBuffer;
  }

  sources: AudioBufferSourceNode[];

  playSong(
    name: string,
    loopStart: number | null = null,
    loopEnd: number | null = null,
    loops: boolean = true,
    autoPlay: boolean = true,
    callbackBeforeStart?: (
      source: AudioBufferSourceNode,
      gainNode: GainNode
    ) => void
  ): { source: AudioBufferSourceNode; gainNode: GainNode } | null {
    const SongBuffer = this.SongBufs[name];
    if (!SongBuffer) {
      console.error(`Song "${name}" not found.`);
      return null;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = SongBuffer;
    source.connect(this.gainNode);
    if (loops === true) source.loop = true;
    if (loopStart !== null) source.loopStart = loopStart;
    if (loopEnd !== null) source.loopEnd = loopEnd;
    this.sources.push(source);

    const gainNode = this.audioContext.createGain();
    source.connect(gainNode);
    gainNode.connect(this.gainNode);

    if (callbackBeforeStart) {
      callbackBeforeStart(source, gainNode);
    }

    if (autoPlay) {
      source.start();
    }

    return { source, gainNode };
  }

  stopSong() {
    // Stop any playing Song
    this.audioContext.suspend();
  }

  setVolume(volume: number) {
    if (this.muted) return;
    this.gainNode.gain.value = volume;
  }

  mute() {
    if (this.muted) return;
    this.previousVolume = this.gainNode.gain.value;
    this.setVolume(0);
    this.muted = true;
  }
  unmute() {
    if (this.muted === false) return;
    this.muted = false;
    this.setVolume(this.previousVolume);
  }
}

let mm: MusicManager = new MusicManager();
