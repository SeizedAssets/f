export interface PageTemplate {
  id: string
  name: string
  content: string
  uploadedAt: string
  isActive: boolean
}

export class PageTemplateStore {
  private static instance: PageTemplateStore
  private templates: PageTemplate[] = []
  private activeTemplate: PageTemplate | null = null
  private listeners: Array<(template: PageTemplate | null) => void> = []

  private constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage()
    }
  }

  static getInstance(): PageTemplateStore {
    if (!PageTemplateStore.instance) {
      PageTemplateStore.instance = new PageTemplateStore()
    }
    return PageTemplateStore.instance
  }

  private loadFromStorage() {
    const stored = localStorage.getItem("citrus-page-templates")
    if (stored) {
      this.templates = JSON.parse(stored)
    }

    const activeStored = localStorage.getItem("citrus-active-template")
    if (activeStored) {
      this.activeTemplate = JSON.parse(activeStored)
    }

    if (!this.activeTemplate && this.templates.length > 0) {
      this.activeTemplate = this.templates[0]
      this.activeTemplate.isActive = true
      this.saveToStorage() // Save the newly activated template
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem("citrus-page-templates", JSON.stringify(this.templates))
      if (this.activeTemplate) {
        localStorage.setItem("citrus-active-template", JSON.stringify(this.activeTemplate))
      } else {
        localStorage.removeItem("citrus-active-template")
      }
    }
  }

  addTemplate(name: string, content: string): PageTemplate {
    const template: PageTemplate = {
      id: Date.now().toString(),
      name,
      content,
      uploadedAt: new Date().toISOString(),
      isActive: false,
    }

    this.templates.push(template)
    this.saveToStorage()
    return template
  }

  activateTemplate(templateId: string) {
    const template = this.templates.find((t) => t.id === templateId)
    if (template) {
      // Deactivate all templates
      this.templates.forEach((t) => (t.isActive = false))

      // Activate selected template
      template.isActive = true
      this.activeTemplate = template

      this.saveToStorage()
      this.notifyListeners()

      // Force page reload for all /thepage instances
      this.broadcastTemplateChange(template)
    }
  }

  deactivateTemplate() {
    this.templates.forEach((t) => (t.isActive = false))
    this.activeTemplate = null
    this.saveToStorage()
    this.notifyListeners()
  }

  getActiveTemplate(): PageTemplate | null {
    return this.activeTemplate
  }

  getTemplates(): PageTemplate[] {
    return [...this.templates]
  }

  deleteTemplate(id: string) {
    this.templates = this.templates.filter((t) => t.id !== id)
    if (this.activeTemplate?.id === id) {
      this.activeTemplate = null
    }
    this.saveToStorage()
    this.notifyListeners()
  }

  private broadcastTemplateChange(template: PageTemplate | null) {
    // Use BroadcastChannel to notify all tabs/windows
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("citrus-template-updates")
      channel.postMessage({
        type: "TEMPLATE_CHANGED",
        template: template,
        timestamp: Date.now(),
      })
    }
  }

  subscribe(listener: (template: PageTemplate | null) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.activeTemplate))
  }
}
