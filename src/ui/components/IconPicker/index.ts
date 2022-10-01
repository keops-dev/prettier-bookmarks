import { Modal, ModalElement } from "../Modal"
// @ts-expect-error
import styleCSS from "bundle-text:./IconPicker.css"
// @ts-expect-error
import pickerStyleCSS from "bundle-text:vanilla-picker/dist/vanilla-picker.csp.css"
import { createPreviewSection, PreviewSectionElement } from "./PreviewSection"
import { ColorSectionElement, createColorSection } from "./ColorSection"
import { createIconSection, IconSectionElement } from "./IconSection"

export interface IconPickerElement extends ModalElement {
    backBtn: HTMLImageElement
    hideIcons: () => void
    open: (icon: string, color: string) => void
}

class IconPicker extends Modal {
    // sections
    public previewSection: PreviewSectionElement
    public colorSection: ColorSectionElement
    public iconSection: IconSectionElement
    public footer: HTMLElement

    selectedIcon: string
    selectedColor: string

    submitBtn: HTMLButtonElement

    constructor() {
        super()

        // title
        this.setTitle("Sélectionnez un icône")

        // style
        const style = document.createElement("style")
        const pickerStyle = document.createElement("style")
        style.textContent = styleCSS
        pickerStyle.textContent = pickerStyleCSS
        this.shadow.append(pickerStyle, style)

        // data
        this.selectedColor = "#000"
        this.selectedIcon = "folder-outline"

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

        // append then to the IconPicker
        this.append(
            this.previewSection,
            this.colorSection,
            this.iconSection,
            this.footer
        )

        // events
        this.colorSection.addEventListener(
            "color-click",
            (event: CustomEvent) => {
                const { color } = event.detail

                this.selectedColor = color
                this.previewSection.updateColor(color)
            }
        )

        this.iconSection.addEventListener(
            "icon-click",
            (event: CustomEvent) => {
                const { icon } = event.detail

                this.selectedIcon = icon
                this.previewSection.updateIcon(icon)
            }
        )

        this.submitBtn.addEventListener("click", () => {
            this.close()

            console.log(
                "Icon Picker submit",
                this.selectedIcon,
                this.selectedColor
            )

            this.dispatchEvent(
                new CustomEvent("icon-selected", {
                    detail: {
                        icon: this.selectedIcon,
                        color: this.selectedColor
                    }
                })
            )
        })
    }

    public open(icon: string, color: string): void {
        super.open()

        this.selectedIcon = icon
        this.selectedColor = color
        this.previewSection.updateIcon(icon)
        this.previewSection.updateColor(color)
        this.iconSection.setByIcon(icon)
    }
}

export function createIconPicker(): IconPickerElement {
    const iconPicker = document.createElement(
        "pb-icon-picker"
    ) as IconPickerElement
    iconPicker.setAttribute("id", "icon-picker")

    return iconPicker
}

customElements.define("pb-icon-picker", IconPicker)
