export interface Template {
  id: string
  name: string
  content: string
  uploadedAt: string
}

export class TemplateStore {
  private static instance: TemplateStore
  private templates: Template[] = []
  private listeners: Array<(templates: Template[]) => void> = []

  private constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage()
    }
  }

  static getInstance(): TemplateStore {
    if (!TemplateStore.instance) {
      TemplateStore.instance = new TemplateStore()
    }
    return TemplateStore.instance
  }

  private loadFromStorage() {
    const stored = localStorage.getItem("citrus-templates")
    if (stored) {
      this.templates = JSON.parse(stored)
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem("citrus-templates", JSON.stringify(this.templates))
    }
  }

  addTemplate(name: string, content: string): Template {
    const template: Template = {
      id: Date.now().toString(),
      name,
      content,
      uploadedAt: new Date().toISOString(),
    }

    this.templates.push(template)
    this.saveToStorage()
    this.notifyListeners()
    return template
  }

  getTemplates(): Template[] {
    return [...this.templates]
  }

  getTemplate(id: string): Template | undefined {
    return this.templates.find((t) => t.id === id)
  }

  deleteTemplate(id: string) {
    this.templates = this.templates.filter((t) => t.id !== id)
    this.saveToStorage()
    this.notifyListeners()
  }

  subscribe(listener: (templates: Template[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.templates))
  }
}
