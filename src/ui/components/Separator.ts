export interface SeparatorElement extends HTMLLIElement {
    bookmarkId: number
}

export class Separator extends HTMLLIElement {
    bookmarkId: number

    constructor() {
        super()

        // this.headerElement = document.createElement("div")
        // this.headerText = document.createElement("h4")

        // this.headerElement.append(this.headerText)

        // this.headerElement.classList.add("section-header")
        // this.classList.add("section")

        // this.appendChild(this.headerElement)
        this.classList.add("separator")
    }
}

export function createSeparator(id): SeparatorElement {
    const separator = document.createElement("li", {
        is: "pb-separator"
    }) as SeparatorElement

    separator.bookmarkId = id

    return separator
}

customElements.define("pb-separator", Separator, { extends: "li" })
