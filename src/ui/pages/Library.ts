import Html from "@datkat21/html";
import localforage, { config } from "localforage";
import { MiiEditor, MiiGender, RenderPart } from "../../class/MiiEditor";
import { MainMenu } from "./MainMenu";
import Modal from "../components/Modal";
import Mii from "../../external/mii-js/mii";
import { Buffer } from "../../../node_modules/buffer/index";
import Loader from "../components/Loader";
import { AddButtonSounds } from "../../util/AddButtonSounds";
import {
  getMiiRender,
  MiiCustomRenderType,
  QRCodeCanvas,
} from "../../util/miiImageUtils";
import { Link } from "../components/Link";
import { Config } from "../../config";
import EditorIcons from "../../constants/EditorIcons";
import { Mii3DScene, SetupType } from "../../class/3DScene";
import {
  FeatureSetType,
  MiiPagedFeatureSet,
} from "../components/MiiPagedFeatureSet";
import { downloadLink } from "../../util/downloadLink";
import { ArrayNum } from "../../util/NumberArray";
import type { Mesh } from "three";
import {
  cPantsColorGoldHex,
  cPantsColorRedHex,
} from "../../class/3d/shader/fflShaderConst";
export const savedMiiCount = async () =>
  (await localforage.keys()).filter((k) => k.startsWith("mii-")).length;
export const newMiiId = async () =>
  `mii-${await savedMiiCount()}-${Date.now()}`;
export const miiIconUrl = (mii: Mii) =>
  `${Config.renderer.renderHeadshotURLNoParams}?data=${mii
    .encodeStudio()
    .toString("hex")}&shaderType=0&type=face&width=180&verifyCharInfo=0`;

export async function Library(highlightMiiId?: string) {
  function shutdown(): Promise<void> {
    return new Promise((resolve) => {
      container.class("fadeOut");
      setTimeout(() => {
        container.cleanup();
        resolve();
      }, 500);
    });
  }

  const container = new Html("div").class("mii-library").appendTo("body");

  const sidebar = new Html("div").class("library-sidebar").appendTo(container);

  sidebar.append(new Html("h1").text("Mii Creator"));

  const libraryList = new Html("div").class("library-list").appendTo(container);

  const miis = await Promise.all(
    (
      await localforage.keys()
    )
      .filter((k) => k.startsWith("mii-"))
      .sort((a, b) => Number(a.split("-")[1]!) - Number(b.split("-")[1]!))
      .map(async (k) => ({
        id: k,
        mii: (await localforage.getItem(k)) as string,
      }))
  );

  if (miis.length === 0) {
    libraryList.append(
      new Html("div")
        .style({ position: "absolute", top: "2rem", left: "2rem" })
        .text("You have no Miis yet. Create one to get started!")
    );
  }
  for (const mii of miis) {
    let miiContainer = new Html("div").class("library-list-mii");

    AddButtonSounds(miiContainer);

    const miiData = new Mii(Buffer.from(mii.mii, "base64"));

    try {
      // prevent error when importing converted Wii-era data
      miiData.unknown1 = 0;
      miiData.unknown2 = 0;

      if (miiData)
        console.log(
          miiData.miiName + "'s birthPlatform:",
          miiData.deviceOrigin
        );

      let miiImage = new Html("img").class("lazy").attr({
        "data-src": miiIconUrl(miiData),
      });

      if (miiData.normalMii === false || miiData.favorite === true) {
        const star = new Html("i")
          .style({ position: "absolute", top: "0", right: "0" })

          .appendTo(miiContainer);

        if (miiData.normalMii === false) {
          star.html(EditorIcons.special).style({ color: cPantsColorGoldHex });
        }
        if (miiData.favorite === true) {
          star.html(EditorIcons.favorite).style({ color: cPantsColorRedHex });
        }
      }

      let miiName = new Html("span").text(miiData.miiName);

      let hasMiiLoaded = false;

      let miiEditCallback = miiEdit(mii, shutdown, miiData);

      miiContainer.on("click", async () => {
        if (hasMiiLoaded === false || hasMiiErrored === true) {
          let result = await Modal.prompt(
            "Oops",
            "This Mii hasn't loaded correctly. Do you still want to try and manage it?"
          );
          if (result === false) return;
        }

        miiEditCallback();
      });

      let hasMiiErrored = false;

      miiImage
        .on("load", () => {
          hasMiiLoaded = true;
        })
        .on("error", () => {
          // prevent looping error load
          if (hasMiiErrored === true) return;
          miiImage.attr({
            src: "data:image/svg+xml," + encodeURIComponent(EditorIcons.error),
          });
          hasMiiErrored = true;
        });

      miiContainer.appendMany(miiImage, miiName).appendTo(libraryList);

      requestAnimationFrame(() => {
        if (highlightMiiId !== undefined) {
          if (highlightMiiId === mii.id) {
            miiContainer.classOn("highlight");

            setTimeout(() => {
              miiContainer.classOff("highlight");
            }, 2000);

            const mc = miiContainer.elm;
            mc.closest(".library-list")!.scroll({
              top:
                mc.getBoundingClientRect().top +
                mc.getBoundingClientRect().height,
              behavior: "smooth",
            });
          }
        }
      });
    } catch (e: unknown) {
      console.log("Oops", e);
    }
  }
  window.LazyLoad.update();

  sidebar.appendMany(
    new Html("div").class("sidebar-buttons").appendMany(
      AddButtonSounds(
        new Html("button").text("Main Menu").on("click", async () => {
          await shutdown();
          MainMenu();
        })
      ),
      AddButtonSounds(
        new Html("button").text("Create New").on("click", async () => {
          await shutdown();
          miiCreateDialog();
        })
      )
    ),
    new Html("div")
      .class("sidebar-credits")
      .appendMany(
        new Html("span").text("Credits"),
        AddButtonSounds(
          Link(
            "Source code by datkat21",
            "https://github.com/datkat21/mii-maker-real"
          )
        ),
        AddButtonSounds(
          Link(
            "Mii Rendering API by ariankordi",
            "https://mii-unsecure.ariankordi.net"
          )
        ),
        AddButtonSounds(
          Link("Mii Maker Music by objecty", "https://x.com/objecty_twitt")
        )
      )
  );
}

type MiiLocalforage = {
  id: string;
  mii: string;
};

const miiCreateDialog = () => {
  Modal.modal(
    "Create New",
    "How would you like to create the Mii?",
    "body",
    {
      text: "From Scratch",
      callback: miiCreateFromScratch,
    },
    {
      text: "Enter PNID",
      callback: miiCreatePNID,
    },
    {
      text: "Random",
      callback: miiCreateRandom,
    },
    {
      text: "Import FFSD/MiiCreator data",
      callback: () => {
        let id: string;
        let modal = Modal.modal(
          "Import FFSD/MiiCreator data",
          "",
          "body",
          {
            text: "Cancel",
            callback: miiCreateDialog,
          },
          {
            text: "Confirm",
            callback() {
              Library(id);
            },
          }
        );
        modal
          .qsa(".modal-body .flex-group,.modal-body span")!
          .forEach((q) => q!.style({ display: "none" }));
        modal.qs(".modal-body")!.appendMany(
          new Html("span").text("Select a FFSD or .miic file to import"),
          new Html("input")
            .attr({ type: "file", accept: ".ffsd,.cfsd,.miic" })
            .style({ margin: "auto" })
            .on("change", (e) => {
              const target = e.target as HTMLInputElement;
              console.log("Files", target.files);

              const f = new FileReader();

              f.readAsArrayBuffer(target.files![0]);
              f.onload = async () => {
                try {
                  // prevent error when importing converted Wii-era data
                  const miiData = Buffer.from(f.result as ArrayBuffer);

                  const mii = new Mii(miiData);

                  const miiDataToSave = mii.encode().toString("base64");

                  id = await newMiiId();

                  await localforage.setItem(id, miiDataToSave);

                  modal.qs(".modal-body button")!.elm.click();
                } catch (e) {
                  Modal.alert("Error", `Invalid Mii data: ${e}`);
                  target.value = "";
                }
              };
            })
        );
      },
    },
    {
      text: "Cancel",
      callback: () => Library(),
    }
  );
};
const miiCreateFromScratch = () => {
  function cb(gender: MiiGender) {
    return () => {
      new MiiEditor(gender, async (m, shouldSave) => {
        if (shouldSave === true) await localforage.setItem(await newMiiId(), m);
        Library();
      });
    };
  }

  Modal.modal(
    "Create New",
    "Select the Mii's gender",
    "body",
    {
      text: "Male",
      callback: cb(MiiGender.Male),
    },
    {
      text: "Female",
      callback: cb(MiiGender.Female),
    },
    {
      text: "Cancel",
      callback: () => miiCreateDialog(),
    }
  );
};
const miiCreatePNID = async () => {
  const input = await Modal.input(
    "Create New",
    "Enter PNID of user..",
    "Username",
    "body",
    false
  );
  if (input === false) {
    return miiCreateDialog();
  }

  Loader.show();

  let pnid = await fetch(
    `https://mii-unsecure.ariankordi.net/mii_data/${encodeURIComponent(
      input
    )}?api_id=1`
  );

  Loader.hide();
  if (!pnid.ok) {
    await Modal.alert("Error", `Couldn't get Mii: ${await pnid.text()}`);
    return Library();
  }

  new MiiEditor(
    0,
    async (m, shouldSave) => {
      if (shouldSave === true) await localforage.setItem(await newMiiId(), m);
      Library();
    },
    (await pnid.json()).data
  );
};
const miiCreateRandom = async () => {
  Loader.show();
  let random = await fetch(
    "https://mii-unsecure.ariankordi.net/mii_data_random"
  ).then((j) => j.json());
  Loader.hide();

  new MiiEditor(
    0,
    async (m, shouldSave) => {
      if (shouldSave === true) await localforage.setItem(await newMiiId(), m);
      Library();
    },
    random.data
  );
};
const miiEdit = (mii: MiiLocalforage, shutdown: () => any, miiData: Mii) => {
  return () => {
    const modal = Modal.modal(
      "Mii Options",
      "What would you like to do?",
      "body",
      {
        text: "Edit",
        async callback() {
          await shutdown();
          new MiiEditor(
            0,
            async (m, shouldSave) => {
              if (shouldSave === true) await localforage.setItem(mii.id, m);
              Library();
            },
            mii.mii
          );
        },
      },
      {
        text: "Delete",
        async callback() {
          let tmpDeleteModal = await Modal.modal(
            "Warning",
            "Are you sure you want to delete this Mii?",
            "body",
            {
              async callback(e) {
                await localforage.removeItem(mii.id);
                await shutdown();
                Library();
              },
              text: "Yes",
              type: "danger",
            },
            {
              callback(e) {
                /* ... */
              },
              text: "No",
            }
          );

          modal
            .qs(".modal-body")
            ?.prepend(
              new Html("img")
                .attr({ src: miiIconUrl(miiData) })
                .style({ width: "180px", margin: "-18px auto 0 auto" })
            );
        },
      },
      {
        text: "Download",
        async callback() {
          miiExportDownload(mii, miiData);
        },
      },
      {
        text: "Render",
        async callback() {
          miiExport(mii, miiData);
        },
      },
      {
        text: "Cancel",
        async callback() {},
      }
    );
    modal
      .qs(".modal-body")
      ?.prepend(
        new Html("img")
          .attr({ src: miiIconUrl(miiData) })
          .style({ width: "180px", margin: "-18px auto 0 auto" })
      );
  };
};

const miiColorConversionWarning = async (miiData: Mii) => {
  if (miiData.hasExtendedColors() === true) {
    let result = await Modal.prompt(
      "Warning",
      "This Mii is using extended Switch colors that will be lost in the conversion to Wii U/3DS format. Are you sure you want to continue?",
      "body",
      false
    );
    if (result === false) return false;
  }
  return true;
};

const miiExport = (mii: MiiLocalforage, miiData: Mii) => {
  Modal.modal(
    "Mii Export",
    "What would you like to do?",
    "body",
    {
      text: "Generate QR code",
      async callback() {
        if (!(await miiColorConversionWarning(miiData))) return;
        const qrCodeImage = await QRCodeCanvas(mii.mii, false);
        downloadLink(qrCodeImage, `${miiData.miiName}_QR.png`);
      },
    },
    {
      text: "Render an image",
      async callback() {
        miiExportRender(mii, miiData);
      },
    },
    {
      text: "Make your own render",
      async callback() {
        customRender(miiData);
      },
    },
    {
      text: "Cancel",
      async callback() {},
    }
  );
};

const miiExportRender = async (mii: MiiLocalforage, miiData: Mii) => {
  Modal.modal(
    `Render options: ${miiData.miiName}`,
    "Choose a way to render this Mii",
    "body",
    {
      text: "Focus on head",
      async callback() {
        const renderImage = await getMiiRender(
          miiData,
          MiiCustomRenderType.Head
        );
        downloadLink(renderImage.src, `${miiData.miiName}_render_headshot.png`);
      },
    },
    {
      text: "Focus on full body",
      async callback() {
        const renderImage = await getMiiRender(
          miiData,
          MiiCustomRenderType.Body
        );
        downloadLink(renderImage.src, `${miiData.miiName}_render_body.png`);
      },
    },
    {
      text: "Head only",
      async callback() {
        const renderImage = await getMiiRender(
          miiData,
          MiiCustomRenderType.HeadOnly
        );
        downloadLink(
          renderImage.src,
          `${miiData.miiName}_render_head_only.png`
        );
      },
    },
    {
      text: "Cancel",
      callback() {},
    }
  );
};

const miiExportDownload = async (mii: MiiLocalforage, miiData: Mii) => {
  Modal.modal(
    "Mii Export",
    "How would you like to save the Mii?",
    "body",
    {
      text: "Cancel",
      callback() {},
    },
    {
      text: "Get FFSD (Hex)",
      async callback() {
        if (!(await miiColorConversionWarning(miiData))) return;
        return Modal.alert(
          "FFSD code",
          miiData.encodeFFSD().toString("hex"),
          "body",
          true
        );
      },
    },
    {
      text: "Get FFSD (Base64 text)",
      async callback() {
        if (!(await miiColorConversionWarning(miiData))) return;
        return Modal.alert(
          "FFSD code",
          miiData.encodeFFSD().toString("base64"),
          "body",
          true
        );
      },
    },
    {
      text: "Save FFSD (file)",
      async callback() {
        if (!(await miiColorConversionWarning(miiData))) return;
        const blob = new Blob([miiData.encodeFFSD()]);
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.download = miiData.miiName + ".ffsd";
        document.body.appendChild(a);
        a.click();

        requestAnimationFrame(() => {
          a.remove();
        });

        // free URL after some time
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 2000);
      },
    },
    {
      text: "Save MiiCreator data",
      async callback() {
        const blob = new Blob([miiData.encode()]);
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.download = miiData.miiName + ".miic";
        document.body.appendChild(a);
        a.click();

        requestAnimationFrame(() => {
          a.remove();
        });

        // free URL after some time
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 2000);
      },
    },
    {
      text: "Get Mii Studio data",
      async callback() {
        return Modal.alert(
          "Mii Studio data",
          miiData.encodeStudio().toString("hex"),
          "body",
          true
        );
      },
    }
  );
};

export function customRender(miiData: Mii) {
  const modal = Modal.modal("Prepare Render", "", "body", {
    callback: () => {},
    text: "Cancel",
  });
  const body = modal.qs(".modal-body")!.classOn("responsive-row-lg").clear();
  modal.qs(".modal-content")!.styleJs({
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
  });
  let parent = new Html("div")
    .style({
      display: "flex",
      flex: "1",
      background: "var(--container)",
      "border-radius": "12px",
      "flex-shrink": "0",
      height: "100%",
      overflow: "hidden",
      "justify-content": "center",
      "align-items": "center",
    })
    .appendTo(body);
  let parentBox = new Html("div")
    .style({ "aspect-ratio": "1 / 1", height: "100%" })
    .appendTo(parent);
  let tabsContent = new Html("div")
    .classOn("tab-content")
    .style({ flex: "1", height: "100%", overflow: "auto" })
    .appendTo(body);

  let configuration = {
    fov: 30,
    pose: 0,
    expression: 0,
    renderWidth: 720,
    renderHeight: 720,
    cameraPosition: 1,
  };

  const base64Data = miiData.encodeStudio().toString("hex");

  const expressionDuplicateList = [42, 44, 46, 48, 50, 52, 54, 61, 62];

  // very hacky way to use feature set to create tabs
  MiiPagedFeatureSet({
    mii: configuration,
    miiIsNotMii: true,
    entries: {
      page1: {
        label: "Camera",
        header: "Use mouse or touch to move the camera around.",
        items: [
          {
            type: FeatureSetType.Slider,
            property: "fov",
            iconStart: "FOV",
            iconEnd: "",
            min: 5,
            max: 70,
            part: RenderPart.Face,
          },
          {
            type: FeatureSetType.Switch,
            property: "cameraPosition",
            isNumber: true,
            iconOff: "Head",
            iconOn: "Full Body",
            part: RenderPart.Face,
          },
        ],
      },
      pose: {
        label: "Pose",
        header:
          "This section is a bit unfinished, the poses are custom-made recreations so they are not fully accurate. Pose 3 also has a rotation issue with the head since it has been changed to be pretending to be attached to the body to prevent weird scaling issues. There is also nothing done after pose 4 currently. I'm working on a way to add the Wii U poses directly.",
        items: ArrayNum(15).map((k) => ({
          type: FeatureSetType.Icon,
          value: k,
          icon: String(k),
          part: RenderPart.Head,
        })),
      },
      expression: {
        label: "Expression",
        items: ArrayNum(70)
          .filter((n) => !expressionDuplicateList.includes(n))
          .map((k) => ({
            type: FeatureSetType.Icon,
            value: k,
            icon: `<img class="lazy" width=128 height=128 data-src="https://mii-renderer.nxw.pw/miis/image.png?width=128&scale=1&data=${encodeURIComponent(
              base64Data
            )}&expression=${k}&type=fflmakeicon&verifyCharInfo=0">`,
            part: RenderPart.Head,
          })),
      },
      page2: {
        label: "Render",
        header:
          "Render resolution options will be here when the feature is ready.",
        items: [
          {
            type: FeatureSetType.Text,
            property: "renderWidth",
            part: RenderPart.Face,
            label: "Width",
          },
          {
            type: FeatureSetType.Text,
            property: "renderHeight",
            part: RenderPart.Face,
            label: "Height",
          },
        ],
      },
    },
    onChange(mii, forceRender, part) {
      configuration = mii as any;
      updateConfiguration();
      console.log("updated", configuration);
    },
  })
    .style({ height: "auto" })
    .appendTo(tabsContent);

  new Html("button")
    .text("Download")
    .on("click", finalizeRender)
    .appendTo(tabsContent);

  window.addEventListener("resize", () => {
    scene.resize();
  });

  const scene = new Mii3DScene(
    miiData,
    parentBox.elm,
    SetupType.Screenshot,
    (renderer) => {}
  );

  //@ts-expect-error testing
  window.scene = scene;

  let oldConfiguration: any = {
    fov: 30,
    pose: 0,
    expression: 0,
    renderWidth: 720,
    renderHeight: 720,
    cameraPosition: 1,
  };

  function updateConfiguration() {
    scene.getCamera()!.fov = configuration.fov;
    scene.getCamera()!.updateProjectionMatrix();
    switch (configuration.cameraPosition) {
      case 0:
        scene.getControls().moveTo(0, 3.5, 0, true);
        break;
      case 1:
        scene.getControls().moveTo(0, 0, 0, true);
        break;
    }

    scene.traverseAddFaceMaterial(
      scene.getHead() as Mesh,
      `&data=${encodeURIComponent(base64Data)}&expression=${
        configuration.expression
      }&width=896&verifyCharInfo=0`
    );

    if (scene.animations.get(`${scene.type}-Pose.${configuration.pose}`)) {
      scene.swapAnimation("Pose." + configuration.pose);
    } else {
      scene.swapAnimation("Stand");
    }

    oldConfiguration = configuration;
  }

  //@ts-expect-error
  window.scene = scene;

  scene.init().then(() => {
    scene.updateBody();
    parentBox.append(scene.getRendererElement());
  });

  const rendererElm = scene.getRendererElement();

  function finalizeRender() {
    rendererElm.toBlob((blob) => {
      const image = new Image(rendererElm.width, rendererElm.height);
      image.src = URL.createObjectURL(blob!);
      console.log("Temporary render URL:", image.src);
      image.onload = () => {
        downloadLink(image.src, `${miiData.miiName}_${new Date().toJSON()}`);
        scene.shutdown();
        parent.cleanup();
        modal.qs("button")?.elm.click();
      };
    });
  }
}
