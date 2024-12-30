// Configuration file used client-side
const baseURL = "https://mii-renderer.nxw.pw/miis/image";
export const Config = {
  renderer: {
    baseURL,
    renderFFLMakeIcon: `${baseURL}.png?shaderType=2&type=fflmakeicon&width=360&verifyCharInfo=0`,
    renderHeadshotURL: `${baseURL}.png?shaderType=0&type=face&width=260&verifyCharInfo=0`,
    renderHeadshotURLNoParams: `${baseURL}.png`,
    renderFullBodyURL: `${baseURL}.png?shaderType=0&type=all_body_sugar&width=420&verifyCharInfo=0&scale=1`,
    render3DHeadURL: `${baseURL}.glb?shaderType=0&type=face&width=260&verifyCharInfo=0`,
    renderFaceURL: `${baseURL}.png?scale=1&drawStageMode=mask_only`,
    randomUserURL: "???",
  },
  mii: {
    scalingMode: "newest",
  },
  version: {
    string: "v0.5",
    name: "Unfinished",
  },
};
