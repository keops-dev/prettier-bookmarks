export class Queue<ElementType> {
    elements: Object
    head: number
    tail: number

    constructor() {
        this.elements = {}
        this.head = 0
        this.tail = 0
    }

    enqueue(...elements: ElementType[]): void {
        if (elements != null) {
            for (const element of elements) {
                this.elements[this.tail] = element
                this.tail++
            }
        }
    }

    dequeue(): ElementType {
        const item = this.elements[this.head]
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this.elements[this.head]
        this.head++

        return item
    }

    peek(): ElementType {
        return this.elements[this.head]
    }

    get length(): number {
        return this.tail - this.head
    }

    get isEmpty(): boolean {
        return this.length === 0
    }
}
