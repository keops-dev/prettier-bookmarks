import { ColorSectionElement, createColorSection } from "./ColorSection"
import { createIconSection, IconSectionElement } from "./IconSection"
import { createPreviewSection, PreviewSectionElement } from "./PreviewSection"

export interface IconPageElement extends HTMLDivElement {
    previewSection: PreviewSectionElement
    colorSection: HTMLElement
    iconSection: IconSectionElement
    setCategory: (category: string) => void
}

export class IconPage extends HTMLDivElement {
    private readonly shadow: ShadowRoot
    // -- sections
    public previewSection: PreviewSectionElement
    public colorSection: ColorSectionElement
    public iconSection: IconSectionElement
    public footer: HTMLElement

    submitBtn: HTMLButtonElement

    constructor() {
        super()

        // create sections
        this.previewSection = createPreviewSection()
        this.colorSection = createColorSection()
        this.iconSection = createIconSection()
        this.footer = document.createElement("div")

        this.submitBtn = document.createElement("button")
        this.submitBtn.classList.add("btn-submit")
        this.submitBtn.innerText = "Choisir cet icône"

        this.footer.classList.add("footer")
        this.footer.appendChild(this.submitBtn)

        this.append(
            this.previewSection,
            this.colorSection,
            this.iconSection,
            this.footer
        )

        // // events
        this.colorSection.addEventListener(
            "color-click",
            (event: CustomEvent) => {
                const { color } = event.detail
                this.previewSection.updateColor(color)
            }
        )

        this.iconSection.addEventListener(
            "icon-click",
            (event: CustomEvent) => {
                const { icon } = event.detail
                this.previewSection.updateIcon(icon)
            }
        )
    }

    setCategory(category: string): void {
        this.iconSection.setCategory(category)
    }
}

export function createIconPage(): IconPageElement {
    const iconPage = document.createElement("div", {
        is: "icon-page"
    }) as IconPageElement

    return iconPage
}

customElements.define("icon-page", IconPage, { extends: "div" })
