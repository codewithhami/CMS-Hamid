'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Factory {
  id: string
  name: string
  is_default: boolean
}

interface FactoryContextType {
  factories: Factory[]
  activeFactory: Factory | null
  setActiveFactory: (factory: Factory | null) => void
  refreshFactories: () => Promise<void>
  loading: boolean
}

const FactoryContext = createContext<FactoryContextType>({
  factories: [],
  activeFactory: null,
  setActiveFactory: () => {},
  refreshFactories: async () => {},
  loading: true
})

export function FactoryProvider({ children }: { children: React.ReactNode }) {
  const [factories, setFactories] = useState<Factory[]>([])
  const [activeFactory, setActiveFactoryState] = useState<Factory | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  async function loadFactories() {
    const { data, error } = await supabase.from('factories').select('*').order('created_at', { ascending: true })
    
    if (!error && data) {
      setFactories(data)
      
      const savedId = localStorage.getItem('activeFactoryId')
      if (savedId) {
        const savedFactory = data.find((f: Factory) => f.id === savedId)
        if (savedFactory) {
          setActiveFactoryState(savedFactory)
        } else {
          const def = data.find((f: Factory) => f.is_default) || data[0]
          setActiveFactoryState(def || null)
        }
      } else {
        const def = data.find((f: Factory) => f.is_default) || data[0]
        setActiveFactoryState(def || null)
      }
    }
  }

  useEffect(() => {
    loadFactories().finally(() => setLoading(false))
  }, [])

  const setActiveFactory = (factory: Factory | null) => {
    setActiveFactoryState(factory)
    if (factory) {
      localStorage.setItem('activeFactoryId', factory.id)
    } else {
      localStorage.removeItem('activeFactoryId')
    }
  }

  return (
    <FactoryContext.Provider value={{ factories, activeFactory, setActiveFactory, refreshFactories: loadFactories, loading }}>
      {children}
    </FactoryContext.Provider>
  )
}

export const useFactory = () => useContext(FactoryContext)
