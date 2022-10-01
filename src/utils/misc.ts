import { openDB } from "idb"

const dbFaviconPromise = openDB("prettier-bookmarks-store", 1, {
    upgrade(db) {
        db.createObjectStore("favicon")
    }
})

interface FaviconGet {
    hash: ArrayBuffer
    blob: Blob
}

/**
 *
 * @param url string
 * @returns Object {hash, blob}
 */
async function getFavicon(url: string): Promise<FaviconGet | undefined> {
    return await (await dbFaviconPromise).get("favicon", url)
}
async function setFavicon(url: string, blob: Blob): Promise<any> {
    const hash = await getFaviconHash(blob)
    return await (await dbFaviconPromise).put("favicon", { hash, blob }, url)
}
async function delFavicon(url: string): Promise<any> {
    return await (await dbFaviconPromise).delete("favicon", url)
}
async function clearFavicon(): Promise<any> {
    return await (await dbFaviconPromise).clear("favicon")
}
async function getAllFavicon(): Promise<any> {
    return await (await dbFaviconPromise).getAll("favicon")
}
async function getAllFaviconKeys(): Promise<any> {
    return await (await dbFaviconPromise).getAllKeys("favicon")
}

export async function getFaviconHash(blob: Blob): Promise<ArrayBuffer> {
    const blobBuffer = await blob.arrayBuffer()

    const crypted = await crypto.subtle.digest("SHA-256", blobBuffer)
    return crypted
}

export function isSameHash(hash1: ArrayBuffer, hash2: ArrayBuffer): boolean {
    if (hash1.byteLength !== hash2.byteLength) return false

    // convert buffer to byte array
    const hashArray1 = Array.from(new Uint8Array(hash1))
    const hashArray2 = Array.from(new Uint8Array(hash2))
    // convert bytes to hex
    const hashHex1 = hashArray1
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    const hashHex2 = hashArray2
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")

    // console.log(hashHex1, hashHex2)

    return hashHex1 === hashHex2
}

export const DB = {
    getFavicon,
    setFavicon,
    delFavicon,
    clearFavicon: clearFavicon,
    getAllFavicon,
    getAllFaviconKeys
}

export function isHypertextProtocol(url: string): boolean {
    const [protocol] = url.split("/")

    if (!(protocol === "http:" || protocol === "https:")) {
        return false
    }

    return true
}

export function getBaseUrl(url: string): string {
    const [protocol, empty, baseUrl] = url.split("/")

    if (!isHypertextProtocol(url)) {
        throw new Error(
            "getBaseUrl() ne peut être utilisé qu'avec des liens http ou https"
        )
    }

    return [protocol, empty, baseUrl].join("/")
}

export function getFaviconUrl(url: string): string {
    return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=64`
}

export async function getFaviconBlob(
    iconUrl: string
): Promise<Blob | undefined> {
    try {
        const response = await fetch(iconUrl)

        const blob = await response.blob()
        return blob
    } catch (error) {
        console.error(error)
    }
}
