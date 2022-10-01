import {
    BackgroundWindow,
    BookmarkTreeNodeExtended,
    BookmarkTreeNodeType,
    UpdateBookmarkProp,
    UpdateBookmarkValues
} from "../../types"
// @ts-expect-error
import cssText from "bundle-text:./Footer.css"
import { PrettierManager } from "../../PrettierManager"
import { createIconPicker, IconPickerElement } from "./IconPicker"
import { DB } from "../../utils/misc"

export interface FooterElement extends HTMLElement {
    inputs: HTMLInputElement[]
    showForm: (type: BookmarkTreeNodeType, id?: string) => void
    close: () => void
}

const bgWindow = browser.extension.getBackgroundPage() as BackgroundWindow

const INPUTS_FOLDER = [{ label: "Nom", name: "title" }]
const INPUTS_BOOKMARK = [
    { label: "Nom", name: "title" },
    { label: "URL", name: "url" }
]

const InputContainer = (label: string, name: string): HTMLDivElement => {
    const tmpl = document.createElement("div")
    const labelElement = document.createElement("label")
    const inputElement = document.createElement("input")

    tmpl.classList.add("input-container")
    labelElement.textContent = label
    inputElement.type = "text"
    inputElement.name = name

    tmpl.append(labelElement, inputElement)

    return tmpl
}

export class Footer extends HTMLElement {
    private readonly Manager: PrettierManager
    private readonly shadow: ShadowRoot
    private readonly container: HTMLDivElement
    private readonly form: HTMLFormElement
    public inputs: HTMLInputElement[]
    private currentBookmark: BookmarkTreeNodeExtended | null
    private currentBookmarkId: string
    private readonly iconPicker: IconPickerElement
    private icon: HTMLImageElement
    private readonly wrapper: HTMLDivElement

    currentType: "folder" | "bookmark"

    constructor() {
        super()

        this.shadow = this.attachShadow({ mode: "open" })
        this.Manager = bgWindow.PrettierManager as PrettierManager

        // elements
        this.container = document.createElement("div")
        this.wrapper = document.createElement("div")
        this.icon = document.createElement("img")
        this.form = document.createElement("form")

        this.container.classList.add("container")
        this.wrapper.classList.add("wrapper")

        // iconPicker
        this.iconPicker = createIconPicker()
        document.body.appendChild(this.iconPicker)

        // icon
        this.icon.classList.add("icon")

        // inputs
        this.inputs = []

        this.wrapper.appendChild(this.form)
        this.container.appendChild(this.wrapper)

        // les styles du composant
        const style = document.createElement("style")
        style.textContent = cssText

        this.shadow.appendChild(style)
        this.shadow.appendChild(this.container)

        this.openIconPicker = this.openIconPicker.bind(this)
    }

    showForm(type: "folder" | "bookmark", id: string): void {
        // set inputs according to bookmark type
        type === "folder"
            ? this.buildInputsElements(INPUTS_FOLDER)
            : this.buildInputsElements(INPUTS_BOOKMARK)

        const bookmark = this.Manager.BookmarkExtended.get(id)

        if (bookmark == null) return

        this.currentType = type
        this.currentBookmark = bookmark
        this.currentBookmarkId = bookmark.id

        // set inputs values
        this.inputs.forEach((input) => {
            switch (input.name) {
                case "title":
                    if (bookmark.title != null) {
                        input.setAttribute("value", bookmark.title)
                    }
                    break
                case "url":
                    if (bookmark.url != null) {
                        input.setAttribute("value", bookmark.url)
                    }
                    break
                default:
                    console.error("Input not found")
                    break
            }
        })

        void this.setIcon(
            bookmark.type as string,
            bookmark.icon as string,
            bookmark.color
        )
    }

    private buildInputsElements(inputs: any): void {
        this.clearInputs()

        const inputFragment = document.createDocumentFragment()

        inputs.forEach((input) => {
            const container = InputContainer(input.label, input.name)
            const ipt = container.querySelector("input")

            if (ipt != null) {
                this.inputs.push(ipt)

                ipt.addEventListener("focus", () => {
                    ipt.addEventListener(
                        "blur",
                        (event: MouseEvent) => {
                            const input =
                                event.currentTarget as HTMLInputElement
                            if (input != null) {
                                const value = input.value
                                const name = input.name as UpdateBookmarkProp

                                console.log("blur")

                                this.dispatchBookmarkUpdate(
                                    this.currentBookmarkId,
                                    name,
                                    value
                                )
                            }
                        },
                        { once: true }
                    )
                })
            }

            inputFragment.appendChild(container)
        })

        this.form.appendChild(inputFragment)

        this.setHeight()
    }

    close(): void {
        this.clearInputs()
        if (this.wrapper.contains(this.icon)) {
            this.wrapper.removeChild(this.icon)
        }
        this.setHeight()
    }

    private clearInputs(): void {
        // clear component input list
        this.inputs.length = 0
        // clear DOM inputs
        while (this.form.firstChild != null) {
            this.form.removeChild(this.form.firstChild)
        }
    }

    setHeight(): void {
        const formHeight = this.form.offsetHeight
        this.container.style.height = `${formHeight}px`
    }

    async setIcon(type: string, icon?: string, color?: string): Promise<void> {
        console.log("set Icon", type, icon, color)

        if (!this.wrapper.contains(this.icon)) this.wrapper.prepend(this.icon)

        if (type === "folder") {
            if (icon != null) {
                this.updateIconFolder(icon, color)
            }
        } else if (type === "bookmark") {
            void this.updateIconBookmark(icon)
        }
    }

    updateIconFolder(icon: string, color = "#000"): void {
        this.icon.src = ""
        this.icon.style.backgroundColor = color
        this.icon.style.mask =
            this.icon.style.mask = `url("../resources/svg/${icon}.svg") center no-repeat`
        this.icon.addEventListener("click", this.openIconPicker, false)
        this.icon.classList.add("pointer")
    }

    async updateIconBookmark(icon?: string): Promise<void> {
        this.icon.removeEventListener("click", this.openIconPicker, false)
        this.icon.classList.remove("pointer")

        if (icon != null) {
            const fav = await DB.getFavicon(icon)
            if (fav != null) {
                this.icon.src = URL.createObjectURL(fav.blob)
            }
            this.icon.style.mask = ""
            this.icon.style.backgroundColor = ""
        } else {
            this.icon.src = ""
            this.icon.style.mask =
                "url('../resources/svg/bookmark-outline.svg') center no-repeat"
            this.icon.style.backgroundColor = "#000"
        }
    }

    openIconPicker(event: CustomEvent | MouseEvent): void {
        const input = event.target as HTMLInputElement
        if (input == null) return

        this.iconPicker.addEventListener(
            "icon-selected",
            (e: any) => {
                const { icon, color } = e.detail

                this.updateIconFolder(icon, color)
                void this.dispatchBookmarkUpdate(
                    this.currentBookmarkId,
                    "icon",
                    e.detail
                )
            },
            { once: true }
        )

        const { icon, color } = this.currentBookmark
        this.iconPicker.open(icon, color)
    }

    dispatchBookmarkUpdate(
        id: string,
        prop: UpdateBookmarkProp,
        value: UpdateBookmarkValues
    ): void {
        const customEvent = new CustomEvent("pb:bookmark-update", {
            detail: { id, prop, value }
        })

        this.dispatchEvent(customEvent)
    }
}

customElements.define("pb-footer", Footer)

export function createBookmarkForm(): FooterElement {
    const bookmarkForm = document.createElement("pb-footer") as FooterElement

    return bookmarkForm
}
