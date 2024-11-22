import Mii from "../external/mii-js/mii";
import { Buffer } from "../../node_modules/buffer/index";
import Html from "@datkat21/html";
import { TabList } from "../ui/components/TabList";
import EditorIcons from "../constants/EditorIcons";
import { CameraPosition, Mii3DScene } from "./3DScene";
import { EyeTab } from "../ui/tabs/Eye";
import { HeadTab } from "../ui/tabs/Head";
import type { TabBase, TabRenderInit } from "../constants/TabRenderType";
import { EmptyTab } from "../ui/tabs/Empty";
import { MiscTab } from "../ui/tabs/Misc";
import { NoseTab } from "../ui/tabs/Nose";
import { FavoriteColorTab } from "../ui/tabs/FavoriteColor";
import { MouthTab } from "../ui/tabs/Mouth";
import { HairTab } from "../ui/tabs/Hair";
import {
  MiiEyeColorTable,
  MiiFavoriteColorIconTable,
  MiiFavoriteColorLookupTable,
  MiiGlassesColorIconTable,
  MiiHairColorTable,
  MiiMouthColorLipTable,
  MiiMouthColorTable,
  SwitchMiiColorTable,
  SwitchMiiColorTableLip,
} from "../constants/ColorTables";
import { ScaleTab } from "../ui/tabs/Scale";
import Modal from "../ui/components/Modal";
import { playSound } from "./audio/SoundManager";
import { AddButtonSounds } from "../util/AddButtonSounds";
import { FacialHairTab } from "../ui/tabs/FacialHair";
import { MoleTab } from "../ui/tabs/Mole";
import { EyebrowTab } from "../ui/tabs/Eyebrow";
import { GlassesTab } from "../ui/tabs/Glasses";
import localforage from "localforage";
import { Config } from "../config";
import { OptionsTab } from "../ui/tabs/Options";
import { ExtHatTab } from "../ui/tabs/ExtHat";

export enum MiiGender {
  Male,
  Female,
}
export enum RenderMode {
  Image,
  ThreeJs,
}
export type IconSet = {
  face: string[];
  makeup: string[];
  wrinkles: string[];
  eyebrows: string[];
  eyes: string[];
  nose: string[];
  mouth: string[];
  mustache: string[];
  goatee: string[];
  hair: string[];
  glasses: string[];
  hat: string[];
};

export enum RenderPart {
  Head,
  Face,
}

let activeMii: Mii;
export const getMii = () => activeMii;

export class MiiEditor {
  mii: Mii;
  icons!: IconSet;

  ui!: {
    base: Html;
    mii: Html;
    scene: Mii3DScene;
    tabList: Html;
    tabContent: Html;
  };

  dirty: boolean;
  ready: boolean;

  renderingMode: RenderMode;
  onShutdown!: (mii: string, shutdownProperly?: boolean) => any | Promise<any>;
  errors: Map<string, boolean>;

  constructor(
    gender: MiiGender,
    onShutdown?: (
      mii: string,
      shutdownProperly?: boolean
    ) => any | Promise<any>,
    init?: string
  ) {
    window.editor = this;

    // localforage.keys().then((k) => {
    //   if (k.find((key) => key.startsWith("mii")) === undefined) {
    //     // todo
    //   }
    // });

    this.#loadSoundLoop();
    this.dirty = false;
    this.ready = false;
    this.errors = new Map();

    // default male mii
    let initString =
      "AwEAAAAAAAAAAAAAgP9wmQAAAAAAAAAAAABNAGkAaQAAAAAAAAAAAAAAAAAAAEBAAAAhAQJoRBgmNEYUgRIXaA0AACkAUkhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMNn";
    if (gender === MiiGender.Female) {
      initString =
        "AwEAAAAAAAAAAAAAgN8ZmgAAAAAAAAAAAQBNAGkAaQAAAAAAAAAAAAAAAAAAAEBAAAAMAQRoQxggNEYUgRIXaA0AACkAUkhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFik";
    }
    if (init) initString = init;
    if (onShutdown) {
      this.onShutdown = onShutdown;
    }

    this.renderingMode = RenderMode.ThreeJs;

    this.mii = new Mii(Buffer.from(initString, "base64") as unknown as Buffer);
    activeMii = this.mii;

    // Ensure that birthPlatform doesn't cause issues.
    if (this.mii.deviceOrigin === 0) this.mii.deviceOrigin = 4;
    // Enable allow copying so QR can be made.
    if (this.mii.allowCopying === false) this.mii.allowCopying = true;

    this.#setupUi();
  }

  #loadInterval!: Timer;
  #loadSoundLoop() {
    const check = () => {
      if (this.ready) {
        clearInterval(this.#loadInterval);
        return;
      }
      playSound("wait");
    };
    check();
    this.#loadInterval = setInterval(check, 2000);
  }

  async #setupUi() {
    this.icons = await fetch("./dist/icons.json?t=" + Date.now()).then((j) =>
      j.json()
    );
    this.ui = {} as unknown as any;
    this.#setupBase();
    this.#updateCssVars();
    await this.#setupMii();
    this.#setupTabs();
    await this.render();
    this.ready = true;
  }
  #setupBase() {
    this.ui.base = new Html("div").class("ui-base").appendTo("body");
  }
  #renderModeText(RM: RenderMode) {
    switch (RM) {
      case RenderMode.Image:
        return "2D";
      case RenderMode.ThreeJs:
        return "3D";
    }
  }
  async #setupMii() {
    this.ui.mii = new Html("div").class("mii-holder").appendTo(this.ui.base);
    this.ui.mii.append(
      new Html("div").html(EditorIcons.loading).class("loader", "active")
    );
    let nextRenderMode = 0;
    switch (this.renderingMode) {
      case RenderMode.Image:
        this.#setup2D();
        nextRenderMode = RenderMode.ThreeJs;
        break;
      case RenderMode.ThreeJs:
        this.#setup3D();
        nextRenderMode = RenderMode.Image;
        break;
    }
    const renderModeToggle = AddButtonSounds(
      new Html("button")
        .class("render-mode-toggle")
        .text(this.#renderModeText(nextRenderMode))
        .on("click", () => {
          renderModeToggle.text(this.#renderModeText(this.renderingMode));
          switch (this.renderingMode) {
            case RenderMode.Image:
              this.renderingMode = RenderMode.ThreeJs;
              break;
            case RenderMode.ThreeJs:
              this.renderingMode = RenderMode.Image;
          }
          this.render();
        })
        .appendTo(this.ui.mii)
    );
  }
  #setup2D() {
    /* renderImage */
    new Html("img").attr({ crossorigin: "anonymous" }).appendTo(this.ui.mii);
  }
  async #setup3D() {
    this.ui.scene = new Mii3DScene(this.mii, this.ui.mii.elm);
    await this.ui.scene.init();
    this.ui.mii.append(this.ui.scene.getRendererElement());
    window.addEventListener("resize", () => {
      this.ui.scene.resize();
    });
    this.ui.scene.focusCamera(CameraPosition.MiiHead);
    this.ui.scene.getRendererElement().classList.add("ready");
    this.ui.mii.qs(".loader")!.classOff("active");
  }
  #updateCssVars() {
    let glassesColor: string;
    if (this.mii.trueGlassesColor > 5)
      glassesColor = SwitchMiiColorTable[this.mii.trueGlassesColor];
    else glassesColor = MiiGlassesColorIconTable[this.mii.trueGlassesColor].top;
    let eyeColor: string;
    if (this.mii.trueEyeColor > 6) {
      eyeColor = SwitchMiiColorTable[this.mii.trueEyeColor - 6];
    } else eyeColor = MiiEyeColorTable[this.mii.fflEyeColor];
    let mouthColor: { top: string; bottom: string };
    if (this.mii.trueMouthColor > 6) {
      mouthColor = {
        top: SwitchMiiColorTableLip[this.mii.trueMouthColor - 5],
        bottom: SwitchMiiColorTable[this.mii.trueMouthColor - 5],
      };
    } else
      mouthColor = {
        top: SwitchMiiColorTableLip[this.mii.fflMouthColor + 19],
        bottom: SwitchMiiColorTable[this.mii.fflMouthColor + 19],
      };

    this.ui.base.style({
      "--eye-color": eyeColor,
      "--icon-lip-color-top": mouthColor.top,
      "--icon-lip-color-bottom": mouthColor.bottom,
      "--icon-hair-tie":
        "#" +
        MiiFavoriteColorLookupTable[this.mii.favoriteColor]
          .toString(16)
          .padStart(6, "0"),
      "--icon-eyebrow-fill": SwitchMiiColorTable[this.mii.eyebrowColor],
      "--icon-hair-fill": SwitchMiiColorTable[this.mii.hairColor],
      "--icon-facial-hair-fill": SwitchMiiColorTable[this.mii.facialHairColor],
      "--icon-hat-fill": MiiFavoriteColorIconTable[this.mii.favoriteColor].top,
      "--icon-hat-stroke":
        MiiFavoriteColorIconTable[this.mii.favoriteColor].bottom,
      "--icon-glasses-fill": glassesColor,
      "--icon-glasses-shade": glassesColor + "77",
    });
  }
  #setupTabs() {
    const TabInit = (Tab: TabBase, CameraFocusPart: CameraPosition) => {
      return async (content: Html) => {
        if (this.ui.scene) this.ui.scene.focusCamera(CameraFocusPart);
        await Tab({
          container: content,
          callback: (mii, forceRender, renderPart) => {
            this.mii = mii;
            if (this.mii.normalMii === false) this.mii.disableSharing = true;
            else this.mii.disableSharing = false;
            activeMii = mii;
            // use of forceRender forces reload of the head in 3D mode
            this.render(forceRender, renderPart);
            this.#updateCssVars();
            this.dirty = true;
          },
          icons: this.icons,
          mii: this.mii,
          editor: this,
        });
        if (this.ui.scene) this.ui.scene.resize();
      };
    };

    const tabs = TabList([
      {
        icon: EditorIcons.head,
        select: TabInit(HeadTab, CameraPosition.MiiHead),
      },
      {
        icon: EditorIcons.hair,
        select: TabInit(HairTab, CameraPosition.MiiHead),
      },
      {
        icon: EditorIcons.hat,
        select: TabInit(ExtHatTab, CameraPosition.MiiHead),
      },
      {
        icon: EditorIcons.eyebrows,
        select: TabInit(EyebrowTab, CameraPosition.MiiHead),
      },
      {
        icon: EditorIcons.eyes,
        select: TabInit(EyeTab, CameraPosition.MiiHead),
      },
      {
        icon: EditorIcons.nose,
        select: TabInit(NoseTab, CameraPosition.MiiHead),
      },
      {
        icon: EditorIcons.mouth,
        select: TabInit(MouthTab, CameraPosition.MiiHead),
      },
      {
        icon: EditorIcons.facialHair,
        select: TabInit(FacialHairTab, CameraPosition.MiiHead),
      },
      {
        icon: EditorIcons.mole,
        select: TabInit(MoleTab, CameraPosition.MiiHead),
      },
      {
        icon: EditorIcons.glasses,
        select: TabInit(GlassesTab, CameraPosition.MiiHead),
      },
      {
        icon: EditorIcons.scale,
        select: TabInit(ScaleTab, CameraPosition.MiiFullBody),
      },
      {
        icon: EditorIcons.favoriteColor,
        select: TabInit(FavoriteColorTab, CameraPosition.MiiFullBody),
      },
      {
        icon: EditorIcons.gender,
        select: TabInit(OptionsTab, CameraPosition.MiiFullBody),
      },
      {
        icon: EditorIcons.details,
        select: TabInit(MiscTab, CameraPosition.MiiFullBody),
      },
    ]);
    this.ui.tabList = tabs.list;
    this.ui.tabContent = tabs.content;
    this.ui.base.appendMany(tabs.list, tabs.content);
  }

  async render(
    forceReloadHead: boolean = true,
    renderPart: RenderPart = RenderPart.Head
  ) {
    switch (this.renderingMode) {
      case RenderMode.Image:
        if (this.ui.mii.qs("img") === null) {
          this.#setup2D();
        }
        if (this.ui.mii.qs("canvas")) {
          this.ui.mii.qs("canvas")?.style({ display: "none" });
        }
        this.ui.mii
          .qs("img")
          ?.style({ display: "block" })
          .attr({
            src: `${
              Config.renderer.renderHeadshotURL
            }&data=${encodeURIComponent(
              this.mii.encodeStudio().toString("hex")
            )}`,
          });
        break;
      case RenderMode.ThreeJs:
        if (this.ui.mii.qs("canvas") === null) {
          await this.#setup3D();
        }
        if (this.ui.mii.qs("img")) {
          this.ui.mii.qs("img")?.style({ display: "none" });
        }
        this.ui.mii.qs("canvas")?.style({ display: "block" });
        this.ui.scene.mii = this.mii;
        if (forceReloadHead) {
          // reload head and body
          this.ui.scene.updateMiiHead(renderPart);
        } else {
          // only reload body
          this.ui.scene.updateBody();
        }
        break;
    }
  }
  #disableUI() {
    this.ui.mii.qs("button")!.classOn("disabled");
    this.ui.tabList.classOn("disabled");
    this.ui.tabContent.classOn("disabled");
  }
  async shutdown(shouldSave: boolean = true) {
    if (shouldSave) {
      if (Array.from(this.errors.values()).find((i) => i === true)) {
        let errorList = [];
        for (const [id, value] of this.errors.entries()) {
          if (value === true) errorList.push(id);
        }
        Modal.alert(
          "Error",
          "Will not save because there are errors in the following items:\n\n" +
            errorList.map((e) => `• ${e}`).join("\n")
        );
        return;
      }

      if (this.renderingMode === RenderMode.ThreeJs) {
        await new Promise((resolve, reject) => {
          this.#disableUI();
          // Tell scene to change animation
          this.ui.scene.playEndingAnimation();
          setTimeout(() => {
            resolve(null);
          }, 1500);
        });
      }
    }

    if (this.#loadInterval) {
      clearInterval(this.#loadInterval);
    }

    this.ui.base.classOn("closing");
    setTimeout(() => {
      if (this.ui.mii.qs("canvas")) {
        this.ui.scene.shutdown();
      }
      this.ui.base.cleanup();
      if (this.onShutdown) {
        this.onShutdown(
          Buffer.from(this.mii.encode()).toString("base64"),
          shouldSave
        );
      }
    }, 500);
  }
}
