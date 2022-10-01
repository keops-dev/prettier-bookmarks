import {
    BackgroundWindow,
    BookmarkTreeNodeExtended,
    UpdateBookmarkProp,
    UpdateBookmarkValues,
    UpdateBookmarkValuesIcon
} from "../../types"
// @ts-expect-error
import cssText from "bundle-text:./FolderTree.css"
import { PrettierManager } from "../../PrettierManager"
import {
    createLeftPanelFolder,
    LeftPanelFolderElement
} from "./LeftPanelFolder"
import { FOLDER_ID_PREFIX, ROOT_BOOKMARK_ID } from "../../config"

export interface FolderTreeElement extends HTMLElement {
    init: () => void
    addFolder: (parentId: string, folder: LeftPanelFolderElement) => void
    removeFolder: (id: string) => void
    getFolder: (id: string) => LeftPanelFolderElement
    getFolders: () => any
    updateFolder: (id: string, prop: string, value: any) => any
    setCurrentFolder: (event: any) => void
    closeAll: () => void
}

const bgWindow = browser.extension.getBackgroundPage() as BackgroundWindow

export class FolderTree extends HTMLElement {
    private readonly Manager: PrettierManager
    private readonly shadow: ShadowRoot
    private readonly container: HTMLUListElement
    private readonly folders: LeftPanelFolderElement[]

    currentFolder: string

    constructor() {
        super()

        this.shadow = this.attachShadow({ mode: "open" })
        this.Manager = bgWindow.PrettierManager as PrettierManager
        this.folders = []

        this.container = document.createElement("ul")
        this.container.classList.add("container")

        const style = document.createElement("style")
        style.textContent = cssText

        this.shadow.appendChild(style)
        this.shadow.appendChild(this.container)

        this.dispatchClickOnFolder = this.dispatchClickOnFolder.bind(this)
    }

    closeAll(): void {
        if (this.currentFolder != null) {
            this.getFolder(this.currentFolder)?.textContainer.classList.remove(
                "active"
            )
        }

        this.currentFolder = ""

        for (const folder of this.folders) {
            if (folder.displayingSubfolders) {
                folder.hideSubfolders()
            }
        }
    }

    getFolder(id: string): LeftPanelFolderElement | undefined {
        const folder = this.folders.find(
            (elem) => elem.id === FOLDER_ID_PREFIX + id
        )
        return folder
    }

    getFolders(): LeftPanelFolderElement[] {
        return this.folders
    }

    addFolder(parentId: string, folder: LeftPanelFolderElement): void {
        const parent = this.getFolder(parentId)

        if (parent != null) {
            parent.appendChild(folder)

            folder.addEventListener("click", this.dispatchClickOnFolder)

            this.folders.push(folder)
        }
    }

    removeFolder(id: string): void {
        // remove from dom
        const folder = this.getFolder(id)
        if (folder != null) {
            folder.remove()
        } else {
            console.error(`Folder "${id}" not found`)
        }

        // remove from list
        this.folders.filter((folder) => folder.id !== id)
    }

    updateFolder(
        id: string,
        prop: UpdateBookmarkProp,
        value: UpdateBookmarkValues
    ): void {
        console.log("update folders", id)

        const folder = this.folders.find(
            (elem) => elem.id === FOLDER_ID_PREFIX + id
        ) as LeftPanelFolderElement

        if (folder != null) {
            if (prop === "title" && typeof value === "string") {
                folder.setText(value)
            } else if (prop === "icon") {
                const values = value as UpdateBookmarkValuesIcon
                folder.setIcon(values.icon)
                folder.setColor(values.color)
            }
        } else {
            console.error(`LeftPanel. Folder ${id} n'a pas été trouvé`)
        }
    }

    setCurrentFolder(event: MouseEvent | string): void {
        console.log("set current folder")

        let currentId = ""
        let target: any

        if (typeof event === "string") {
            currentId = event
            target = this.getFolder(event)
            target.showParents()
            target.showSubfolders()
        } else {
            target = event.currentTarget
            currentId = target.getAttribute("bookmarkid")
        }

        const previousId = this.currentFolder
        if (previousId != null) {
            this.getFolder(previousId)?.textContainer.classList.remove("active")
        }

        target.textContainer.classList.add("active")
        this.currentFolder = currentId
    }

    dispatchClickOnFolder(event): void {
        event.stopPropagation()
        console.log("dispatchClickOnFolder")

        const bookmarkId = event.currentTarget.getAttribute("bookmarkid")
        const customEvent = new CustomEvent("folder-click", {
            detail: { id: bookmarkId }
        })

        if (this.currentFolder !== bookmarkId) {
            this.dispatchEvent(customEvent)
        }
    }

    init(): void {
        const tree = this.Manager.BookmarkExtended.filter(
            (bookmark: BookmarkTreeNodeExtended) => bookmark.type === "folder"
        )
        console.log("init TREE", tree)

        const nodes: Array<{
            current: BookmarkTreeNodeExtended
            parent: LeftPanelFolderElement | HTMLUListElement
            level: number
        }> = []

        nodes.push({ current: tree, parent: this.container, level: 0 })

        while (nodes.length > 0) {
            const node = nodes.pop()

            if (node != null) {
                const { current, parent, level } = node

                const leftPanelFolder = createLeftPanelFolder(current, level)

                if (current.id !== ROOT_BOOKMARK_ID) {
                    parent.append(leftPanelFolder)

                    leftPanelFolder.addEventListener(
                        "click",
                        (event) => {
                            this.dispatchClickOnFolder(event)
                            this.setCurrentFolder(event)
                        },
                        false
                    )
                }

                if (current?.children != null) {
                    current.children.forEach(
                        (child: BookmarkTreeNodeExtended) => {
                            nodes.push({
                                current: child,
                                parent:
                                    current.id !== ROOT_BOOKMARK_ID
                                        ? leftPanelFolder
                                        : this.container,
                                level: level + 1
                            })
                        }
                    )
                }

                this.folders.push(leftPanelFolder)
            }
        }
    }
}

customElements.define("pb-folder-tree", FolderTree)

export function createFolderTree(): FolderTreeElement {
    const folderTree = document.createElement(
        "pb-folder-tree"
    ) as FolderTreeElement

    return folderTree
}
