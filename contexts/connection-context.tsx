"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type Connection, ConnectionStore } from "@/lib/connection-store"

interface ConnectionContextType {
  connections: Connection[]
  totalConnections: number
  totalVisits: number
  addConnection: (connection: Omit<Connection, "id" | "timestamp" | "status">) => void
  updateConnection: (id: string, updates: Partial<Connection>) => void
  endConnection: (id: string) => void
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined)

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [connections, setConnections] = useState<Connection[]>([])
  const store = ConnectionStore.getInstance()

  useEffect(() => {
    setConnections(store.getConnections())

    const unsubscribe = store.subscribe((newConnections) => {
      setConnections(newConnections)
    })

    // Listen for real-time connection updates
    const handleStorageChange = () => {
      setConnections(store.getConnections())
    }

    window.addEventListener("storage", handleStorageChange)

    const handleConnectionAdded = (event: Event) => {
      // Type assertion for CustomEvent
      const customEvent = event as CustomEvent
      if (customEvent.detail) {
        // Re-fetch all connections to ensure the store is in sync
        setConnections(store.getConnections())
      }
    }

    const handleConnectionUpdated = (event: Event) => {
      // Type assertion for CustomEvent
      const customEvent = event as CustomEvent
      if (customEvent.detail) {
        // Re-fetch all connections to ensure the store is in sync
        setConnections(store.getConnections())
      }
    }

    window.addEventListener("citrus-connection-added", handleConnectionAdded)
    window.addEventListener("citrus-connection-updated", handleConnectionUpdated)

    // Auto-refresh every 2 seconds
    const interval = setInterval(() => {
      setConnections(store.getConnections())
    }, 2000)

    return () => {
      unsubscribe()
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("citrus-connection-added", handleConnectionAdded)
      window.removeEventListener("citrus-connection-updated", handleConnectionUpdated)
      clearInterval(interval)
    }
  }, [store])

  const addConnection = (connection: Omit<Connection, "id" | "timestamp" | "status">) => {
    store.addConnection(connection)
  }

  const updateConnection = (id: string, updates: Partial<Connection>) => {
    store.updateConnection(id, updates)
  }

  const endConnection = (id: string) => {
    store.endConnection(id)
  }

  return (
    <ConnectionContext.Provider
      value={{
        connections,
        totalConnections: store.getTotalConnections(),
        totalVisits: store.getTotalVisits(),
        addConnection,
        updateConnection,
        endConnection,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnections() {
  const context = useContext(ConnectionContext)
  if (context === undefined) {
    throw new Error("useConnections must be used within a ConnectionProvider")
  }
  return context
}
