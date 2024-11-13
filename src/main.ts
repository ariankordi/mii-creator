import Mii from "./external/mii-js/mii";
import { Buffer as Buf } from "../node_modules/buffer/index";
import { setupUi } from "./ui/setup";
import { MiiEditor } from "./class/MiiEditor";
import { Library } from "./ui/pages/Library";
import LazyLoad, { type ILazyLoadInstance } from "vanilla-lazyload";

declare global {
  interface Window {
    mii: Mii;
    Mii: any;
    editor: MiiEditor;
    buffer: Buf;
    localforage: LocalForage;
    LazyLoad: ILazyLoadInstance;
  }
}

//@ts-expect-error Buffer to keep in window for debugging purposes
window.buffer = Buf;

window.LazyLoad = new LazyLoad();

setupUi();
