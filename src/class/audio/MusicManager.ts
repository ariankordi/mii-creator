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
  }

  async loadSong(url: string, name: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.SongBufs[name] = audioBuffer;
  }

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
    if (this.muted===false) return;
    this.muted = false;
    this.setVolume(this.previousVolume);
  }
}

let mm: MusicManager = new MusicManager();
