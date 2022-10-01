import { BookmarkTreeNodeExtended } from "../../types"
// @ts-expect-error
import cssText from "bundle-text:./LeftPanelFolder.css"
import { FOLDER_ID_PREFIX } from "../../config"

export interface LeftPanelFolderElement extends HTMLElement {
    setBookmarkId: (id: string) => void
    setText: (text: string) => void
    setIcon: (icon: string | undefined) => void
    setColor: (color: string | undefined) => void
    setLevel: (level: number) => void
    append: () => void
    appendChild: <T extends Node>(node: T) => T
    showSubfolders: () => void
    hideSubfolders: () => void
    subFolders: HTMLUListElement
    bookmark: BookmarkTreeNodeExtended
    textContainer: HTMLDivElement
    displayingSubfolders: boolean
}

export class LeftPanelFolder extends HTMLElement {
    private readonly shadow: ShadowRoot
    public wrapper: HTMLLIElement
    private readonly textContainer: HTMLDivElement
    childContainer: HTMLDivElement
    subFolders: HTMLUListElement
    private text: HTMLSpanElement
    private readonly icon: HTMLDivElement

    level: number
    displayingSubfolders: boolean

    constructor() {
        super()

        this.shadow = this.attachShadow({ mode: "open" })

        // elements
        this.wrapper = document.createElement("li")
        this.textContainer = document.createElement("div")
        this.childContainer = document.createElement("div")
        this.subFolders = document.createElement("ul")
        this.text = document.createElement("span")
        this.icon = document.createElement("div")

        this.wrapper.part.add("pb-folder")
        // styles
        this.wrapper.classList.add("folder")
        this.textContainer.classList.add("title-container")
        this.subFolders.classList.add("subfolders")
        this.childContainer.classList.add("child-container")
        // this.childContainer.hidden = true
        this.text.classList.add("title")
        this.icon.classList.add("icon")

        // les styles du composant
        const style = document.createElement("style")

        style.textContent = cssText

        this.textContainer.append(this.icon, this.text)

        this.childContainer.appendChild(this.subFolders)

        this.wrapper.append(this.textContainer, this.childContainer)

        this.shadow.appendChild(style)
        this.shadow.appendChild(this.wrapper)

        this.displayingSubfolders = false

        // events
        this.textContainer.addEventListener(
            "click",
            this.toggleSubfolders.bind(this)
        )
        this.subFolders.addEventListener("childAdded", () =>
            console.log("cool un nouvel enfant")
        )
    }

    get hasChild(): boolean {
        return this.subFolders.hasChildNodes()
    }

    addCaret(): void {
        this.textContainer.classList.add("caret")
    }

    caretDown(): void {
        this.textContainer.classList.add("caret-down")
    }

    caretUp(): void {
        this.textContainer.classList.remove("caret-down")
    }

    toggleCaret(): void {
        this.textContainer.classList.toggle("caret-down")
        this.text.classList.toggle("font-medium")
    }

    append(...nodes: Array<string | Node>): void {
        if (!this.hasChild) this.addCaret()

        return this.subFolders.append(...nodes)
    }

    appendChild<T extends Node>(node: T): T {
        if (!this.hasChild) this.addCaret()

        return this.subFolders.appendChild(node)
    }

    hideChildrens(): void {
        console.log("hidechildrens")

        const childs: [NodeListOf<ChildNode>] = [this.subFolders.childNodes]

        while (childs.length > 0) {
            const nodes = childs.pop()

            if (nodes != null) {
                for (const node of nodes) {
                    const folder = node as LeftPanelFolderElement
                    const subFolders = folder.subFolders

                    childs.push(subFolders.childNodes)

                    if (folder.displayingSubfolders) {
                        folder.hideSubfolders()
                    }
                }
            }
        }
    }

    /**
     * Permet d'ouvrir les conteneurs parents si le dossier est imbriqué
     */
    showParents(): void {
        console.log("showparents")

        // @ts-expect-error
        let host = this.getRootNode().host

        while (host != null) {
            console.log("host", host, host.displayingSubfolders)
            if (host != null && host.nodeName !== "PB-FOLDER-TREE") {
                if (host.displayingSubfolders !== true) {
                    host.showSubfolders()
                }
            }

            host = host.getRootNode().host
        }
    }

    showSubfolders(): void {
        console.log("show subfolders")

        if (this.hasChild) {
            console.log("go animate down")

            this.caretDown()
            this.childAnimShow()
        }
        this.displayingSubfolders = true
    }

    hideSubfolders(): void {
        console.log("hidesubfolders")

        if (this.hasChild && this.displayingSubfolders) {
            this.caretUp()
            this.childAnimHide()
        }

        this.displayingSubfolders = false
    }

    childAnimShow(): void {
        this.childContainer
            .animate(
                [
                    { maxHeight: "0px" },
                    { maxHeight: `${this.subFolders.clientHeight}px` },
                    { maxHeight: "100%" }
                ],
                {
                    duration: 100,
                    fill: "forwards",
                    easing: "ease-in"
                }
            )
            .finished.then(() => {
                this.subFolders.animate(
                    [
                        {
                            filter: "brightness(100%)",
                            boxShadow:
                                "inset 0 0 0 #cbd5e1, inset 0 0 0 #f8fafc"
                        },
                        {
                            filter: `brightness(${100 - this.level * 2.5}%)`,
                            boxShadow:
                                "inset 0.1rem 0.1rem 0.2rem #cbd5e1, inset -0.2rem -0.2rem 0.4rem #f8fafc"
                        }
                    ],
                    { duration: 150, fill: "forwards", easing: "ease" }
                )
            })
            .catch((error) => console.error(error))
    }

    childAnimHide(): void {
        this.subFolders
            .animate(
                [
                    {
                        filter: "brightness(100%)",
                        boxShadow:
                            "inset 0.1rem 0.1rem 0.2rem #cbd5e1, inset -0.2rem -0.2rem 0.4rem #f8fafc"
                    },
                    {
                        filter: `brightness(${100 - this.level * 2.5}%)`,
                        boxShadow: "inset 0 0 0 #cbd5e1, inset 0 0 0 #f8fafc"
                    }
                ],
                { duration: 100, fill: "forwards" }
            )
            .finished.then(() => {
                this.childContainer.animate(
                    [
                        { maxHeight: "100%" },
                        { maxHeight: `${this.subFolders.clientHeight}px` },
                        { maxHeight: "0px" }
                    ],
                    {
                        duration: 100,
                        fill: "forwards"
                    }
                )
            })
            .catch((error) => console.error(error))
    }

    toggleSubfolders(): void {
        console.log("toggleSubfolders")

        if (!this.hasChild) {
            return
        }

        this.toggleCaret()

        if (this.displayingSubfolders) {
            this.childAnimHide()
            this.hideChildrens()
        } else {
            this.childAnimShow()
        }

        this.displayingSubfolders = !this.displayingSubfolders
    }

    setBookmarkId(id: string): void {
        this.setAttribute("bookmarkId", id)
        this.setAttribute("id", FOLDER_ID_PREFIX + id)
    }

    public setText(title: string): void {
        this.text.textContent = title
    }

    setIcon(icon: string | undefined): void {
        if (icon != null) {
            this.icon.style.mask = `url("../resources/svg/${icon}.svg") center no-repeat`
        }
    }

    setColor(color: string): void {
        if (color != null) {
            this.icon.style.backgroundColor = color
        }
    }

    setLevel(level: number): void {
        this.level = level
        // this.subFolders.style.filter = `brightness(${100 - level * 2.5}%)`
    }
}

customElements.define("pb-left-panel-folder", LeftPanelFolder)

export function createLeftPanelFolder(
    bookmark: BookmarkTreeNodeExtended,
    level: number = 0
): LeftPanelFolderElement {
    const leftPanelFolder = document.createElement(
        "pb-left-panel-folder"
    ) as LeftPanelFolderElement

    leftPanelFolder.bookmark = bookmark
    leftPanelFolder.setBookmarkId(bookmark.id)
    leftPanelFolder.setText(bookmark.title)
    leftPanelFolder.setIcon(bookmark.icon)
    leftPanelFolder.setColor(bookmark.color)
    leftPanelFolder.setLevel(level)

    return leftPanelFolder
}
