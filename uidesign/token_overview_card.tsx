import React, { useEffect, useState } from "react"

interface AssetOverviewPanelProps {
  assetId: string
}

interface AssetOverview {
  name: string
  priceUsd: number
  supply: number
  holders: number
  marketCapUsd?: number
  updatedAt?: string
}

export const AssetOverviewPanel: React.FC<AssetOverviewPanelProps> = ({ assetId }) => {
  const [info, setInfo] = useState<AssetOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    let active = true
    async function fetchInfo() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}`)
        if (!res.ok) throw new Error(`Failed to fetch asset info: ${res.status}`)
        const json = (await res.json()) as AssetOverview
        if (active) setInfo(json)
      } catch (err: any) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchInfo()
    return () => {
      active = false
    }
  }, [assetId])

  if (loading) return <div className="p-4">Loading asset overview...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  if (!info) return null

  return (
    <div className="p-4 bg-white rounded shadow space-y-1">
      <h2 className="text-xl font-semibold mb-2">Asset Overview</h2>
      <p><strong>ID:</strong> {assetId}</p>
      <p><strong>Name:</strong> {info.name}</p>
      <p><strong>Price (USD):</strong> ${info.priceUsd.toFixed(4)}</p>
      <p><strong>Circulating Supply:</strong> {info.supply.toLocaleString()}</p>
      <p><strong>Holders:</strong> {info.holders.toLocaleString()}</p>
      {info.marketCapUsd !== undefined && (
        <p><strong>Market Cap (USD):</strong> ${info.marketCapUsd.toLocaleString()}</p>
      )}
      {info.updatedAt && (
        <p className="text-sm text-gray-500"><em>Last updated: {new Date(info.updatedAt).toLocaleString()}</em></p>
      )}
    </div>
  )
}

export default AssetOverviewPanel
