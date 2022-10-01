import { PrettierManager } from "./PrettierManager"

// démarre et rend accessible PrettierManager depuis les éléments d'ui
// via la méthode getWindow()
const prettierManager = new PrettierManager()
Object.assign(window, { PrettierManager: prettierManager })

prettierManager.start()

// connect bookmarks listeners to Prettier Manager
browser.bookmarks.onCreated.addListener(prettierManager.handleCreated)
browser.bookmarks.onChanged.addListener(prettierManager.handleChanged)
browser.bookmarks.onRemoved.addListener(prettierManager.handleRemoved)
browser.bookmarks.onMoved.addListener(prettierManager.handleMoved)
