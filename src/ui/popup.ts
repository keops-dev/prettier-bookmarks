import {
    BackgroundWindow,
    UpdateBookmarkProp,
    UpdateBookmarkValues,
    UpdateBookmarkValuesIcon
} from "../types"
import { createLeftPanelFolder } from "./components/LeftPanelFolder"
import { createSearchBar, SearchBarElement } from "./components/SearchBar"
import {
    BookmarkListElement,
    createBookmarkList
} from "./components/BookmarkList"
import { FooterElement, createBookmarkForm } from "./components/Footer"
import { createFolderTree, FolderTreeElement } from "./components/FolderTree"
import { PrettierManager } from "../PrettierManager"
import { BookmarkExtended } from "../BookmarkExtended"

class Popup {
    Manager: PrettierManager
    leftPanelTreeEl: HTMLUListElement
    currentBookmark: string
    currentFolder: string
    topBar: HTMLDivElement
    searchContainer: HTMLDivElement
    leftPanel: HTMLDivElement
    rightPanel: HTMLDivElement
    bookmarkList: BookmarkListElement
    form: FooterElement
    folderTree: FolderTreeElement
    searchBar: SearchBarElement
    options: HTMLSpanElement
    expandBtn: HTMLElement

    addFolderButton: HTMLLIElement
    addBookmarkButton: HTMLLIElement
    aboutButton: HTMLLIElement

    constructor() {
        const win = browser.extension.getBackgroundPage() as BackgroundWindow
        this.Manager = win.PrettierManager as PrettierManager

        this.getElements()

        // *** build ui ***
        this.bookmarkList = createBookmarkList()
        this.form = createBookmarkForm()
        this.folderTree = createFolderTree()
        this.searchBar = createSearchBar("search-bar")

        this.folderTree.init()

        this.leftPanel.appendChild(this.folderTree)
        this.rightPanel.appendChild(this.bookmarkList)
        this.rightPanel.appendChild(this.form)
        this.searchContainer.appendChild(this.searchBar)

        this.addEventListeners()
    }

    getElements(): void {
        this.leftPanel = document.getElementById("left-panel") as HTMLDivElement
        this.rightPanel = document.getElementById(
            "right-panel"
        ) as HTMLDivElement

        this.leftPanelTreeEl = document.getElementById(
            "left-tree"
        ) as HTMLUListElement

        this.topBar = document.getElementById("top-bar") as HTMLDivElement
        this.searchContainer = document.getElementById(
            "search-container"
        ) as HTMLDivElement

        this.addFolderButton = document.getElementById(
            "add-folder"
        ) as HTMLLIElement
        this.addBookmarkButton = document.getElementById(
            "add-bookmark"
        ) as HTMLLIElement
        this.aboutButton = document.getElementById("about") as HTMLLIElement

        this.options = document.getElementById("options") as HTMLSpanElement
        this.expandBtn = document.getElementById("expand") as HTMLElement
    }

    addEventListeners(): void {
        console.log("add event listeners")

        this.Manager.addEventListener(
            "onCreated",
            this.handleCreated.bind(this)
        )
        this.Manager.addEventListener("onChanged", this.handleChange.bind(this))
        this.Manager.addEventListener(
            "onRemoved",
            this.handleRemoved.bind(this)
        )

        this.form.addEventListener(
            "pb:bookmark-update",
            (event: CustomEvent) => {
                const { id, prop, value } = event.detail

                this.onBookmarkUpdated(id, prop, value)
            }
        )

        this.bookmarkList.addEventListener("selected", (event: CustomEvent) => {
            event.stopPropagation()
            const detail = event.detail
            const bookmark = detail.bookmark

            this.currentBookmark = bookmark.id

            if (bookmark.isFolderType === true) {
                this.currentFolder = bookmark.id
                this.folderTree.setCurrentFolder(bookmark.id)
                this.bookmarkList.setById(bookmark.id)
            }

            this.form.showForm(bookmark.type, bookmark.id)
        })

        this.folderTree.addEventListener(
            "folder-click",
            (event: CustomEvent) => {
                console.log("detail apres folder-click", event.detail)

                const id = event.detail.id

                this.currentBookmark = id
                this.currentFolder = id

                this.form.showForm("folder", id)
                this.bookmarkList.setById(id)
            }
        )

        this.searchBar.addEventListener(
            "input",
            this.onSearch.bind(this),
            false
        )

        this.addFolderButton.addEventListener("click", () => {
            void this.onAddClick("folder")
        })

        this.addBookmarkButton.addEventListener("click", () => {
            void this.onAddClick("bookmark")
        })

        this.expandBtn.addEventListener("click", () => {
            console.log("expand")
            browser.tabs
                .create({
                    active: true,
                    url: new URL(
                        "popup_fullpage.html",
                        import.meta.url
                    ).toString()
                })
                .then((windowInfo) => {
                    console.debug("Popup created", windowInfo)
                })
                .catch((error) => {
                    console.error(error)
                })

            window.close()
        })
        console.log("WINDOWS", window)
    }

    async onAddClick(
        type: browser.bookmarks.BookmarkTreeNodeType
    ): Promise<void> {
        const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1)

        const data = {
            type,
            title: browser.i18n.getMessage(`new${typeCapitalized}`),
            parentId: this.currentBookmark ?? undefined,
            url: "https://_____"
        }

        console.log("DATA", data)

        try {
            const created = await this.Manager.createBookmark(data)

            this.form.showForm(type, created.id)
        } catch (error) {
            console.error(error)
        }
    }

    // déclenché lorsqu'on entre quelque chose dans la barre de recherche
    onSearch(event): void {
        console.log("on search")

        const target = event.currentTarget

        if (target != null) {
            const value = target.value

            console.log("search val", value)

            if (value !== "") {
                // on ferme le panneau de gauche
                this.folderTree.closeAll()

                // on affiche les resultats dans la liste
                const bookmarks = this.Manager.BookmarkExtended.search(value)
                this.bookmarkList.setInList(bookmarks)

                // on ferme le formulaire s'il est ouvert
                this.form.close()
            } else {
                this.bookmarkList.clear()
            }
        }
    }

    onBookmarkUpdated(
        id: string,
        prop: UpdateBookmarkProp,
        value: UpdateBookmarkValues
    ): void {
        console.log("onBookmarkChange")

        const bookmark = this.Manager.BookmarkExtended.get(id)

        if (bookmark != null) {
            // if(prop != "icon") {}
            if (bookmark.isFolderType) {
                this.folderTree.updateFolder(id, prop, value)
            }

            if (this.currentBookmark === bookmark.parentId) {
                this.bookmarkList.updateBookmark(id, prop, value)
            }

            if (prop !== "icon") {
                const val = value as string
                void this.Manager.updateBookmark(id, prop, val)
            } else {
                const { icon, color } = value as UpdateBookmarkValuesIcon
                void this.Manager.updateBookmarkIcon(id, icon, color)
            }
        } else {
            console.error("Bookmark to update not found")
        }
    }

    // fonctions exécutées après un évènement bookmarkApi

    handleCreated(event: CustomEvent): void {
        console.log("UI handle created", event, event.detail)

        const detail = event.detail
        const newBookmark = detail.bookmark as BookmarkExtended
        const parentId = newBookmark.parentId

        // if it's a folder it's added to left panel folder
        if (newBookmark.isFolderType && parentId != null) {
            const folder = createLeftPanelFolder(newBookmark)
            this.folderTree.addFolder(parentId, folder)
        }

        // if it's added to current folder we update bookmarkList
        if (this.currentBookmark === parentId) {
            this.bookmarkList.addBookmark(newBookmark)
        }
    }

    handleChange(event: CustomEvent): void {
        console.log("UI handle change")

        const detail = event.detail
        const { id, bookmark } = detail

        if (bookmark.isFolderType === true) {
            this.folderTree.updateFolder(id, "title", bookmark.title)
        }

        console.log("test", this.currentBookmark, detail.bookmark.parentId)

        if (this.currentBookmark != null) {
            // if it's added to current folder we update bookmarkList
            if (this.currentBookmark === detail.bookmark.parentId) {
                this.bookmarkList.setById(this.currentBookmark)
            }

            // if it's current bookmark, we update the form
            if (this.currentBookmark === detail.bookmark.id) {
                this.form.showForm(bookmark.type, detail.id)
            }
        }
    }

    handleRemoved(event: CustomEvent): void {
        const detail = event.detail

        // handl left panel
        if (detail.bookmark.isFolderType === true) {
            this.folderTree.removeFolder(detail.id)
        }

        if (this.currentBookmark != null) {
            // if it's added to current folder we update bookmarkList
            if (this.currentBookmark === detail.bookmark.parentId) {
                this.bookmarkList.removeBookmark(detail.id)
            }

            // if it's current bookmark, we update the form
            if (this.currentBookmark === detail.bookmark.id) {
                this.form.showForm(
                    detail.bookmark.type,
                    detail.bookmark.parentId
                )
            }
        }
    }
}

const popup = new Popup()

if (popup == null) {
    throw new Error("Popup n'a pas pu être créé")
}

const env = process.env.NODE_ENV
// disable log in prod
if (env === "production") {
    console.log = () => {}
}
