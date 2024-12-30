import qrjs from "../external/mii-frontend/qrjs.min.js";
import {
  convertDataToType,
  supportedFormats,
} from "../external/mii-frontend/data-conversion.js";
import { encryptAndEncodeVer3StoreDataToQRCodeFormat } from "./EncodeQRCode.js";
import Mii from "../external/mii-js/mii.js";
import { Buffer as Buf } from "../../node_modules/buffer/index";
import { Config } from "../config.js";
import { CameraPosition, Mii3DScene, SetupType } from "../class/3DScene.js";
import Html from "@datkat21/html";
import { Box3, Vector3 } from "three";

const ver3Format = supportedFormats.find(
  (f) => f.className === "Gen2Wiiu3dsMiitomo"
)!;

const makeQrCodeImage = async (
  mii: string,
  extendedColors: boolean
): Promise<HTMLImageElement> => {
  let convertedVer3Data: Uint8Array, ver3QRData: any[];

  if (extendedColors === true) {
    convertedVer3Data = new Uint8Array(Buf.from(mii, "base64"));
    ver3QRData = Array.from(convertedVer3Data);
  } else {
    convertedVer3Data = new Uint8Array(
      convertDataToType(
        new Uint8Array(Buf.from(mii, "base64")),
        ver3Format,
        ver3Format.className,
        true
      )
    );
    ver3QRData = encryptAndEncodeVer3StoreDataToQRCodeFormat(convertedVer3Data);
  }
  // console.log(convertedVer3Data, ver3QRData);
  const png = qrjs.generatePNG(ver3QRData, { margin: 0 });
  // //@ts-expect-error
  // window.qrCodeSourceData = convertedVer3Data;
  // //@ts-expect-error
  // window.qrCodeData = ver3QRData;
  // console.log(ver3QRData, png);
  const img = new Image(431, 431);
  img.src = URL.createObjectURL(await (await fetch(png)).blob());
  return new Promise((resolve) => {
    img.onload = () => {
      return resolve(img);
    };
  });
};

export enum MiiCustomRenderType {
  Head,
  HeadOnly,
  Body,
}

export const getMiiRender = async (
  mii: Mii,
  type: MiiCustomRenderType,
  useExtendedColors: boolean = true,
  useBlob: boolean = true
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    let tmpMii = new Mii(mii.encode());

    if (useExtendedColors === false) {
      tmpMii.trueEyeColor = tmpMii.fflEyeColor;
      tmpMii.trueEyebrowColor = tmpMii.fflEyebrowColor;
      tmpMii.trueFacialHairColor = tmpMii.fflFacialHairColor;
      tmpMii.trueGlassesColor = tmpMii.fflGlassesColor;
      tmpMii.trueGlassesType = tmpMii.fflGlassesType;
      tmpMii.trueHairColor = tmpMii.fflHairColor;
      tmpMii.trueMouthColor = tmpMii.fflMouthColor;
      tmpMii.trueSkinColor = tmpMii.fflSkinColor;

      tmpMii.extEyeColor = tmpMii.fflEyeColor + 8;
      tmpMii.extHairColor = tmpMii.fflHairColor;
      tmpMii.extFacelineColor = tmpMii.fflSkinColor;
      tmpMii.extBeardColor = tmpMii.fflFacialHairColor;
      tmpMii.extEyebrowColor = tmpMii.fflEyebrowColor;
      tmpMii.extGlassColor = 0;
      tmpMii.extGlassType = tmpMii.fflGlassesType;
      tmpMii.extHatColor = 0;
      tmpMii.extHatType = 0;
    }

    let parent = new Html("div")
      .style({
        width: "720px",
        height: "720px",
        opacity: "0",
        // position: "fixed",
      })
      .appendTo("body");
    const scene = new Mii3DScene(tmpMii, parent.elm, SetupType.Screenshot);
    scene.init().then(async () => {
      await scene.updateBody();
      // swap pose for render
      scene.anim.forEach((a) => {
        a.timeScale = 0;
        // a.stop();
        // a.reset();
      });
      scene.swapAnimation("Pose.01");

      let scn = scene.getScene()!,
        cam = scene.getCamera()!,
        ctl = scene.getControls()!,
        pos = new Vector3();
      switch (type) {
        case MiiCustomRenderType.Head:
          // zoom in on head
          setTimeout(() => {
            scene.focusCamera(0, true, false);
            ctl.dollyTo(50);
            cam.fov = 15;
            cam.updateProjectionMatrix();
          }, 300);
          break;
        case MiiCustomRenderType.HeadOnly:
          // hide body from view
          scn.getObjectByName("body_m")!.visible = false;
          scn.getObjectByName("legs_m")!.visible = false;
          scn.getObjectByName("body_f")!.visible = false;
          scn.getObjectByName("legs_f")!.visible = false;
          // Get the bounding box of the object
          scene.focusCamera(CameraPosition.MiiHead, true, false);
          ctl.dollyTo(40);
          cam.fov = 15;
          cam.updateProjectionMatrix();
          break;
        case MiiCustomRenderType.Body:
          // default screenshot camera position
          scene.focusCamera(CameraPosition.MiiFullBody, true, false);
          ctl.dollyTo(90, false);
          cam.fov = 15;
          cam.updateProjectionMatrix();
          break;
      }

      parent.append(scene.getRendererElement());

      const renderer = scene.getRenderer();
      setTimeout(() => {
        if (useBlob)
          renderer.domElement.toBlob((blob) => {
            const image = new Image(
              renderer.domElement.width,
              renderer.domElement.height
            );
            image.src = URL.createObjectURL(blob!);
            console.log("Temporary render URL:", image.src);
            image.onload = () => {
              resolve(image);
              scene.shutdown();
              parent.cleanup();
            };
          });
        else {
          const url = renderer.domElement.toDataURL("png", 100);
          const image = new Image(
            renderer.domElement.width,
            renderer.domElement.height
          );
          image.src = url;
          image.onload = () => {
            resolve(image);
            scene.shutdown();
            parent.cleanup();
          };
        }
      }, 700);
    });
  });
};

export const getBackground = async (
  isMiic: boolean
): Promise<HTMLImageElement> => {
  let url: string = "";
  if (isMiic) {
    url = "./assets/img/bg_qr_miic.png";
  } else {
    url = "./assets/img/bg_qr_wiiu.png";
  }
  const blob = await (await fetch(url)).blob();
  const img = new Image(1280, 720);
  img.src = URL.createObjectURL(blob);
  return new Promise((resolve) => {
    img.onload = () => {
      return resolve(img);
    };
  });
};

export const QRCodeCanvas = async (
  mii: string,
  extendedColors: boolean = true
) => {
  const miiData = new Mii(Buf.from(mii, "base64"));
  const render = await getMiiRender(
    miiData,
    MiiCustomRenderType.Body,
    extendedColors
  );
  const qrCodeSource = await makeQrCodeImage(mii, extendedColors);
  const background = await getBackground(extendedColors);

  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  // background
  ctx.drawImage(background, 0, 0);
  // mark
  ctx.font = "500 24px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#cccccc";
  ctx.fillText(`${location.origin}`, 32, 667);
  ctx.drawImage(render, 49, 0, 720, 720);
  // qr code container
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(769, 79, 463, 463, [16, 16, 0, 0]);
  ctx.fill();
  ctx.drawImage(qrCodeSource, 797, 107, 408, 408);
  // name container
  ctx.fillStyle = "#707070";
  ctx.beginPath();
  ctx.roundRect(769, 542, 463, 99, [0, 0, 16, 16]);
  ctx.fill();
  // mii name
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "500 38px sans-serif";
  ctx.fillText(miiData.miiName, 1005, 591);
  const canvasPngImage = canvas.toDataURL("png", 100);
  return canvasPngImage;
};
