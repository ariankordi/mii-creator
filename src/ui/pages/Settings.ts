import Mii from "../../external/mii-js/mii";
import { AddButtonSounds } from "../../util/AddButtonSounds";
import { Button } from "../components/Button";
import {
  FeatureSetType,
  MiiPagedFeatureSet,
} from "../components/MiiPagedFeatureSet";
import Modal from "../components/Modal";
import { MainMenu } from "./MainMenu";
import { Buffer as Buf } from "../../../node_modules/buffer/index";
import { RenderPart } from "../../class/MiiEditor";

// settings is unfinished, will not be accessible for now
export function Settings() {
  const modal = Modal.modal("Settings", "", "body", {
    text: "Cancel",
    callback(e) {
      MainMenu();
    },
  });
}
