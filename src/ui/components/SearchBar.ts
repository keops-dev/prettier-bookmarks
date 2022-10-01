// @ts-expect-error
import cssText from "bundle-text:./SearchBar.css"

export interface SearchBarElement extends HTMLElement {
    open: () => void
    close: () => void
    setTitle: (title: string) => void
    body: HTMLDivElement
}

export class SearchBar extends HTMLElement {
    shadow: ShadowRoot
    container: HTMLDivElement
    icon: HTMLImageElement
    input: HTMLInputElement
    value: string

    constructor() {
        super()

        this.shadow = this.attachShadow({ mode: "open" })

        this.container = document.createElement("div")
        this.icon = document.createElement("img")
        this.input = document.createElement("input")

        this.container.classList.add("container")

        this.icon.style.mask =
            "url('../resources/svg/magnify.svg') center no-repeat"
        this.icon.style.backgroundColor = "#334155"
        this.icon.classList.add("icon")

        this.input.placeholder = "Rechercher dans les marque-pages"

        // les styles du composant
        const style = document.createElement("style")
        style.textContent = cssText

        this.container.appendChild(this.icon)
        this.container.appendChild(this.input)
        this.shadow.appendChild(style)
        this.shadow.appendChild(this.container)

        this.input.addEventListener(
            "input",
            this.handleInputChange.bind(this),
            false
        )
    }

    handleInputChange(event: InputEvent): void {
        const target = event.currentTarget

        if (target != null && target instanceof HTMLInputElement) {
            const value = target.value

            this.value = value
        }
    }
}

customElements.define("search-bar", SearchBar)

export function createSearchBar(id: string): SearchBarElement {
    const searchBar = document.createElement("search-bar") as SearchBarElement
    if (id != null) {
        searchBar.id = id
    }
    return searchBar
}
