export class PlatformFetchError extends Error {
  status: number
  info: any

  constructor(message: string, status: number, info: any) {
    super(message)
    this.name = 'PlatformFetchError'
    this.status = status
    this.info = info
  }
}

import { API_URL, getToken } from "./config"

export async function platformJsonFetcher(url: string): Promise<any> {
  const token = getToken()
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`
  const res = await fetch(fullUrl, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  let data: any = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed with status ${res.status}`
    throw new PlatformFetchError(message, res.status, data)
  }

  return data
}
