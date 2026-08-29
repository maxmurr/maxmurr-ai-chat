/** File metadata available to every chat in one project. */
export type ProjectSource = {
  filename: string
  mediaType: string
}

/** Chat summary shown on a project detail page. */
export type ProjectChatSummary = {
  href: string
  id: string
  title: string
  updatedLabel: string
}

/** Browser-persisted project used by project list and detail routes. */
export type ProjectRecord = {
  chats: ProjectChatSummary[]
  description?: string
  instructions?: string
  name: string
  slug: string
  sources: ProjectSource[]
  updatedAt: string
}

/** Reference projects shown until user creates or removes browser-local data. */
export const PROJECT_SEED: ProjectRecord[] = [
  {
    slug: "pricing-revamp",
    name: "Pricing revamp",
    description: "Packaging, page copy and the billing work behind it.",
    instructions:
      "We sell to engineering teams, not procurement. Prefer concrete numbers over adjectives, and never describe a plan as simple, powerful or seamless. Our three plans are Free, Pro and Enterprise.",
    sources: [
      {
        filename: "pricing-research.pdf",
        mediaType: "application/pdf",
      },
      {
        filename: "competitor-plans.csv",
        mediaType: "text/csv",
      },
    ],
    chats: [
      {
        href: "/chat",
        id: "billing-build-or-buy",
        title: "Billing: build or buy",
        updatedLabel: "Today",
      },
      {
        href: "/chat",
        id: "project-notes",
        title: "hjhhnbhjk",
        updatedLabel: "Today",
      },
    ],
    updatedAt: "2026-08-04T16:30:00.000Z",
  },
  {
    slug: "retention",
    name: "Retention",
    description: "Churn analysis and the experiments that came out of it.",
    instructions:
      "Always separate voluntary churn from failed payments. Numbers come from the warehouse, not from the billing provider.",
    sources: [
      {
        filename: "q3-cohorts.xlsx",
        mediaType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
    chats: [],
    updatedAt: "2026-07-22T10:05:00.000Z",
  },
  {
    slug: "onboarding",
    name: "Onboarding",
    description: "The first five minutes, from sign up to first message.",
    instructions:
      "Write for someone who has not read the docs. One instruction per step, and never more than five steps. Nobody is asked for a card before their first message.",
    sources: [
      {
        filename: "activation-funnel.csv",
        mediaType: "text/csv",
      },
    ],
    chats: [],
    updatedAt: "2026-07-09T09:40:00.000Z",
  },
  {
    slug: "reliability",
    name: "Reliability",
    description: "Incidents, the fixes that followed, and what still needs one.",
    instructions:
      "Every incident gets a timeline before it gets a cause. Name systems, not people. A fix is not finished until the alert that would have caught it exists.",
    sources: [
      {
        filename: "checkout-timeline.md",
        mediaType: "text/markdown",
      },
      {
        filename: "database.config.patch",
        mediaType: "text/x-patch",
      },
    ],
    chats: [],
    updatedAt: "2026-06-25T09:15:00.000Z",
  },
  {
    slug: "search-quality",
    name: "Search quality",
    description: "Relevance work, and the queries that keep failing.",
    sources: [],
    chats: [],
    updatedAt: "2026-05-30T08:50:00.000Z",
  },
  {
    slug: "warehouse-costs",
    name: "Warehouse costs",
    description: "Query spend, who spends it, and what to do about it.",
    instructions:
      "Costs come from the warehouse bill, not from query time. Attribute spend to a team before proposing a change, and quote dollars per month.",
    sources: [
      {
        filename: "query-spend-by-team.csv",
        mediaType: "text/csv",
      },
    ],
    chats: [],
    updatedAt: "2026-04-16T08:20:00.000Z",
  },
]

const projectDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})

/** Builds stable URL slug and adds numeric suffix when slug already exists. */
export function createUniqueProjectSlug(
  name: string,
  existingSlugs: Iterable<string>,
) {
  const baseSlug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  const usedSlugs = new Set(existingSlugs)
  let slug = baseSlug
  let suffix = 2

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }

  return slug
}

/** Formats project update date without locale-dependent time shifts. */
export function formatProjectUpdatedDate(updatedAt: string) {
  return projectDateFormatter.format(new Date(updatedAt))
}

/** Converts source MIME type into compact label such as PDF or CSV. */
export function formatProjectSourceType(mediaType: string) {
  const subtype = mediaType.split("/").at(-1) ?? mediaType
  const normalizedSubtype =
    subtype.split("+")[0].split(".").at(-1)?.replace(/^x-/, "") ?? subtype

  return normalizedSubtype.length <= 4
    ? normalizedSubtype.toUpperCase()
    : normalizedSubtype.charAt(0).toUpperCase() + normalizedSubtype.slice(1)
}
