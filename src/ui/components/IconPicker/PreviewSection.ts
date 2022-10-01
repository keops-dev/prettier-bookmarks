import { Section } from "./Section"

export interface PreviewSectionElement extends Section {
    updateColor: (color: string) => void
    updateIcon: (icon: string) => void
}

const DEFAULT_FOLDER_MASK =
    "url(../../resources/svg/folder-outline.svg) no-repeat center"

class PreviewSection extends Section {
    previewIcon: HTMLImageElement

    constructor() {
        const self = super()

        console.log("self", self, this)

        this.header = "Prévisualisation"

        this.previewIcon = document.createElement("img")
        this.previewIcon.classList.add("icon-preview")
        this.previewIcon.style.backgroundColor = "gray"
        this.previewIcon.style.mask = DEFAULT_FOLDER_MASK

        this.append(this.previewIcon)
    }

    updateColor(color: string): void {
        console.log("update color", color)

        this.previewIcon.style.backgroundColor = color
    }

    updateIcon(icon: string): void {
        this.previewIcon.style.mask = `url(../../resources/svg/${icon}.svg) no-repeat center`
    }
}

export function createPreviewSection(): PreviewSectionElement {
    const section = document.createElement("div", {
        is: "preview-section"
    }) as PreviewSectionElement
    return section
}

customElements.define("preview-section", PreviewSection, { extends: "div" })
