"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Identity } from "@/lib/types"
import { AddIdentityDialog } from "./add-identity-dialog"

export function IdentitiesTable() {
  const [identities, setIdentities] = useState<Identity[]>([])
  const [loading, setLoading] = useState(true)

  const loadIdentities = async () => {
    const response = await fetch("/api/identities", { cache: "no-store" })
    if (!response.ok) {
      throw new Error("Failed to fetch identities")
    }

    const data = await response.json()
    setIdentities(data)
  }

  useEffect(() => {
    loadIdentities()
      .catch((error) => console.error("Failed to load identities:", error))
      .finally(() => setLoading(false))
  }, [])

  const handleIdentityAdded = async (newIdentity: Omit<Identity, "id" | "created_at" | "updated_at">) => {
    const response = await fetch("/api/identities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newIdentity),
    })

    if (!response.ok) {
      throw new Error("Failed to create identity")
    }

    const identity = await response.json()
    setIdentities((current) => [identity, ...current])
  }

  const getRiskProfileColor = (profile: string) => {
    switch (profile) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "aggressive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "individual":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "entity":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "trust":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Identities</CardTitle>
          <AddIdentityDialog onIdentityAdded={handleIdentityAdded} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading identities...</p>
          </div>
        ) : null}

        {!loading && identities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No identities found</p>
            <AddIdentityDialog onIdentityAdded={handleIdentityAdded} />
          </div>
        ) : !loading ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identity Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Citizenship</TableHead>
                  <TableHead>Residency</TableHead>
                  <TableHead>Risk Profile</TableHead>
                  <TableHead>Goals</TableHead>
                  <TableHead>Additional Info</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {identities.map((identity) => (
                  <TableRow key={identity.id}>
                    <TableCell className="font-medium">{identity.name}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(identity.type)}>{identity.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {identity.citizenship.map((country) => (
                          <Badge key={country} variant="outline" className="text-xs">
                            {country}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{identity.residency || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getRiskProfileColor(identity.risk_profile)}>{identity.risk_profile}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {identity.goals.slice(0, 2).map((goal) => (
                          <Badge key={goal} variant="secondary" className="text-xs">
                            {goal}
                          </Badge>
                        ))}
                        {identity.goals.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{identity.goals.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-sm text-muted-foreground">
                        {identity.additional_information || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-sm text-muted-foreground">{identity.notes || "-"}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
