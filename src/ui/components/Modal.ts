import logger from "../../utils/logger"
// @ts-expect-error
import cssText from "bundle-text:./Modal.css"

export interface ModalElement extends HTMLElement {
    open: (...args: any) => void
    close: () => void
    setTitle: (title: string) => void
    body: HTMLDivElement
}

export class Modal extends HTMLElement {
    private readonly wrapper: HTMLDivElement
    private readonly modal: HTMLDivElement
    protected header: HTMLDivElement
    protected modalTitle: HTMLParagraphElement
    private readonly closeBtn: HTMLImageElement
    protected shadow: ShadowRoot
    protected body: HTMLDivElement

    constructor() {
        super()

        this.shadow = this.attachShadow({ mode: "open" })

        // div full page qui contient la modal
        this.wrapper = document.createElement("div")
        this.wrapper.setAttribute("class", "modal-wrapper")

        // la modal à proprement parler
        this.modal = document.createElement("div")
        this.modal.setAttribute("class", "modal")

        // en-tête de la modal
        this.header = document.createElement("div")
        this.header.setAttribute("class", "modal-header")
        this.header.style.display = "flex"
        this.header.style.justifyContent = "space-between"
        this.header.style.alignItems = "center"
        this.header.style.margin = "0 8px 0 4px"

        // titre de la modal
        this.modalTitle = document.createElement("p")
        const title = this.getAttribute("modal-title")
        this.modalTitle.textContent = title

        // croix pour fermer la modal
        this.closeBtn = document.createElement("img")
        this.closeBtn.src = "../resources/svg/close.svg"
        this.closeBtn.classList.add("btn")
        this.closeBtn.style.height = "1.2rem"
        this.closeBtn.style.width = "1.2rem"
        this.closeBtn.addEventListener("click", () => this.close())

        // le corps de la modal
        this.body = document.createElement("div")
        this.body.setAttribute("class", "modal-body")

        // les styles du composant
        const style = document.createElement("style")

        style.textContent = cssText

        this.shadow.appendChild(style)
        this.shadow.appendChild(this.wrapper)
        this.header.appendChild(this.modalTitle)
        this.header.appendChild(this.closeBtn)
        this.modal.append(this.header, this.body)
        this.wrapper.appendChild(this.modal)

        // bind functions
        this.listenToClickOutside = this.listenToClickOutside.bind(this)
    }

    append(...nodes: Array<string | Node>): void {
        this.body.append(...nodes)
    }

    appendChild<T extends Node>(node: T): T {
        return this.body.appendChild(node)
    }

    listenToClickOutside(event): void {
        const target = event.target

        if (target != null && target === this.wrapper) {
            this.close()
            this.wrapper.removeEventListener("click", this.listenToClickOutside)
        }
    }

    public open(...args: any): void {
        logger.debug("Open modal")
        this.wrapper.classList.add("modal-open")

        this.wrapper.addEventListener("click", this.listenToClickOutside)
    }

    public close(): void {
        // TODO : ATTENTION ca ne fait que masquer la modal, pour l'instant à
        // chque `createModal` une nouvelle fenetre est ajoutée au DOM
        logger.debug("Close modal")
        this.wrapper.classList.remove("modal-open")
    }

    setTitle(title: string): void {
        this.modalTitle.textContent = title
    }
}

customElements.define("pb-modal", Modal)

export function createModal(): ModalElement {
    return document.createElement("pb-modal") as ModalElement
}
