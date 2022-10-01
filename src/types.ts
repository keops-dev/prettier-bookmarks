import { PrettierManager } from "./PrettierManager"

export type CreateCreateData = browser.windows._CreateCreateData
export type BookmarkTreeNodeType = browser.bookmarks.BookmarkTreeNodeType
export type BookmarkTreeNode = browser.bookmarks.BookmarkTreeNode
export type OnChangedChangeInfo = browser.bookmarks._OnChangedChangeInfo
export type OnRemovedRemoveInfo = browser.bookmarks._OnRemovedRemoveInfo
export type OnMovedMoveInfo = browser.bookmarks._OnMovedMoveInfo

export type BackgroundWindow = Window & { PrettierManager?: PrettierManager }

export interface BookmarkTreeNodeExtended
    extends browser.bookmarks.BookmarkTreeNode {
    icon?: string
    color?: string
}

export interface PrettierManagerI {
    start: () => void
    getById: (id: string) => BookmarkTreeNodeExtended
    getBookmarks: () => BookmarkTreeNodeExtended
    handleCreated: (id: string, bookmark: BookmarkTreeNode) => void
    handleRemoved: (id: string, removeInfo: OnRemovedRemoveInfo) => void
    handleChanged: (id: string, changeInfo: OnChangedChangeInfo) => void
    handleMoved: (id: string, moveInfo: OnMovedMoveInfo) => void
    updateBookmark: (
        id: string,
        prop: string,
        value: IconColorInterface | string
    ) => Promise<void>
}

export interface IconColorInterface {
    icon: string
    color: string
}

export interface CreateDetailsExtended extends browser.bookmarks.CreateDetails {
    id: string
    title: string
    icon?: string | undefined
    color?: string | undefined
}

export interface UpdateDetailsExtended {
    id: string
    changes: UpdateDetailsExtendedChange
}

export interface UpdateDetailsExtendedChange {
    title?: string | undefined
    url?: string | undefined
    icon?: string | undefined
    color?: string | undefined
}

export type UpdateBookmarkProp = "title" | "url" | "icon"
export interface UpdateBookmarkValuesIcon {
    icon: string
    color: string
}
export type UpdateBookmarkValues = string | UpdateBookmarkValuesIcon
