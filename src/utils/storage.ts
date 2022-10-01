/* global browser*/

import { BookmarkTreeNode, BookmarkTreeNodeExtended } from "../types";

export async function storageSetBookmarks(bookmarkList) {
    // console.log(store);
    await browser.storage.local.set({
        bookmarks: bookmarkList,
    });
}

export async function storageGetBookmarks() {
    const store = await browser.storage.local.get("bookmarks");
    return store.bookmarks;
}

async function storageSet(id: string, value: any): Promise<void> {
    try {
        await browser.storage.local.set({ [id]: value });
    } catch (error) {
        console.error(error);
    }
}

async function storageGet(id: string) {
    try {
        const res = await browser.storage.local.get(id);
        if (res) return res;
    } catch (error) {
        console.error(error);
    }
}

function setFolders(folders: BookmarkTreeNodeExtended[]) {
    storageSet("folders", folders);
}

async function getFolders() {
    const storage = await storageGet("folders");
    console.log(storage);
    if (storage) return storage["folders"];
}

async function addFolder(
    folder: browser.bookmarks.BookmarkTreeNode,
    index = 0
): Promise<void> {
    const storage = await browser.storage.local.get("folders");
    const folders = storage["folders"];
    console.log("folders", storage, folders);

    const newFolder = Object.assign(folder, { icon: undefined });

    folders.splice(index, 0, newFolder);

    console.log("FOLDERS ", folders, index);

    await storageSet("folders", folders);
}

function updateFolder(
    folders: BookmarkTreeNodeExtended[],
    folder: BookmarkTreeNodeExtended
): BookmarkTreeNodeExtended[] {
    const newFolders = folders.map((f) => (f.id === folder.id ? folder : f));

    storageSet("folders", newFolders);

    return newFolders;
}

function deleteFolder(folders, toDeleteFolder): BookmarkTreeNodeExtended[] {
    const newFolders = folders.filter(
        (folder) => folder.id !== toDeleteFolder.id
    );

    storageSet("folders", newFolders);

    return newFolders;
}

export default {
    addFolder,
    updateFolder,
    deleteFolder,
    setFolders,
};
