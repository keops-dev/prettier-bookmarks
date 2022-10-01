import { BookmarkTreeNodeExtended } from "../types";

export function createLeftPanelFolder(bookmark) {
    let li = document.createElement("li");
    let div = document.createElement("div");
    let span = document.createElement("span");
    let img = document.createElement("img");
    let ul: HTMLUListElement | null = null;

    const title = bookmark.title;
    const icon = bookmark.icon;
    const children = bookmark.children;
    const hasChild = children?.some((child) => child.type === "folder");

    span.textContent = title;
    span.classList.add("text-gray-900", "select-none", "px-1");

    img.src = `../resources/svg/${icon}.svg`;
    img.classList.add("w-4", "h-4", "inline");

    // li.classList.add("flex");

    div.classList.add("rounded", "hover:bg-slate-200", "py", "px-2");
    div.append(img);
    div.append(span);

    li.append(div);

    if (hasChild) {
        ul = document.createElement("ul");
        ul.classList.add(
            "hidden",
            "ml-2",
            "pl-2",
            "border-l",
            "border-dotted",
            "border-gray-900"
        );

        div.classList.add("caret");

        li.append(ul);

        div.addEventListener("click", (event) => {
            const folder = event.target;
            if (folder) {
                div.classList.toggle("caret-down");
                ul?.classList.toggle("hidden");
            }
        });
    } else {
        div.classList.add("px-5");
    }

    return { li, div, ul };
}
