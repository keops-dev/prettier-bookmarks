import Picker from "vanilla-picker"

import { Section } from "./Section"

const colors = [
    "#000",
    "#6B7280",
    "#EF4444",
    "#EAB308",
    "#22C55E",
    "#0EA5E9",
    "#EC4899"
]

export interface ColorSectionElement extends Section {}

class ColorSection extends Section {
    colorList: HTMLUListElement
    customColorElement: HTMLLIElement
    customColorInput: Picker

    constructor() {
        super()

        this.header = "Couleur"

        this.colorList = document.createElement("ul")
        this.colorList.classList.add("color-list")

        const colorFragment = document.createDocumentFragment()

        for (const color of colors) {
            const colorElement = document.createElement("li")

            colorElement.style.backgroundColor = color
            colorElement.addEventListener("click", () => {
                console.log("icon click")
                const event = new CustomEvent("color-click", {
                    detail: { color }
                })

                this.dispatchEvent(event)
            })

            colorFragment.appendChild(colorElement)
        }

        // this.customColorInput = document.createElement("input")
        // this.customColorInput.type = "color"
        // this.customColorInput.classList.add("custom-color-input")

        this.customColorElement = document.createElement("li")
        this.customColorElement.classList.add("custom-color")

        // this.customColorElement.addEventListener("change", (event) => {
        //     const target = event.target

        //     if (target != null && target instanceof HTMLInputElement) {
        //         const color = target.value
        //         const event = new CustomEvent("color-click", {
        //             detail: { color }
        //         })

        //         this.dispatchEvent(event)
        //     }
        // })

        this.customColorInput = new Picker({
            parent: this.customColorElement,
            popup: "left",
            onDone: (color) => {
                const event = new CustomEvent("color-click", {
                    detail: { color: color.rgbaString }
                })

                this.dispatchEvent(event)
            }
        })

        // this.customColorElement.appendChild(this.customColorInput)

        this.colorList.append(colorFragment, this.customColorElement)

        this.append(this.colorList)
    }
}

export function createColorSection(): ColorSectionElement {
    const section = document.createElement("div", {
        is: "color-section"
    }) as ColorSectionElement
    return section
}

customElements.define("color-section", ColorSection, { extends: "div" })
