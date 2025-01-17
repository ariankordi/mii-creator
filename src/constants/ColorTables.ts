import type { FFLColor } from "../class/3d/shader/fflShaderConst";
import type { MiiLookupTableColor } from "../class/JFL/tables/colors";

export type MiiLookupTableHex = Record<number, number>;
export type MiiLookupTableString = Record<number, string>;
export type MiiLookupTableVec4 = Record<number, FFLColor>;
export type MiiLookupTableSpecial = Record<
  number,
  { top: string; bottom: string }
>;

export const MiiFavoriteColorLookupTable: MiiLookupTableHex = {
  /** Red */
  0: 0xd21e14,
  /** Orange */
  1: 0xff6e19,
  /** Yellow */
  2: 0xffd820,
  /** Light green */
  3: 0x78d220,
  /** Dark green */
  4: 0x007830,
  /** Dark blue */
  5: 0x0a48bc,
  /** Light blue */
  6: 0x3caade,
  /** Pink */
  7: 0xf55a7d,
  /** Purple */
  8: 0x7328ad,
  /** Brown */
  9: 0x483818,
  /** White */
  10: 0xe0e0e0,
  /** Black */
  11: 0x181814,
};

export const MiiFavoriteColorVec4Table: MiiLookupTableVec4 = {
  0: [0.8235294117647058, 0.11764705882352941, 0.0784313725490196, 1],
  1: [1, 0.43137254901960786, 0.09803921568627451, 1],
  2: [1, 0.8470588235294118, 0.12549019607843137, 1],
  3: [0.47058823529411764, 0.8235294117647058, 0.12549019607843137, 1],
  4: [0, 0.47058823529411764, 0.18823529411764706, 1],
  5: [0.0392156862745098, 0.2823529411764706, 0.7372549019607844, 1],
  6: [0.23529411764705882, 0.6666666666666666, 0.8705882352941177, 1],
  7: [0.9607843137254902, 0.35294117647058826, 0.49019607843137253, 1],
  8: [0.45098039215686275, 0.1568627450980392, 0.6784313725490196, 1],
  9: [0.2823529411764706, 0.2196078431372549, 0.09411764705882353, 1],
  10: [0.8784313725490196, 0.8784313725490196, 0.8784313725490196, 1],
  11: [0.09411764705882353, 0.09411764705882353, 0.0784313725490196, 1],
};

export const MiiFavoriteColorIconTable: MiiLookupTableSpecial = {
  /** Red */
  0: { top: "#d21e14", bottom: "#630e09" },
  /** Orange */
  1: { top: "#ff6e19", bottom: "#78340c" },
  /** Yellow */
  2: { top: "#ffd820", bottom: "#78660f" },
  /** Light green */
  3: { top: "#78d220", bottom: "#38630f" },
  /** Dark green */
  4: { top: "#007830", bottom: "#003817" },
  /** Dark blue */
  5: { top: "#0a48bc", bottom: "#052258" },
  /** Light blue */
  6: { top: "#3caade", bottom: "#1c5068" },
  /** Pink */
  7: { top: "#f55a7d", bottom: "#732a3b" },
  /** Purple */
  8: { top: "#7328ad", bottom: "#361351" },
  /** Brown */
  9: { top: "#483818", bottom: "#221a0b" },
  /** White */
  10: { top: "#e0e0e0", bottom: "#696969" },
  /** Black */
  11: { top: "#181814", bottom: "#0b0b09" },
};

export const MiiSkinColorTable: MiiLookupTableString = {
  0: "#FFD3AD",
  1: "#FEB66B",
  2: "#DE7942",
  3: "#FFAA8C",
  4: "#AD5129",
  5: "#632C18",
  6: "#ffbea5",
  7: "#ffc58f",
  8: "#8c3c23",
  9: "#3c2d23",
};
export const MiiHairColorTable: MiiLookupTableString = {
  0: "#000000",
  1: "#402010",
  2: "#5C180A",
  3: "#7C3A14",
  4: "#787880",
  5: "#4E3E11",
  6: "#875917",
  7: "#D0A049",
};
export const MiiEyeColorTable: MiiLookupTableString = {
  0: "#000000",
  1: "#717372",
  2: "#663C2C",
  3: "#686537",
  4: "#4B58A8",
  5: "#387059",
};
export const MiiMouthColorTable: MiiLookupTableString = {
  0: "#D04401",
  1: "#F30100",
  2: "#FD393A",
  3: "#F58862",
  4: "#1F1D1D",
};
export const MiiMouthColorLipTable: MiiLookupTableSpecial = {
  0: { top: "#823018", bottom: "#D85209" },
  1: { top: "#780C0D", bottom: "#F00C09" },
  2: { top: "#882028", bottom: "#F54849" },
  3: { top: "#DC7751", bottom: "#F09A74" },
  4: { top: "#461E0A", bottom: "#8C503F" },
};
export const MiiGlassesColorTable: MiiLookupTableString = {
  0: "#000000",
  1: "#5d391a",
  2: "#a01612",
  3: "#2e3969",
  4: "#a4601e",
  5: "#766f67",
};
export const MiiGlassesColorIconTable: MiiLookupTableSpecial = {
  0: { top: "#666666", bottom: "#606060" },
  1: { top: "#8d694a", bottom: "#e4c0a1" },
  2: { top: "#a01612", bottom: "#ff9d99" },
  3: { top: "#b5c0f0", bottom: "#b5c0f0" },
  4: { top: "#a4601e", bottom: "#ffe7a5" },
  5: { top: "#766f67", bottom: "#fdf6ee" },
};

export const SwitchMiiColorTable: MiiLookupTableColor = [
  "#2d2828",
  "#402010",
  "#5c180a",
  "#7c3a14",
  "#787880",
  "#4e3e10",
  "#885818",
  "#d0a04a",
  "#000000",
  "#6c7070",
  "#663c2c",
  "#605e30",
  "#4654a8",
  "#387058",
  "#603810",
  "#a81008",
  "#203068",
  "#a86000",
  "#787068",
  "#d85208",
  "#f00c08",
  "#f54848",
  "#f09a74",
  "#8c5040",
  "#842626",
  "#ff7366",
  "#ffa6a6",
  "#ffc0ba",
  "#732e3b",
  "#991f3d",
  "#8a173e",
  "#b53e42",
  "#c71e56",
  "#b05381",
  "#c7546e",
  "#fa7597",
  "#fcacc9",
  "#ffc9d8",
  "#311c40",
  "#37283d",
  "#4c184d",
  "#6f42b3",
  "#855cb8",
  "#c083cc",
  "#a893c9",
  "#c5ace6",
  "#eebefa",
  "#d2c5ed",
  "#191f40",
  "#123f66",
  "#2a82d4",
  "#57b4f2",
  "#7ac5de",
  "#89a6fa",
  "#84bdfa",
  "#a1e3ff",
  "#0b2e36",
  "#013d3b",
  "#0d4f59",
  "#236663",
  "#307e8c",
  "#4faeb0",
  "#7ac49e",
  "#7fd4c0",
  "#87e5b6",
  "#0a4a35",
  "#437a00",
  "#027562",
  "#369970",
  "#4bad1a",
  "#92bf0a",
  "#63c788",
  "#9ee042",
  "#96de7e",
  "#bbf2aa",
  "#99932b",
  "#a69563",
  "#ccc039",
  "#ccb987",
  "#d9cc82",
  "#d5d96f",
  "#d5e683",
  "#d8fa9d",
  "#7d4500",
  "#e6bb7a",
  "#fee24a",
  "#fade82",
  "#f7ea9c",
  "#faf89b",
  "#a64d1e",
  "#ff960d",
  "#d19b69",
  "#ffb266",
  "#ffc28c",
  "#e5cfb1",
  "#414141",
  "#9b9b9b",
  "#bebebe",
  "#dcd7cd",
  "#ffffff",
];

export const SwitchMiiColorTableLip: MiiLookupTableColor = [
  "#171414",
  "#201008",
  "#2e0c05",
  "#4a230c",
  "#54545a",
  "#271f08",
  "#52350e",
  "#b18028",
  "#000000",
  "#4c4e4e",
  "#331e16",
  "#3a381d",
  "#2a3265",
  "#274e3e",
  "#301c08",
  "#650a05",
  "#101834",
  "#764300",
  "#544e49",
  "#823018",
  "#780c0c",
  "#882028",
  "#dc7850",
  "#461e0a",
  "#4f1717",
  "#99453d",
  "#e68585",
  "#e6a19b",
  "#451c23",
  "#5c1325",
  "#530e25",
  "#6d2528",
  "#771234",
  "#6a324d",
  "#773242",
  "#af526a",
  "#e38cac",
  "#e6abbb",
  "#190e20",
  "#1c141f",
  "#260c27",
  "#43286b",
  "#50376e",
  "#865c8f",
  "#76678d",
  "#ab90cf",
  "#d4a0e1",
  "#b8aad5",
  "#0d1020",
  "#092033",
  "#1d5b94",
  "#3297da",
  "#5cadc8",
  "#6786e1",
  "#629fe1",
  "#80c7e6",
  "#06171b",
  "#011f1e",
  "#07282d",
  "#184745",
  "#225862",
  "#308b8d",
  "#60b087",
  "#63bfa9",
  "#69ce9b",
  "#05251b",
  "#284900",
  "#01463b",
  "#266b4e",
  "#2c8a00",
  "#6e9900",
  "#47b36f",
  "#82ca1f",
  "#7ac860",
  "#9eda8c",
  "#6b671e",
  "#746845",
  "#a39816",
  "#b8a36d",
  "#c3b565",
  "#bfc351",
  "#bdcf64",
  "#bce17d",
  "#4b2900",
  "#cfa15a",
  "#e5c622",
  "#e1c35f",
  "#ded07c",
  "#e1df7a",
  "#642e12",
  "#cc780a",
  "#bc824c",
  "#e69240",
  "#e6a469",
  "#ceb696",
  "#212121",
  "#7c7c7c",
  "#ababab",
  "#c6c1b6",
  "#d9d9d9",
];

export const MiiSwitchSkinColorList: Record<number, string> = {
  0: "#ffd3ad",
  1: "#ffb66b",
  2: "#de7942",
  3: "#ffaa8c",
  4: "#ad5129",
  5: "#632c18",
  6: "#ffbea5",
  7: "#ffc58f",
  8: "#8c3c23",
  9: "#3c2d23",
};

export const ToVer3GlassTypeTable = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 1, 3, 7, 7, 6, 7, 8, 7, 7,
];
export const ToVer3HairColorTable = [
  0, 1, 2, 3, 4, 5, 6, 7, 0, 4, 3, 5, 4, 4, 6, 2, 0, 6, 4, 3, 2, 2, 7, 3, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 4, 0, 0, 4, 4,
  4, 4, 4, 4, 0, 0, 0, 4, 4, 4, 4, 4, 4, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 5, 7, 5,
  7, 7, 7, 7, 7, 6, 7, 7, 7, 7, 7, 3, 7, 7, 7, 7, 7, 0, 4, 4, 4, 4,
];
export const ToVer3EyeColorTable = [
  0, 2, 2, 2, 1, 3, 2, 3, 0, 1, 2, 3, 4, 5, 2, 2, 4, 2, 1, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 4, 4, 4, 4, 4, 4, 4, 1, 0, 4, 4, 4,
  4, 4, 4, 4, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 3, 3, 3,
  3, 3, 3, 3, 3, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1,
];
export const ToVer3MouthColorTable = [
  4, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4, 1, 4, 4, 4, 0, 1, 2, 3, 4, 4, 2,
  3, 3, 4, 4, 4, 4, 1, 4, 4, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 4, 4, 4, 3,
  3, 3, 3, 3, 4, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 4, 4, 3,
  3, 3, 3, 3, 3, 4, 3, 3, 3, 3, 3, 4, 0, 3, 3, 3, 3, 4, 3, 3, 3, 3,
];
export const ToVer3GlassColorTable = [
  0, 1, 1, 1, 5, 1, 1, 4, 0, 5, 1, 1, 3, 5, 1, 2, 3, 4, 5, 4, 2, 2, 4, 4, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 0, 0, 0, 5, 5, 5, 5, 5, 5, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 5, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5,
];
export const ToVer3FacelineColorTable = [0, 1, 2, 3, 4, 5, 0, 1, 5, 5];
