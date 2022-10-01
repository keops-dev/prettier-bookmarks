export interface SectionElement extends HTMLDivElement {}

export class Section extends HTMLDivElement {
    headerElement: HTMLDivElement
    headerText: HTMLHeadingElement

    constructor() {
        super()

        this.headerElement = document.createElement("div")
        this.headerText = document.createElement("h4")

        this.headerElement.append(this.headerText)

        this.headerElement.classList.add("section-header")
        this.classList.add("section")

        this.appendChild(this.headerElement)

        // this.shadow.appendChild(this.headerElement);
    }

    set header(title: string) {
        this.headerText.innerText = title
    }

    get header(): string {
        return this.headerText.innerText
    }

    addControls(controls: Node): void {
        this.headerElement.appendChild(controls)
    }
}

export function createSection(): SectionElement {
    const section = document.createElement("div", {
        is: "icon-picker-section"
    }) as SectionElement
    return section
}

customElements.define("icon-picker-section", Section, { extends: "div" })
