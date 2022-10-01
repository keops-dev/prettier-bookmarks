import { popupConfig } from "./config"

// Ajoute des menus Prettier Bookmarks à un click droit sur les marque-pages
// TODO : pas géré pour le moment, à faire.

browser.menus.create({
    id: "add-bookmark",
    type: "normal",
    title: browser.i18n.getMessage("addBookmark"),
    contexts: ["bookmark"],
    icons: {
        48: "resources/svg/plus.svg"
    }
})

browser.menus.create({
    id: "edit-bookmark",
    type: "normal",
    title: browser.i18n.getMessage("editBookmark"),
    contexts: ["bookmark"],
    icons: {
        48: "resources/svg/pencil.svg"
    }
})

browser.menus.create({
    id: "remove-bookmark",
    type: "normal",
    title: browser.i18n.getMessage("removeBookmark"),
    contexts: ["bookmark"],
    icons: {
        48: "resources/svg/delete.svg"
    }
})

browser.menus.create({
    type: "separator",
    contexts: ["bookmark"]
})

browser.menus.create({
    id: "open-popup",
    type: "normal",
    title: browser.i18n.getMessage("openPrettierBookmarks"),
    contexts: ["bookmark"],
    icons: {
        48: "resources/svg/bookmark-multiple.svg"
    }
})

function openPopup(): void {
    void browser.windows.create(popupConfig)
}

browser.menus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case "open-popup":
            openPopup()
            console.log("menu :: ", info, tab)
            break
        case "add-bookmark":
            console.log("menu :: ", info, tab)
            break
        case "edit-bookmark":
            console.log("menu :: ", info, tab)
            break
        case "remove-bookmark":
            console.log("menu :: ", info, tab)
            break
    }
})
