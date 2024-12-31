// Configuration file used client-side.

// Instance of FFL-Testing/Mii Studio API compatible renderer.
const baseURL = "https://mii-renderer.nxw.pw/miis/image";
                                // ^^ image.png, image.glb

// Origin used for NNID, PNID, and random NNID fetch.
// Details: https://github.com/ariankordi/nwf-mii-cemu-toy/blob/ffl-renderer-proto-integrate/README.md
const nnidFetchOrigin = "https://mii-unsecure.ariankordi.net";

export const Config = {
  renderer: {
    baseURL,
    renderFFLMakeIcon: `${baseURL}.png?shaderType=2&type=fflmakeicon&width=360&verifyCharInfo=0`,
    renderHeadshotURL: `${baseURL}.png?shaderType=0&type=face&width=260&verifyCharInfo=0`,
    renderHeadshotURLNoParams: `${baseURL}.png`,
    renderFullBodyURL: `${baseURL}.png?shaderType=0&type=all_body_sugar&width=420&verifyCharInfo=0&scale=1`,
    render3DHeadURL: `${baseURL}.glb?shaderType=0&type=face&width=260&verifyCharInfo=0`,
    renderFaceURL: `${baseURL}.png?scale=1&drawStageMode=mask_only`,
  },
  dataFetch: { // For fetching data from various sources.
    nnidRandomURL: `${nnidFetchOrigin}/mii_data_random`,
    // Caller has to encodeURIComponent before passing:
    //nnidFetchURL: (nnid: string) => `${nnidFetchOrigin}/mii_data/${nnid}`,
    pnidFetchURL: (pnid: string) => `${nnidFetchOrigin}/mii_data/${pnid}?api_id=1`,
  },
  mii: {
    scalingMode: "scaleApply",
    // ^^ scaleLimit, scaleLimitClampY, scaleApply
  },
  version: {
    string: "v0.5",
    name: "Unfinished",
  },
};
