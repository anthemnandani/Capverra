const stats = [
  { label: "Jurisdictions Served", value: "40+" },
  { label: "Tax Scenarios Modelled", value: "10,000+" },
  { label: "Active Tax Savings per Client", value: "$182k" },
  { label: "Compliance Rules Tracked", value: "5,000+" },
]

export function Stats() {
  return (
    // <section className="border-y border-border/50 bg-muted py-12">
    <section className="border-y border-border/50 bg-background-soft py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="mt-2 font-serif text-3xl font-semibold text-primary lg:text-4xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
