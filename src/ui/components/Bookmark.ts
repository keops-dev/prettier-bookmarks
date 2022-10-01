import { BookmarkTreeNodeExtended } from "../../types"
// @ts-expect-error
import cssText from "bundle-text:./Bookmark.css"
import { DB, getFavicon } from "../../utils/misc"

export interface BookmarkElement extends HTMLElement {
    setTitle: (title: string) => void
    setIcon: (bookmark: BookmarkTreeNodeExtended) => void
    setBookmarkId: (id: string) => void
    bookmarkId: string
}

export class Bookmark extends HTMLElement {
    private readonly shadow: ShadowRoot
    private readonly container: HTMLLIElement

    private icon: HTMLImageElement
    private text: HTMLSpanElement

    public bookmarkId: string

    constructor() {
        super()

        this.shadow = this.attachShadow({ mode: "open" })

        const style = document.createElement("style")
        style.textContent = cssText

        // // elements
        this.container = document.createElement("li")
        this.icon = document.createElement("img")
        this.text = document.createElement("span")

        // styles
        this.container.part.add("bookmark")
        this.container.classList.add("bookmark")
        this.icon.classList.add("icon")

        // les styles du composant

        this.container.append(this.icon, this.text)

        this.shadow.appendChild(style)
        this.shadow.appendChild(this.container)
    }

    setBookmarkId(id: string): void {
        this.bookmarkId = id
    }

    setTitle(title: string): void {
        this.text.innerText = title
    }

    async setIcon(bookmark: BookmarkTreeNodeExtended): Promise<void> {
        if (
            bookmark.type === "folder" &&
            bookmark.icon != null &&
            bookmark.color != null
        ) {
            this.icon.style.mask = `url("../resources/svg/${bookmark.icon}.svg") center no-repeat`
            this.icon.style.backgroundColor = bookmark.color
        } else if (bookmark.type === "bookmark") {
            if (bookmark.icon != null) {
                const fav = await DB.getFavicon(bookmark.icon)

                if (fav != null) {
                    this.icon.src = URL.createObjectURL(fav.blob)
                }
            } else {
                this.icon.style.mask =
                    "url('../resources/svg/bookmark-outline.svg') center no-repeat"
                this.icon.style.backgroundColor = bookmark.color ?? "#000"
            }
        }
    }
}

customElements.define("pb-bookmark", Bookmark)

export function createBookmark(
    bookmark: BookmarkTreeNodeExtended
): BookmarkElement {
    const bookmarkElement = document.createElement(
        "pb-bookmark"
    ) as BookmarkElement

    if (bookmark != null) {
        if (bookmark.type !== "separator") {
            bookmarkElement.setTitle(bookmark.title)
            bookmarkElement.setIcon(bookmark)
            bookmarkElement.setBookmarkId(bookmark.id)
        }
    }
    return bookmarkElement
}
