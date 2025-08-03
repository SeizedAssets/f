export interface PageContent {
  id: string
  content: string
  updatedAt: string
  isActive: boolean
}

export class PageContentStore {
  private static instance: PageContentStore
  private currentContent: PageContent | null = null
  private listeners: Array<(content: PageContent | null) => void> = []

  private constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage()
    }
  }

  static getInstance(): PageContentStore {
    if (!PageContentStore.instance) {
      PageContentStore.instance = new PageContentStore()
    }
    return PageContentStore.instance
  }

  private loadFromStorage() {
    const stored = localStorage.getItem("citrus-page-content")
    if (stored) {
      this.currentContent = JSON.parse(stored)
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      if (this.currentContent) {
        localStorage.setItem("citrus-page-content", JSON.stringify(this.currentContent))
      } else {
        localStorage.removeItem("citrus-page-content")
      }
    }
  }

  updatePageContent(content: string) {
    this.currentContent = {
      id: Date.now().toString(),
      content,
      updatedAt: new Date().toISOString(),
      isActive: true,
    }

    this.saveToStorage()
    this.notifyListeners()
    this.broadcastUpdate()
  }

  getCurrentContent(): PageContent | null {
    return this.currentContent
  }

  clearContent() {
    this.currentContent = null
    this.saveToStorage()
    this.notifyListeners()
    this.broadcastUpdate()
  }

  private broadcastUpdate() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("citrus-page-updates")
      channel.postMessage({
        type: "PAGE_UPDATED",
        content: this.currentContent,
        timestamp: Date.now(),
      })
    }
  }

  subscribe(listener: (content: PageContent | null) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentContent))
  }
}
