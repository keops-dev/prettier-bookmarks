import { CreateCreateData } from "./types"

const env = process.env.NODE_ENV
const inDevMode = env === "development"

export const popupConfig: CreateCreateData = {
    titlePreface: "Prettier Bookmarks",
    type: inDevMode ? "normal" : "popup",
    url: new URL("ui/popup.html", import.meta.url).toString(),
    width: inDevMode ? 1200 : 640,
    height: inDevMode ? 800 : 400
}

export const ROOT_BOOKMARK_ID = "root________"
export const FOLDER_ID_PREFIX = "folder__"

// disable log in prod
if (env === "production") {
    console.log = () => {}
}
