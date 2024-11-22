import { DataTexture, RGBAFormat, UnsignedByteType, type Texture } from "three";
import type { FFLColor } from "../shader/fflShaderConst";

export function multiplyTexture(tex: Texture, color: FFLColor) {
  const canvas = document.createElement("canvas");
  canvas.width = tex.image.width;
  canvas.height = tex.image.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(tex.image, 0, 0);

  // Get the image data and modify pixel colors
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] * color[0];
    data[i + 1] = data[i + 1] * color[1];
    data[i + 2] = data[i + 2] * color[2];
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);

  // Create a new texture from the modified canvas
  const modifiedTexture = new DataTexture(
    imageData.data,
    canvas.width,
    canvas.height,
    RGBAFormat,
    UnsignedByteType
  );
  modifiedTexture.needsUpdate = true;

  return modifiedTexture;
}
