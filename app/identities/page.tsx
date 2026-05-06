import { IdentitiesTable } from "@/components/identities/identities-table"

export default function IdentitiesPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-balance">Identity Management</h1>
        <p className="text-muted-foreground mt-2 text-pretty">
          Manage client identities, risk profiles, and investment goals in one centralized location.
        </p>
      </div>
      <IdentitiesTable />
    </div>
  )
}
