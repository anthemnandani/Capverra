export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    stripePriceId: null,
    reportLimit: 1,
    identityLimit: 2,
    jurisdictionLimit: 1,
    description: "Get started with basic optimization",
  },
  start: {
    id: "start",
    name: "Start",
    price: 49,
    stripePriceId: process.env.STRIPE_PRICE_START!,
    reportLimit: 2,
    identityLimit: 2,
    jurisdictionLimit: 1,
    description: "Essential tax optimization tools",
  },
  launch: {
    id: "launch",
    name: "Launch",
    price: 59,
    stripePriceId: process.env.STRIPE_PRICE_LAUNCH!,
    reportLimit: 5,
    identityLimit: 3,
    jurisdictionLimit: 2,
    description: "Advanced multi-identity analysis",
  },
  grow: {
    id: "grow",
    name: "Grow",
    price: 245,
    stripePriceId: process.env.STRIPE_PRICE_GROW!,
    reportLimit: 20,
    identityLimit: 4,
    jurisdictionLimit: 3,
    description: "Scale your tax optimization strategy",
  },
  dominate: {
    id: "dominate",
    name: "Dominate",
    price: 882,
    stripePriceId: process.env.STRIPE_PRICE_DOMINATE!,
    reportLimit: 50,
    identityLimit: 4,
    jurisdictionLimit: 4,
    description: "Full-spectrum global tax optimization",
  },
} as const

export type PlanId = keyof typeof PLANS

export type Plan = (typeof PLANS)[PlanId]

export function getPlan(planId: string | null | undefined): Plan {
  if (!planId) return PLANS.free
  return PLANS[planId as PlanId] ?? PLANS.free
}

export function getPaidPlans(): Plan[] {
  return [PLANS.start, PLANS.launch, PLANS.grow, PLANS.dominate]
}