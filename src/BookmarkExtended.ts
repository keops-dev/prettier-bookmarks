import {
    BookmarkTreeNode,
    BookmarkTreeNodeExtended,
    UpdateDetailsExtendedChange
} from "./types"
import {
    isSameHash,
    DB,
    getBaseUrl,
    getFaviconBlob,
    getFaviconHash,
    getFaviconUrl,
    isHypertextProtocol
} from "./utils/misc"
import { Queue } from "./utils/Queue"

const BOOKMARK_FOLDER_ICON_DEFAULT = "folder-outline"
const BOOKMARK_COLOR_DEFAULT = "#0F172A"

/**
 * Etend les marque-pages de Firefox pour ajouter un icône et une couleur d'icône aux dossiers de marque-page.
 * Permet également de les gérer plus simplement dans l'extension
 */
export class BookmarkExtended {
    id: string
    title: string
    index: number | undefined
    parentId: string | undefined
    type: browser.bookmarks.BookmarkTreeNodeType | undefined
    children: BookmarkExtended[] | undefined
    dateAdded: number | undefined
    dateGroupModified: number | undefined
    unmodifiable: "managed" | undefined
    url: string | undefined

    icon: string | undefined
    color: string | undefined

    constructor(bookmark: BookmarkTreeNodeExtended) {
        this.id = bookmark.id
        this.title = bookmark.title
        this.index = bookmark.index
        this.parentId = bookmark.parentId
        this.type = bookmark.type
        this.children = bookmark.children?.map((mark) =>
            BookmarkExtended.create(mark)
        )
        this.dateAdded = bookmark.dateAdded
        this.dateGroupModified = bookmark.dateGroupModified
        this.url = bookmark.url
        this.unmodifiable = bookmark.unmodifiable

        this.icon = bookmark.icon
        this.color = bookmark.color

        this.setIcon()
    }

    /**
     * Crée une nouvelle instance de BookmarkExtended avec pour racine le marque-page fourni
     */
    static create(
        bookmark: BookmarkTreeNode | BookmarkExtended
    ): BookmarkExtended {
        return new BookmarkExtended(bookmark)
    }

    get isBookmarkType(): boolean {
        return this.type === "bookmark"
    }

    get isFolderType(): boolean {
        return this.type === "folder"
    }

    get isSeparatorType(): boolean {
        return this.type === "separator"
    }

    setIcon(): void {
        if (this.type === "folder") {
            if (this.icon == null) {
                this.icon = BOOKMARK_FOLDER_ICON_DEFAULT
            }
            if (this.color == null) {
                this.color = BOOKMARK_COLOR_DEFAULT
            }
        } else if (this.type === "bookmark") {
            if (this.url != null && isHypertextProtocol(this.url)) {
                const baseUrl = getBaseUrl(this.url)

                this.icon = baseUrl
                void this.saveIconAsync(baseUrl)
            }
        }
    }

    async saveIconAsync(url: string): Promise<void> {
        const iconUrl = getFaviconUrl(url)

        try {
            const currentIconBlob = await getFaviconBlob(iconUrl)
            const storedFavicon = await DB.getFavicon(url)

            if (currentIconBlob != null) {
                if (
                    storedFavicon == null ||
                    !isSameHash(
                        await getFaviconHash(currentIconBlob),
                        storedFavicon.hash
                    )
                ) {
                    await DB.setFavicon(url, currentIconBlob)
                }
            } else {
                console.debug(`Aucun favicon trouvé pour ${url}`)
            }
        } catch (error) {
            console.error(error)
        }
    }

    forEachChild(
        callback: (bookmark: BookmarkExtended) => any
    ): BookmarkExtended | undefined {
        const toVisit = new Queue<BookmarkExtended>()

        toVisit.enqueue(this)

        while (toVisit.length > 0) {
            const current = toVisit.dequeue()

            if (current != null) {
                const res = callback(current)

                if (res != null) {
                    return res
                }
            }

            if (current?.children != null) {
                for (const child of current.children) {
                    toVisit.enqueue(child)
                }
            }
        }
    }

    add(bookmark: BookmarkExtended): void {
        const { parentId } = bookmark

        if (parentId != null) {
            if (parentId === this.id) {
                this.children?.push(bookmark)
            } else {
                const parent = this.get(parentId)
                parent?.add(bookmark)
            }
        }
    }

    update(
        changes: UpdateDetailsExtendedChange,
        id: string | null = null
    ): BookmarkExtended | undefined {
        if (this.id === id || id === null) {
            return Object.assign(this, changes)
        }

        const toUpdate = this.id === id ? this : this.get(id)

        if (toUpdate != null) {
            return Object.assign(toUpdate, changes)
        }
    }

    get(id: string): BookmarkExtended | undefined {
        if (id === this.id) {
            return this
        }

        return this.forEachChild((child: BookmarkExtended) =>
            child.id === id ? child : null
        )
    }

    remove(id: string): void {
        const parent = this.getParent(id)

        if (parent?.children != null) {
            parent.children = parent.children.filter((child) => child.id !== id)
        }
    }

    search(name: string): BookmarkExtended[] {
        const result: BookmarkExtended[] = []
        const nameLowerCase = name.toLocaleLowerCase()

        this.forEachChild((child) => {
            const childTitleLowerCase = child.title.toLocaleLowerCase()
            if (childTitleLowerCase.includes(nameLowerCase)) {
                result.push(child)
            }
        })

        return result
    }

    getClone(): BookmarkExtended {
        return JSON.parse(JSON.stringify(this))
    }

    filter(
        condition: (bookmark: BookmarkExtended) => boolean
    ): BookmarkExtended {
        const result: any = []
        const toVisit = new Queue<{
            node: BookmarkExtended
            parent: BookmarkExtended
        }>()

        const clone = this.getClone()

        toVisit.enqueue({ node: clone, parent: result })

        while (toVisit.length > 0) {
            const { node: current, parent } = toVisit.dequeue()

            if (current == null) {
                break
            }

            if (current?.children != null) {
                for (const child of current.children) {
                    toVisit.enqueue({ node: child, parent: current })
                }
            }

            if (current.children != null) {
                current.children.length = 0
            }

            if (condition(current)) {
                if (current.id === "root________") {
                    result.push(current)
                } else {
                    parent.children?.push(current)
                }
            }
        }

        return result[0]
    }

    getParent(id: string): BookmarkExtended | undefined {
        const item = this.get(id)

        if (item != null) {
            const { parentId } = item

            if (parentId != null) {
                const parent = this.get(parentId)

                if (parent != null) {
                    return parent
                }
            }
        }
    }

    getChildren(id: string): BookmarkExtended[] | undefined {
        if (this.id === id) {
            return this.children
        }

        const bookmark = this.get(id)
        if (bookmark != null) {
            return bookmark.children
        }
    }

    cleanRemoved(browserBookmarks: BookmarkTreeNode): void {
        const toVisit = new Queue<BookmarkExtended>()

        toVisit.enqueue(this)

        while (toVisit.length > 0) {
            const current = toVisit.dequeue()

            const inChild = BookmarkExtended.find(browserBookmarks, current.id)
            if (inChild == null) {
                this.remove(current.id)
            }

            if (current?.children != null) {
                for (const child of current.children) {
                    toVisit.enqueue(child)
                }
            }
        }
    }

    static find(
        bookmark: BookmarkTreeNode,
        id: string
    ): BookmarkTreeNode | undefined {
        const toVisit = new Queue<BookmarkTreeNode>()

        if (id === bookmark.id) {
            return bookmark
        }

        if (bookmark.children == null) {
            return
        }

        toVisit.enqueue(bookmark)

        while (toVisit.length > 0) {
            const current = toVisit.dequeue()

            if (current?.id === id) {
                return current
            }

            if (current?.children != null) {
                for (const child of current.children) {
                    toVisit.enqueue(child)
                }
            }
        }
    }

    static getRaw(
        bookmark: BookmarkExtended | BookmarkTreeNode
    ): BookmarkTreeNode {
        const raw = {
            id: bookmark.id,
            title: bookmark.title,
            type: bookmark.type,
            url: bookmark.url,
            parentId: bookmark.parentId,
            index: bookmark.index,
            dateAdded: bookmark.dateAdded,
            dateGroupModified: bookmark.dateGroupModified
        }
        return raw
    }

    static compare(
        object1: BookmarkTreeNode,
        object2: BookmarkTreeNode
    ): boolean {
        const raw1 = this.getRaw(object1)
        const raw2 = this.getRaw(object2)
        function isObject(object): boolean {
            return object != null && typeof object === "object"
        }

        const keys1 = Object.keys(raw1)
        const keys2 = Object.keys(raw2)
        if (keys1.length !== keys2.length) {
            return false
        }
        for (const key of keys1) {
            const val1 = raw1[key]
            const val2 = raw2[key]
            const areObjects = isObject(val1) && isObject(val2)
            if (
                (areObjects && !BookmarkExtended.compare(val1, val2)) ||
                (!areObjects && val1 !== val2)
            ) {
                return false
            }
        }
        return true
    }

    logMe(): void {
        console.log("hey ! look at me", this)
    }
}

export function createBookmarkExtended(
    bookmark: BookmarkTreeNode
): BookmarkExtended {
    return new BookmarkExtended(bookmark)
}
