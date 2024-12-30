import {
  FeatureSetType,
  MiiPagedFeatureSet,
} from "../components/MiiPagedFeatureSet";
import EditorIcons from "../../constants/EditorIcons";
import type { TabRenderInit } from "../../constants/TabRenderType";
import { ArrayNum } from "../../util/NumberArray";
import { RenderPart } from "../../class/MiiEditor";
import type Mii from "../../external/mii-js/mii";
import { MiiFavoriteColorLookupTable } from "../../constants/ColorTables";
import { numToHex } from "../../util/NumberToHexString";

export function ExtHatTab(data: TabRenderInit) {
  data.container.append(
    MiiPagedFeatureSet({
      mii: data.mii,
      onChange: data.callback,
      entries: {
        extHatType: {
          label: "Hat",
          header:
            "Hat type is a CUSTOM property, and will not transfer to any other data formats.\n\nKeep in mind that hat textures do not show up in 2D mode and 2D render previews as the server does not support it yet!",
          items: [
            {
              type: FeatureSetType.Icon,
              forceRender: true,
              value: 0,
              icon: '<svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g id="eyebrows-24">\n<path id="Vector" d="M25.9999 42.0501C34.8862 42.0501 42.0899 34.8464 42.0899 25.9601C42.0899 17.0739 34.8862 9.87012 25.9999 9.87012C17.1137 9.87012 9.90991 17.0739 9.90991 25.9601C9.90991 34.8464 17.1137 42.0501 25.9999 42.0501Z" fill="var(--icon-head-fill)" stroke="var(--icon-head-stroke)" stroke-width="2.48"/>\n</g>\n</svg>\n',
              part: RenderPart.Head,
            },
            ...ArrayNum(10)
              .slice(1)
              .map((k) => ({
                type: FeatureSetType.Icon as any,
                forceRender: true,
                value: k,
                icon: data.icons.hat[k - 1],
                part: RenderPart.Head,
              })),
          ],
        },
        extHatColor: {
          label: "Hat Color",
          header:
            "Hat color is a CUSTOM property, and will not transfer to any other data formats.\n\nKeep in mind that hat textures do not show up in 2D mode and 2D render previews as the server does not support it yet!",
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
