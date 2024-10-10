import Html from "@datkat21/html";
import type Mii from "../../external/mii-js/mii";
import {
  FeatureSetType,
  MiiPagedFeatureSet,
  type FeatureSetIconItem,
} from "../components/MiiPagedFeatureSet";
import type { IconSet } from "../../class/MiiEditor";
import { ArrayNum } from "../../util/NumberArray";
import type { TabRenderInit } from "../../constants/TabRenderType";
import EditorIcons from "../../constants/EditorIcons";
import { MiiMouthColorTable } from "../../constants/ColorTables";

export function MouthTab(data: TabRenderInit) {
  data.container.append(
    MiiPagedFeatureSet({
      mii: data.mii,
      onChange: data.callback,
      entries: {
        mouthType: {
          label: "Type",
          items: ArrayNum(36).map((k) => ({
            type: FeatureSetType.Icon,
            value: k,
            icon: data.icons.mouth[k],
          })),
        },
        mouthColor: {
          label: "Color",
          items: ArrayNum(5).map((k) => ({
            type: FeatureSetType.Icon,
            value: k,
            color: MiiMouthColorTable[k],
          })),
        },
        mouthPosition: {
          label: "Position",
          items: [
            {
              type: FeatureSetType.Range,
              property: "mouthYPosition",
              iconStart: EditorIcons.positionMoveUp,
              iconEnd: EditorIcons.positionMoveDown,
              soundStart: "position_down",
              soundEnd: "position_up",
              min: 0,
              max: 18,
            },
            {
              type: FeatureSetType.Range,
              property: "mouthScale",
              iconStart: EditorIcons.positionSizeDown,
              iconEnd: EditorIcons.positionSizeUp,
              soundStart: "scale_down",
              soundEnd: "scale_up",
              min: 0,
              max: 7,
            },
            {
              type: FeatureSetType.Range,
              property: "mouthHorizontalStretch",
              iconStart: EditorIcons.positionStretchIn,
              iconEnd: EditorIcons.positionStretchOut,
              soundStart: "vert_stretch_down",
              soundEnd: "vert_stretch_up",
              min: 0,
              max: 6,
            },
          ],
        },
      },
    })
  );
}
