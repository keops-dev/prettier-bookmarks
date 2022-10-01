import {
    BookmarkTreeNode,
    BookmarkTreeNodeExtended,
    OnMovedMoveInfo,
    UpdateBookmarkProp
} from "./types"
import { BookmarkExtended } from "./BookmarkExtended"
import { DB } from "./utils/misc"

// APIs
const bookmarksAPI = browser.bookmarks
const storageAPI = browser.storage

// Constantes
const BOOKMARK_ROOT: BookmarkTreeNodeExtended = {
    id: "root________",
    title: "",
    index: 0,
    type: "folder",
    children: []
}

export class PrettierManager extends EventTarget {
    bookmarks: BookmarkTreeNodeExtended
    BookmarkExtended: BookmarkExtended

    constructor() {
        super()

        this.bookmarks = BOOKMARK_ROOT

        // bind listeners callback to manager
        this.handleCreated = this.handleCreated.bind(this)
        this.handleChanged = this.handleChanged.bind(this)
        this.handleRemoved = this.handleRemoved.bind(this)
        this.handleMoved = this.handleMoved.bind(this)
    }

    /**
     * Démarre le manager de marque-page.
     * Synchronise les marque-pages avec ceux de l'API bookmarks
     * au cas où il y ai eu du changement sur un autre navigateur, tout en gardant les icônes et les couleurs de dossiers
     * enregistrés dans l'api storage.
     * Envoie aussi un "ping" à l'application native pour vérifier qu'elle est bien installée.
     */
    start(): void {
        console.log("PrettierManager init")

        this.isBookmarksInStorage()
            .then((isTrue) => {
                if (isTrue) {
                    void this.syncBookmarksWithStorage()
                } else {
                    console.log("Creating Bookmarks in storage")
                    void this.createDefaultBookmarksInStorage()
                }
            })
            .catch((error) => console.error(error))

        this.sendNativeMessage("pbnative_ping")
            .then((response) => {
                if (response === true) {
                    console.log("Native app connected")
                } else {
                    void browser.notifications.create({
                        type: "basic",
                        title: "L'application PbNative n'a pas été trouvée",
                        message:
                            "Vous devez avoir PbNative installé pour que Prettier Bookmarks puisse mettre à jour Firefox. Reportez-vous à la documentation."
                    })
                }
            })
            .catch((error) => {
                void browser.notifications.create({
                    type: "basic",
                    title: "L'application PbNative n'a pas été trouvée",
                    message:
                        "Vous devez avoir PbNative installé pour que Prettier Bookmarks puisse mettre à jour Firefox. Reportez-vous à la documentation."
                })
                console.error(error)
            })
    }

    /**
     * Dit si l'entrée "bookmarks" existe dans l'API storage
     * @returns boolean
     */
    async isBookmarksInStorage(): Promise<boolean> {
        try {
            const storage = await storageAPI.local.get("bookmarks")

            if (storage.bookmarks !== undefined) {
                return true
            } else {
                console.log("Folders doesn't exist in storage")
            }
        } catch (error) {
            console.error(error)
        }

        return false
    }

    /**
     * Crée une entrée "bookmarks" dans l'API storage avec les marque-pages existants dans l'api bookmarks
     */
    async createDefaultBookmarksInStorage(): Promise<void> {
        console.log("Create Bookmarks in storage")

        try {
            await DB.clearFavicon()
            const tree = await bookmarksAPI.getTree()

            this.BookmarkExtended = BookmarkExtended.create(tree[0])

            await this.storeBookmarks()
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * Synchronise les marque-pages de l'api bookmarks avec ceux enregistrés.
     * L'api bookmarks est source de vérité. Seul les icônes et les couleurs de dossiers sont gardés.
     */
    async syncBookmarksWithStorage(): Promise<void> {
        console.log("sync bookmarks with storage")

        try {
            const storedBookmarks = await this.getBookmarksInStorage()
            const browserFolders = await bookmarksAPI.getTree()

            console.log("Stored bookmarks", storedBookmarks)

            this.BookmarkExtended = BookmarkExtended.create(storedBookmarks)

            this.browseThroughBookmarkTree(
                browserFolders[0],
                (bookmark: BookmarkTreeNode) => {
                    const toUpdate = this.BookmarkExtended.get(bookmark.id)

                    if (toUpdate == null) {
                        const newBookmark = BookmarkExtended.create(bookmark)
                        console.log("toAdd")

                        this.BookmarkExtended.add(newBookmark)
                    } else {
                        if (!BookmarkExtended.compare(toUpdate, bookmark)) {
                            console.log("toUpdate")
                            toUpdate.update(bookmark)
                        }
                    }
                }
            )

            this.BookmarkExtended.cleanRemoved(browserFolders[0])

            console.log("synced bookmarks", this.BookmarkExtended)

            await this.storeBookmarks()
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * Retourne les marque-pages enregistrées dans l'api storage
     * TODO: créer une classe StorageAPI et une autre BookmarksAPI ?
     */
    async getBookmarksInStorage(): Promise<BookmarkTreeNodeExtended> {
        try {
            const bookmarks = await storageAPI.local.get("bookmarks")

            return bookmarks.bookmarks
        } catch (error) {
            console.error(error)
            return error
        }
    }

    /**
     * Parcours l'arbre des marque-pages
     */
    browseThroughBookmarkTree(
        bookmark: BookmarkTreeNodeExtended,
        callback: (bookmark: BookmarkTreeNodeExtended) => void
    ): void {
        const toVisit: BookmarkTreeNodeExtended[] = []

        toVisit.push(bookmark)

        while (toVisit.length > 0) {
            const current = toVisit.pop()

            if (current != null) {
                callback(current)
            }

            if (current?.children != null) {
                for (const children of current.children) {
                    toVisit.push(children)
                }
            }
        }
    }

    /**
     * Enregistre les marque-pages dans une entrée "bookmarks" dans l'api storage
     */
    async storeBookmarks(): Promise<void> {
        try {
            await storageAPI.local.set({ bookmarks: this.BookmarkExtended })
            console.log("bookmarks stored in storage")
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * Crée un nouveau marque page dans l'api bookmarks
     */
    async createBookmark(
        data: browser.bookmarks.CreateDetails
    ): Promise<BookmarkTreeNode> {
        return await bookmarksAPI.create(data)
    }

    /**
     * Met à jour un marque-page donné dans l'api bookmarks et dans l'api storage
     */
    async updateBookmark(
        id: string,
        prop: UpdateBookmarkProp,
        value: string
    ): Promise<void> {
        console.log("updateFolder", id, prop, value)

        try {
            const updatedFolder = await bookmarksAPI.update(id, {
                [prop]: value
            })
            if (updatedFolder != null && typeof value === "string") {
                console.debug(
                    `Bookmark [id: ${id}] title has been updated : ${prop} -> ${value}`
                )
            }

            const updated = this.BookmarkExtended.update({ [prop]: value }, id)

            if (updated != null) {
                await this.sendNativeMessage("update_folder", {
                    folder: {
                        id,
                        title: updated.title,
                        icon: updated.icon,
                        color: updated.color
                    }
                })
            }

            await this.storeBookmarks()
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * Met à jour l'icone et la couleur d'un dossier de marque-page dans l'api storage.
     * Envoie aussi un message à l'application native pour qu'elle mette à jour le fichier prettierBookmarks.css
     * (lié à userChrome.css qui permet de changer l'interface de Firefox)
     */
    async updateBookmarkIcon(
        id: string,
        icon: string,
        color: string
    ): Promise<void> {
        const updated = this.BookmarkExtended.update({ icon, color }, id)

        console.log("updated ", updated)

        if (updated != null) {
            const res = await this.sendNativeMessage("update_folder", {
                folder: {
                    id,
                    title: updated.title,
                    icon: updated.icon,
                    color: updated.color
                }
            })

            if (res === true) {
                await browser.notifications.create({
                    type: "basic",
                    title: "Dossier mis à jour",
                    message:
                        "Pour appliquer les changements veuillez relancer Firefox"
                })
            }
        }

        await this.storeBookmarks()
    }

    /**
     * Envoie un message à l'application native.
     * Puis écoute, pour interpreter, sa réponse avec listenNativeMessage()
     */
    async sendNativeMessage(action: string, data?: any): Promise<any> {
        console.log("Sending native message")

        try {
            const response = await browser.runtime.sendNativeMessage(
                "prettier_bookmarks",
                { action, data }
            )
            const res = await this.listenNativeMessage(response)

            if (res != null) {
                return res
            }
        } catch (error) {
            console.log(error)
        }
    }

    /**
     * Ecoute les réponses de l'application native et les interprètes pour être utiliser avec l'extension
     */
    async listenNativeMessage(response): Promise<boolean | undefined> {
        if (response != null) {
            console.log("Received ", response)

            const { action, data } = response

            switch (action) {
                case "update_folder":
                    if (data === "true") {
                        return true
                    }
                    break
                case "pbnative_ping":
                    if (data === "true") {
                        return true
                    }
                    break
                default:
                    break
            }
        }
    }

    // En dessous, les fonctions qui gèrent les évènements émits par bookmarks Api
    /**
     * Ecoute les évènements "onCreated" déclenchés par l'api bookmarks.
     * Enregistre le nouveau marque-page dans l'api storage
     * Et déclenche à son tour un évènement "onCreated" qui est écouté par l'ui
     */
    public handleCreated(
        id: string,
        createdBookmark: BookmarkTreeNodeExtended
    ): void {
        const newBookmark = BookmarkExtended.create(createdBookmark)
        console.log("new book", newBookmark)

        const event = new CustomEvent("onCreated", {
            detail: { id, bookmark: newBookmark }
        })

        this.BookmarkExtended.add(newBookmark)

        this.dispatchEvent(event)
        void this.storeBookmarks()
    }

    /**
     * Ecoute les évènements "onChanged" déclenchés par l'api bookmarks.
     * Enregistre les modifications dans l'api storage
     * Et déclenche à son tour un évènement "onChanged" qui est écouté par l'ui
     */
    public handleChanged(
        id: string,
        changeInfo: browser.bookmarks._OnChangedChangeInfo
    ): void {
        console.debug("Bookmark has changed in the api", id, changeInfo)
        const event = new CustomEvent("onChanged", {
            detail: { id, bookmark: this.BookmarkExtended.get(id) }
        })

        this.BookmarkExtended.update(changeInfo, id)

        this.dispatchEvent(event)
        void this.storeBookmarks()
    }

    /**
     * Ecoute les évènements "onRemoved" déclenchés par l'api bookmarks.
     * Enregistre supprime le marque-page dans l'api storage
     * Et déclenche à son tour un évènement "onRemoved" qui est écouté par l'ui
     */
    handleRemoved(
        id: string,
        removeInfo: browser.bookmarks._OnRemovedRemoveInfo
    ): void {
        console.debug("Bookmark has removed in the api", id, removeInfo.node)

        // Event trigger to be handle by UI
        const event = new CustomEvent("onRemoved", {
            detail: { id, bookmark: this.BookmarkExtended.get(id) }
        })
        this.dispatchEvent(event)

        this.BookmarkExtended.remove(id)

        void this.storeBookmarks()
    }

    /**
     * TODO: Pas encore géré pour l'instant, à faire.
     */
    public handleMoved(id: string, moveInfo: OnMovedMoveInfo): void {
        console.debug("Bookmark has moved in the api", id)
        this.dispatchEvent(
            new CustomEvent("onMoved", {
                detail: { id, moveInfo }
            })
        )
    }
}
