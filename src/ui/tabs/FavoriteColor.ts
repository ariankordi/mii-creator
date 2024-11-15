import {
  FeatureSetType,
  MiiPagedFeatureSet,
} from "../components/MiiPagedFeatureSet";
import { MiiFavoriteColorLookupTable } from "../../constants/ColorTables";
import { ArrayNum } from "../../util/NumberArray";
import type { TabRenderInit } from "../../constants/TabRenderType";
import { numToHex } from "../../util/NumberToHexString";
import { RenderPart } from "../../class/MiiEditor";
import EditorIcons from "../../constants/EditorIcons";

export function FavoriteColorTab(data: TabRenderInit) {
  data.container.append(
    MiiPagedFeatureSet({
      mii: data.mii,
      onChange: data.callback,
      entries: {
        favoriteColor: {
          label: "Favorite Color",
          items: ArrayNum(12).map((k) => ({
            type: FeatureSetType.Icon,
            forceRender: true,
            value: k,
            color: numToHex(MiiFavoriteColorLookupTable[k]),
            part: RenderPart.Head,
          })),
        },
        extHatColor: {
          label: "Hat Color",
          header:
            "Hat color is a CUSTOM property, and will not transfer to any other data formats. It is purely visual and provided for the ability to use in renders.",
          items: [
            {
              type: FeatureSetType.Icon,
              forceRender: true,
              value: 0,
              icon: '<svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g id="eyebrows-24">\n<path id="Vector" d="M25.9999 42.0501C34.8862 42.0501 42.0899 34.8464 42.0899 25.9601C42.0899 17.0739 34.8862 9.87012 25.9999 9.87012C17.1137 9.87012 9.90991 17.0739 9.90991 25.9601C9.90991 34.8464 17.1137 42.0501 25.9999 42.0501Z" fill="var(--icon-head-fill)" stroke="var(--icon-head-stroke)" stroke-width="2.48"/>\n</g>\n</svg>\n',
              part: RenderPart.Head,
            },
            ...ArrayNum(12).map((k) => ({
              type: FeatureSetType.Icon as any,
              forceRender: true,
              value: k + 1,
              color: numToHex(MiiFavoriteColorLookupTable[k]),
              part: RenderPart.Head,
            })),
          ],
        },
      },
    })
  );
}
