import iconsMeta from "../../../resources/materialdesignicons_meta.json"
import iconCategories from "../../../resources/materialdesignicons_categories_meta.json"
import { Section } from "./Section"

export interface IconSectionElement extends Section {
    setCategory: (category: string) => void
    setByIcon: (icon: string) => void
}

class IconSection extends Section {
    private readonly iconsGrid: HTMLDivElement
    private readonly categorySelect: HTMLSelectElement

    constructor() {
        super()

        this.header = "Icône"

        this.classList.add("icons-section")

        this.iconsGrid = document.createElement("div")
        this.iconsGrid.classList.add("icons-grid")

        this.categorySelect = document.createElement("select")

        iconCategories.forEach((category) => {
            const option = document.createElement("option")
            option.value = category
            option.innerText = category

            this.categorySelect.options.add(option)
        })

        this.categorySelect.addEventListener(
            "change",
            this.handleCategorySelectChange.bind(this),
            false
        )

        this.addControls(this.categorySelect)

        this.append(this.iconsGrid)
        this.setCategory("Developer / Languages")
    }

    handleCategorySelectChange(event: MouseEvent): void {
        const target = event.currentTarget

        if (target != null && target instanceof HTMLSelectElement) {
            const category = target.value
            this.setCategory(category)
        }
    }

    setByIcon(icon: string): void {
        for (const category in iconsMeta) {
            for (const ico of iconsMeta[category]) {
                if (ico === icon) {
                    this.setCategory(category)
                    this.categorySelect.value = category
                }
            }
        }
    }

    setCategory(category: string): void {
        this.iconsGrid.scrollTo(0, 0)

        const fragment = document.createDocumentFragment()

        iconsMeta[category].forEach((icon: string) => {
            const cell = document.createElement("div")
            const img = document.createElement("img")

            img.classList.add("icon")
            img.src = `../resources/svg/${icon}.svg`

            cell.classList.add("icon-cell")

            cell.addEventListener("click", (event) => {
                this.dispatchEvent(
                    new CustomEvent("icon-click", { detail: { icon } })
                )
            })

            cell.appendChild(img)
            fragment.appendChild(cell)
        })

        this.clearGrid()
        this.iconsGrid.appendChild(fragment)
    }

    clearGrid(): void {
        if (this.iconsGrid.firstChild != null) {
            while (this.iconsGrid.firstChild != null) {
                this.iconsGrid.removeChild(this.iconsGrid.firstChild)
            }
        }
    }
}

export function createIconSection(): IconSectionElement {
    const section = document.createElement("div", {
        is: "icon-section"
    }) as IconSectionElement
    return section
}

customElements.define("icon-section", IconSection, { extends: "div" })
