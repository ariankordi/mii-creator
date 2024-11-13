import localforage from "localforage";
import Modal from "../components/Modal";
import { MainMenu } from "./MainMenu";

export function SaveDataManager() {
  Modal.modal(
    "Save Data",
    "Choose an option",
    "body",
    // TODO implement this, nearly finished
    // {
    //   text: "Import Save Data",
    //   async callback(e) {
    //     if (
    //       (await Modal.prompt(
    //         "WARNING",
    //         "This will overwrite ALL of your currently saved Miis and delete them forever! Please back up your save data before using this option.\n\nAre you certain that you understand the risk?",
    //         "body"
    //       )) === false
    //     )
    //       return;

    //     const input = document.createElement("input");
    //     input.type = "file";
    //     input.accept = "application/json";
    //     document.body.appendChild(input);
    //     input.click();
    //     requestAnimationFrame(() => {
    //       document.body.removeChild(input);
    //     });
    //     input.addEventListener("change", async (e) => {
    //       if (input.files === null) return;
    //       if (input.files[0] === undefined) return;
    //       console.log(input.files);
    //       const json = await input.files![0].json();
    //       console.log("THE JSON!!", json);
    //       MainMenu();
    //     });
    //   },
    // },
    {
      text: "Export Save Data",
      async callback(e) {
        let data: Record<string, string> = {};
        for (const key of (await localforage.keys()).filter((k) =>
          k.startsWith("mii")
        )) {
          console.log(key);
          data[key] = (await localforage.getItem(key)) as string;
        }
        console.log(data);
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(data)], { type: "application/json" })
        );
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.download = "mii-editor-save-data.json";
        document.body.appendChild(a);
        a.click();
        requestAnimationFrame(() => {
          a.remove();
        });
        MainMenu();
      },
    },
    {
      text: "Cancel",
      callback(e) {
        MainMenu();
      },
    }
  );
}
