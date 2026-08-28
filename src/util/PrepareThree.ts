import * as THREE_MODULE from "../three.js";

let THREE: any; // typeof import("three");

// choose your path
if (globalThis.THREE) {
  THREE = globalThis.THREE;
  console.log("found three.js in global!");
} else {
  console.log("three.js wasn't found globally, using bundled Three.js!");
  THREE = THREE_MODULE.default;
}

export { THREE };
export const _THREE = () => THREE;
