import { BackgroundWindow, BookmarkTreeNodeExtended } from "../../types"
import { Bookmark, BookmarkElement, createBookmark } from "./Bookmark"
// @ts-expect-error
import cssText from "bundle-text:./BookmarkList.css"
import { PrettierManager } from "../../PrettierManager"
import { createSeparator, SeparatorElement } from "./Separator"

export interface BookmarkListElement extends HTMLElement {
    setInList: (bookmarks: BookmarkTreeNodeExtended[]) => void
    setById: (id: string) => void
    clear: () => void
    addBookmark: (bookmark: BookmarkTreeNodeExtended) => void
    updateBookmark: (id: string, prop: string, value: any) => void
    removeBookmark: (id: string) => void
}

const bgWindow = browser.extension.getBackgroundPage() as BackgroundWindow

export class BookmarkList extends HTMLElement {
    private readonly shadow: ShadowRoot
    private readonly Manager: PrettierManager
    private readonly placeholderContainer: HTMLDivElement
    private readonly placeholder: HTMLHeadElement
    private readonly list: HTMLUListElement
    private bookmarks: Array<BookmarkElement | SeparatorElement>

    constructor() {
        super()

        this.bookmarks = []

        this.shadow = this.attachShadow({ mode: "open" })
        this.Manager = bgWindow.PrettierManager as PrettierManager

        // elements
        this.placeholderContainer = document.createElement("div")
        this.placeholder = document.createElement("h1")
        this.list = document.createElement("ul")

        // layout
        this.placeholder.innerText = "Prettier Bookmarks"
        this.placeholder.classList.add("placeholder")

        this.placeholderContainer.classList.add("placeholder-container")

        this.list.classList.add("bookmark-list")

        // les styles du composant
        const style = document.createElement("style")
        style.textContent = cssText

        this.placeholderContainer.append(this.placeholder)

        this.shadow.appendChild(style)
        this.shadow.appendChild(this.placeholderContainer)
    }

    addBookmark(bookmark: BookmarkTreeNodeExtended): void {
        const newBookmark = createBookmark(bookmark)

        this.bookmarks.push(newBookmark)
        this.list.appendChild(newBookmark)
    }

    updateBookmark(id: string, prop: string, value: any): void {
        console.log("bookmark to update ", id)
        const bookmark = this.bookmarks.find(
            (bookmark) => bookmark.bookmarkId === id
        )

        if (bookmark != null && bookmark instanceof Bookmark) {
            switch (prop) {
                case "title":
                    bookmark.setTitle(value)
                    break
                case "icon":
                    void bookmark.setIcon(value)
                    break
                default:
                    console.error("Unmanaged property")
                    break
            }
        } else {
            console.error(`Bookmark "${id}" not found`)
        }
    }

    removeBookmark(id: string): void {
        const bookmark = this.bookmarks.find(
            (bookmark) => bookmark.bookmarkId === id
        )
        const bookmarks = this.bookmarks.filter(
            (bookmark) => bookmark.bookmarkId !== id
        )

        console.log("list", id, this.list, this.bookmarks)

        this.bookmarks = bookmarks

        if (bookmark != null) {
            this.list.removeChild(bookmark)
        } else {
            console.error(`Bookmark to remove id:${id} not found`)
        }
    }

    setById(id: string): void {
        console.log("setbyid()", id)

        const childrens = this.Manager.BookmarkExtended.getChildren(id)

        this.setInList(childrens)
    }

    setInList(bookmarks: BookmarkTreeNodeExtended[] = []): void {
        console.log("set bookmark", bookmarks)

        // const childrens = bookmark?.children as BookmarkTreeNodeExtended[];

        // remove existing list
        this.clear()

        if (bookmarks.length > 0) {
            if (!this.shadow.contains(this.list)) {
                this.shadow.removeChild(this.placeholderContainer)
                this.shadow.appendChild(this.list)
            }
        }

        // bookmarks.reverse()

        const fragment = this.createBookmarks(bookmarks)

        this.list.appendChild(fragment)
    }

    clear(): void {
        // clear bookmarks list
        if (this.bookmarks.length !== 0) this.bookmarks.length = 0

        if (this.list.hasChildNodes()) {
            while (this.list.firstChild != null) {
                this.list.removeChild(this.list.firstChild)
            }
        }

        if (this.shadow.contains(this.list)) {
            this.shadow.appendChild(this.placeholderContainer)
            this.shadow.removeChild(this.list)
        }
    }

    createBookmarks(bookmarks: BookmarkTreeNodeExtended[]): DocumentFragment {
        const fragment = document.createDocumentFragment()
        for (const current of bookmarks) {
            const bookmark =
                current.type === "separator"
                    ? createSeparator(current.id)
                    : createBookmark(current)

            if (current.type !== "separator") {
                bookmark.addEventListener("click", (e) => {
                    e.stopPropagation()
                    const customEvent = new CustomEvent("selected", {
                        detail: { bookmark: current }
                    })

                    this.dispatchEvent(customEvent)
                })
            }

            // ajoute les bookmarks dans la liste ...
            // y a peut etre un meilleur endroit pour ça
            this.bookmarks.push(bookmark)

            fragment.append(bookmark)
        }
        return fragment
    }
}

customElements.define("pb-bookmark-list", BookmarkList)

export function createBookmarkList(): BookmarkListElement {
    const bookmark = document.createElement(
        "pb-bookmark-list"
    ) as BookmarkListElement

    return bookmark
}
