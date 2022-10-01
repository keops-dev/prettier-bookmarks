// @ts-expect-error
import cssText from "bundle-text:./Dropdown.css"

export interface DropdownElement extends HTMLElement {}

export class Dropdown extends HTMLElement {
    shadow: ShadowRoot
    template: HTMLTemplateElement
    buttonSlot: HTMLSlotElement
    button: HTMLElement
    dropdownSlot: HTMLSlotElement
    dropdown: HTMLElement
    container: HTMLDivElement
    content: HTMLSlotElement

    position: string

    constructor() {
        super()

        this.template = document.createElement("template")
        this.template.innerHTML = `
        <style>
            :host {
                display: block;
                position: relative;
            }         

            #container {
                position: absolute;
                top: 100%;
                right: 0;
                display: none;
                background-color: #fff;
                padding: 0.25rem;
                border-radius: 0.5rem;
                font-size: 0.8rem;
                overflow: hidden;
                white-space: nowrap;
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
            }
        </style>

        <slot name="button" id="button">Dropdown button</slot>
        <div id="container">
            <slot name="dropdown" id="dropdown">
                Dropdown content
            </slot>
        </div>
        `

        const style = document.createElement("style")
        style.innerText = cssText
        this.appendChild(style)

        this.shadow = this.attachShadow({ mode: "open" })
        this.shadow.appendChild(this.template.content.cloneNode(true))

        this.buttonSlot = this.shadow.getElementById(
            "button"
        ) as HTMLSlotElement
        this.button = this.buttonSlot.assignedElements()[0] as HTMLElement

        this.container = this.shadow.getElementById(
            "container"
        ) as HTMLDivElement

        this.dropdownSlot = this.shadow.getElementById(
            "dropdown"
        ) as HTMLSlotElement
        this.dropdown = this.dropdownSlot.assignedElements()[0] as HTMLElement

        this.buttonSlot.addEventListener(
            "click",
            this.onClick.bind(this),
            false
        )
    }

    onClick(event: MouseEvent): void {
        event.stopImmediatePropagation()

        this.container.style.display = "block"
        this.container.animate(
            [
                { maxHeight: "0px" },
                { maxHeight: `${this.dropdown.clientHeight}px` }
            ],
            {
                duration: 100,
                fill: "forwards"
            }
        )

        document.addEventListener(
            "click",
            this.handleClickOut.bind(this),
            false
        )
    }

    handleClickOut(event: MouseEvent): void {
        const target = event.target as HTMLElement

        if (
            target != null &&
            target !== this.dropdown &&
            !this.dropdown.contains(target)
        ) {
            const anim = this.container.animate(
                [
                    { maxHeight: `${this.dropdown.clientHeight}px` },
                    { maxHeight: "0px" }
                ],
                {
                    duration: 100,
                    fill: "forwards"
                }
            )
            anim.finished
                .then(() => {
                    this.container.style.display = "none"
                })
                .catch((error) => console.error(error))
        }
    }
}

customElements.define("pb-dropdown", Dropdown)

export function createDropdown(id: string): DropdownElement {
    const dropdown = document.createElement("pb-dropdown") as DropdownElement

    return dropdown
}
