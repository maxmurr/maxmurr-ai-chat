/** Deterministic records used by instant-navigation production-build tests. */
export const INSTANT_NAVIGATION_FIXTURES = {
  activeUser: {
    email: "instant-nav-active@example.invalid",
    id: "instant-nav-active-user",
    name: "Instant Nav Active",
    username: "instant_nav_active",
  },
  chat: {
    id: "instant-nav-chat",
    publicToken: "instant-nav-public-chat",
    title: "Instant navigation fixture",
  },
  folder: {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Instant navigation folder",
  },
  invitation: {
    id: "instant-nav-invitation",
  },
  onboardingUser: {
    email: "instant-nav-onboarding@example.invalid",
    id: "instant-nav-onboarding-user",
    name: "Instant Nav Onboarding",
    username: "instant_nav_onboarding",
  },
  project: {
    slug: "pricing-revamp",
  },
  workspace: {
    id: "instant-nav-workspace",
    name: "Instant Navigation",
    slug: "instant-navigation-e2e",
  },
} as const

/** Ignored Playwright storage-state files generated before instant-navigation tests. */
export const INSTANT_NAVIGATION_STORAGE_STATES = {
  active: ".scratch/instant-nav/active-storage-state.json",
  onboarding: ".scratch/instant-nav/onboarding-storage-state.json",
} as const
