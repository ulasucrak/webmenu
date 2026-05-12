'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export interface Branch {
  id: string
  name: string
  slug: string
  is_active: boolean
}

interface BranchContextValue {
  branches: Branch[]
  branchId: string | null
  branch: Branch | null
  setBranchId: (id: string) => void
}

const BranchContext = createContext<BranchContextValue>({
  branches: [],
  branchId: null,
  branch: null,
  setBranchId: () => {},
})

const PARAM = 'branch'
const STORAGE_KEY = 'admin_branch_id'

export function BranchProvider({
  children,
  branches,
}: {
  children: React.ReactNode
  branches: Branch[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [branchId, setBranchIdState] = useState<string | null>(null)

  const isValid = (id: string | null): id is string =>
    !!id && branches.some(b => b.id === id)

  useEffect(() => {
    const fromUrl = searchParams.get(PARAM)
    const fromStorage = localStorage.getItem(STORAGE_KEY)

    const resolved = isValid(fromUrl)
      ? fromUrl
      : isValid(fromStorage)
      ? fromStorage
      : (branches[0]?.id ?? null)

    setBranchIdState(resolved)

    // Sync URL if the param is missing or wrong
    if (resolved && resolved !== fromUrl) {
      const params = new URLSearchParams(searchParams.toString())
      params.set(PARAM, resolved)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  function setBranchId(id: string) {
    setBranchIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
    const params = new URLSearchParams(searchParams.toString())
    params.set(PARAM, id)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const branch = branches.find(b => b.id === branchId) ?? null

  return (
    <BranchContext.Provider value={{ branches, branchId, branch, setBranchId }}>
      {children}
    </BranchContext.Provider>
  )
}

export function useBranch() {
  return useContext(BranchContext)
}
