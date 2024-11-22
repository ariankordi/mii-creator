import { Vector3 } from "three";

export const ExtHatNameList = [
  "Cap",
  "Beanie",
  "Top Hat",
  "Ribbon",
  "Bow",
  "Cat Ears",
];
export const ExtHatFullHeadList = [4, 5, 6];
export const ExtHatFullHeadRaycastList = [
  // Ribbon
  [
    // Ribbon_L
    { origin: new Vector3(-10, 6, 0), angle: new Vector3(1, 0, 0) },
    // Ribbon_R
    { origin: new Vector3(10, 6, 0), angle: new Vector3(-1, 0, 0) },
  ],
  // Bow
  [{ origin: new Vector3(10, 0, 0), angle: new Vector3(-1, 0, 0) }],
];
