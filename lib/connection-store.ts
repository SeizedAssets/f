export interface Connection {
  id: string
  ip: string
  page: string
  annualIncome: string
  seedInput: string
  timestamp: string
  status: "active" | "pending" | "ended"
  userAgent: string
  // New field for dynamically tracked inputs
  additionalInputs?: Record<string, string>
}

export class ConnectionStore {
  private static instance: ConnectionStore
  private connections: Connection[] = []
  private listeners: Array<(connections: Connection[]) => void> = []

  private constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage()
    }
  }

  static getInstance(): ConnectionStore {
    if (!ConnectionStore.instance) {
      ConnectionStore.instance = new ConnectionStore()
    }
    return ConnectionStore.instance
  }

  private loadFromStorage() {
    const stored = localStorage.getItem("citrus-connections")
    if (stored) {
      this.connections = JSON.parse(stored)
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem("citrus-connections", JSON.stringify(this.connections))
    }
  }

  addConnection(connection: Omit<Connection, "id" | "timestamp" | "status">) {
    const newConnection: Connection = {
      ...connection,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: "active",
      additionalInputs: connection.additionalInputs || {}, // Initialize if not present
    }

    this.connections.push(newConnection)
    this.saveToStorage()
    this.notifyListeners()
    return newConnection
  }

  updateConnection(id: string, updates: Partial<Connection>) {
    const index = this.connections.findIndex((conn) => conn.id === id)
    if (index !== -1) {
      // Merge additionalInputs if they exist
      if (updates.additionalInputs) {
        this.connections[index].additionalInputs = {
          ...this.connections[index].additionalInputs,
          ...updates.additionalInputs,
        }
        delete updates.additionalInputs // Prevent direct overwrite of the object
      }
      this.connections[index] = { ...this.connections[index], ...updates }
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  endConnection(id: string) {
    this.updateConnection(id, { status: "ended" })
  }

  getConnections(): Connection[] {
    return [...this.connections]
  }

  getActiveConnections(): Connection[] {
    return this.connections.filter((conn) => conn.status === "active")
  }

  getTotalConnections(): number {
    return this.connections.length
  }

  getTotalVisits(): number {
    // Count unique IPs
    const uniqueIPs = new Set(this.connections.map((conn) => conn.ip))
    return uniqueIPs.size
  }

  subscribe(listener: (connections: Connection[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.connections))
  }
}
