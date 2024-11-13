let promiseList = new Map<string, Promise<string | false>>();

// UNFINISHED, DO NOT USE YET
export default {
  configuration: {
    music: true,
  },
  async editMii(
    data: string = "AwEAAAAAAAAAAAAAgP9wmQAAAAAAAAAAAABNAGkAaQAAAAAAAAAAAAAAAAAAAEBAAAAhAQJoRBgmNEYUgRIXaA0AACkAUkhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMNn",
    fullscreen: boolean = true
  ) {
    const frame = document.createElement("iframe");
    if (fullscreen) {
      frame.style.width = `${window.innerWidth}px`;
      frame.style.height = `${window.innerHeight}px`;
      frame.style.top = "0";
      frame.style.left = "0";
      frame.style.border = "0";
      frame.style.position = "fixed";
      frame.style.zIndex = "99999";
      document.body.appendChild(frame);
    }

    frame.src = `${import.meta.url.replace(
      "dist/api.js",
      ""
    )}?data=${encodeURIComponent(data)}`;

    return frame;
  },
  newMii(gender: "male" | "female" = "male") {
    switch (gender) {
      case "male":
        return this.editMii(
          "AwEAAAAAAAAAAAAAgP9wmQAAAAAAAAAAAABNAGkAaQAAAAAAAAAAAAAAAAAAAEBAAAAhAQJoRBgmNEYUgRIXaA0AACkAUkhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMNn"
        );
      case "female":
        return this.editMii(
          "AwEAAAAAAAAAAAAAgN8ZmgAAAAAAAAAAAQBNAGkAaQAAAAAAAAAAAAAAAAAAAEBAAAAMAQRoQxggNEYUgRIXaA0AACkAUkhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFik"
        );
    }
  },
  configure(newConfiguration: Record<string, any>) {
    // Set music state
    if (
      newConfiguration.music !== undefined &&
      typeof newConfiguration.music === "boolean"
    ) {
      this.configuration.music = newConfiguration.music;
    }
  },
};
