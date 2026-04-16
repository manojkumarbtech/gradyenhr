import { useState, useEffect } from "react"
import { masterDataApi } from "@/shared/lib/api"

interface MasterDataItem {
  id?: number
  value: string
  label: string
}

interface MasterData {
  employee_status: MasterDataItem[]
  user_roles: MasterDataItem[]
  asset_status: MasterDataItem[]
  asset_types: MasterDataItem[]
  asset_categories: MasterDataItem[]
  return_request_types: MasterDataItem[]
  job_status: MasterDataItem[]
  employment_types: MasterDataItem[]
  applicant_status: MasterDataItem[]
  leave_status: MasterDataItem[]
  leave_types: MasterDataItem[]
  intern_status: MasterDataItem[]
  holiday_types: MasterDataItem[]
  attendance_status: MasterDataItem[]
  training_types: MasterDataItem[]
  training_status: MasterDataItem[]
  timezones: MasterDataItem[]
  departments: { id: number; name: string }[]
}

const defaultData: MasterData = {
  employee_status: [],
  user_roles: [],
  asset_status: [],
  asset_types: [],
  asset_categories: [],
  return_request_types: [],
  job_status: [],
  employment_types: [],
  applicant_status: [],
  leave_status: [],
  leave_types: [],
  intern_status: [],
  holiday_types: [],
  attendance_status: [],
  training_types: [],
  training_status: [],
  timezones: [],
  departments: [],
}

let cachedData: MasterData | null = null
let fetchPromise: Promise<MasterData> | null = null

async function fetchMasterDataOnce(): Promise<MasterData> {
  if (cachedData) return cachedData
  if (fetchPromise) return fetchPromise
  
  fetchPromise = (async () => {
    try {
      const data = await masterDataApi.getAll() as MasterData
      cachedData = data
      return data
    } catch (e) {
      fetchPromise = null
      throw e
    }
  })()
  
  return fetchPromise
}

export function useMasterData() {
  const [data, setData] = useState<MasterData>(defaultData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMasterDataOnce()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { ...data, loading, refresh: () => { cachedData = null; fetchPromise = null } }
}

export function getMasterData(): MasterData | null {
  return cachedData
}

export async function getMasterDataCategory<K extends keyof MasterData>(category: K): Promise<MasterData[K]> {
  const data = await fetchMasterDataOnce()
  return data[category]
}