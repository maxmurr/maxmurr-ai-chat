import { instant } from "@next/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"

import {
  INSTANT_NAVIGATION_FIXTURES,
  INSTANT_NAVIGATION_STORAGE_STATES,
} from "./instant-navigation-fixtures"

function visibleTestId(page: Page, testId: string) {
  return page.getByTestId(testId).filter({ visible: true }).first()
}

function visibleTestIds(page: Page, testId: string) {
  return page.getByTestId(testId).filter({ visible: true })
}

async function expectInstantInitialNavigation(
  page: Page,
  baseURL: string,
  path: string,
  shellTestId: string,
  contentTestId: string
) {
  const targetUrl = new URL(path, baseURL)

  await instant(
    page,
    async () => {
      await page.goto(targetUrl.toString())
      await expect(page).toHaveURL(targetUrl.toString())
      await expect(visibleTestId(page, shellTestId)).toBeVisible()
      await expect(visibleTestIds(page, contentTestId)).toHaveCount(0)
    },
    { baseURL: targetUrl.origin }
  )

  await page.reload()
  await expect(visibleTestId(page, contentTestId)).toBeVisible()
}

async function getSidebarLink(page: Page, name: string) {
  const link = page
    .locator('[data-slot="sidebar"]')
    .getByRole("link", { exact: true, name })
    .filter({ visible: true })
    .first()

  if (!(await link.isVisible())) {
    await page.getByRole("button", { name: "Toggle sidebar" }).click()
  }

  await expect(link).toBeVisible({ timeout: 20_000 })
  return link
}

async function expectInstantSoftNavigation({
  baseURL,
  contentDuringLock = "deferred",
  contentTestId,
  from,
  page,
  shellTestId,
  to,
  trigger,
}: {
  baseURL: string
  contentDuringLock?: "deferred" | "present"
  contentTestId: string
  from: string
  page: Page
  shellTestId: string
  to: string
  trigger: (page: Page) => Locator | Promise<Locator>
}) {
  await page.goto(from)
  const navigationTrigger = (await trigger(page))
    .filter({ visible: true })
    .first()
  await expect(navigationTrigger).toBeVisible({ timeout: 20_000 })
  const targetUrl = new URL(to, baseURL)

  await instant(page, async () => {
    await navigationTrigger.click()
    await expect(page).toHaveURL(targetUrl.toString())
    await expect(visibleTestId(page, shellTestId)).toBeVisible()

    if (contentDuringLock === "deferred") {
      await expect(visibleTestIds(page, contentTestId)).toHaveCount(0)
    } else {
      await expect(visibleTestId(page, contentTestId)).toBeVisible()
    }
  })

  await expect(visibleTestId(page, contentTestId)).toBeVisible()
}

const fixtures = INSTANT_NAVIGATION_FIXTURES

for (const [path, shellTestId, contentTestId] of [
  ["/sign-in", "sign-in-shell", "sign-in-content"],
  ["/sign-up", "sign-up-shell", "sign-up-content"],
  [
    `/share/${fixtures.chat.publicToken}`,
    "shared-chat-shell",
    "shared-chat-content",
  ],
] as const) {
  test(`initial ${path} shell commits instantly`, async ({ baseURL, page }) => {
    await expectInstantInitialNavigation(
      page,
      baseURL!,
      path,
      shellTestId,
      contentTestId
    )
  })
}

test("soft sign-in to sign-up commits instantly", async ({ baseURL, page }) => {
  await expectInstantSoftNavigation({
    baseURL: baseURL!,
    contentTestId: "sign-up-content",
    from: "/sign-in",
    page,
    shellTestId: "sign-up-shell",
    to: "/sign-up",
    trigger: (currentPage) =>
      currentPage.getByRole("link", { exact: true, name: "Sign Up" }),
  })
})

test("soft sign-up to sign-in commits instantly", async ({ baseURL, page }) => {
  await expectInstantSoftNavigation({
    baseURL: baseURL!,
    contentTestId: "sign-in-content",
    from: "/sign-up",
    page,
    shellTestId: "sign-in-shell",
    to: "/sign-in",
    trigger: (currentPage) =>
      currentPage.getByRole("link", { exact: true, name: "Sign In" }),
  })
})

test.describe("authenticated instant navigation", () => {
  test.use({ storageState: INSTANT_NAVIGATION_STORAGE_STATES.active })

  for (const [path, shellTestId, contentTestId] of [
    ["/chat", "chat-shell", "chat-content"],
    [`/chat/${fixtures.chat.id}`, "chat-shell", "chat-content"],
    ["/library", "library-shell", "library-content"],
    [
      `/library/${fixtures.folder.id}`,
      "library-shell",
      "library-content",
    ],
    ["/projects", "projects-index-content", "projects-list-content"],
    [
      `/projects/${fixtures.project.id}`,
      "project-detail-shell",
      "project-detail-content",
    ],
  ] as const) {
    test(`initial ${path} shell commits instantly`, async ({
      baseURL,
      page,
    }) => {
      await expectInstantInitialNavigation(
        page,
        baseURL!,
        path,
        shellTestId,
        contentTestId
      )
    })
  }

  for (const navigation of [
    {
      contentTestId: "projects-list-content",
      from: "/chat",
      name: "Projects",
      shellTestId: "projects-index-content",
      to: "/projects",
    },
    {
      contentTestId: "library-content",
      from: "/chat",
      name: "Library",
      shellTestId: "library-shell",
      to: "/library",
    },
    {
      contentTestId: "chat-content",
      from: "/projects",
      name: "New chat",
      shellTestId: "chat-shell",
      to: "/chat",
    },
  ] as const) {
    test(`soft ${navigation.from} to ${navigation.to} commits instantly`, async ({
      baseURL,
      page,
    }) => {
      await expectInstantSoftNavigation({
        ...navigation,
        baseURL: baseURL!,
        page,
        trigger: (currentPage) =>
          getSidebarLink(currentPage, navigation.name),
      })
    })
  }

  test("soft chat fixture commits instantly", async ({ baseURL, page }) => {
    await expectInstantSoftNavigation({
      baseURL: baseURL!,
      contentTestId: "chat-content",
      from: "/chat",
      page,
      shellTestId: "chat-shell",
      to: `/chat/${fixtures.chat.id}`,
      trigger: async (currentPage) => {
        await getSidebarLink(currentPage, fixtures.chat.title)
        return currentPage.locator(
          `[data-slot="sidebar"] a[href="/chat/${fixtures.chat.id}"]`
        )
      },
    })
  })

  test("soft project detail commits instantly", async ({ baseURL, page }) => {
    await expectInstantSoftNavigation({
      baseURL: baseURL!,
      contentTestId: "project-detail-content",
      from: "/projects",
      page,
      shellTestId: "project-detail-shell",
      to: `/projects/${fixtures.project.id}`,
      trigger: (currentPage) =>
        currentPage.locator(
          `#project-list a[href="/projects/${fixtures.project.id}"]`
        ),
    })
  })

  test("soft project index commits instantly", async ({ baseURL, page }) => {
    await expectInstantSoftNavigation({
      baseURL: baseURL!,
      contentTestId: "projects-list-content",
      from: `/projects/${fixtures.project.id}`,
      page,
      shellTestId: "projects-index-content",
      to: "/projects",
      trigger: (currentPage) =>
        currentPage
          .locator("#main-content")
          .getByRole("link", { exact: true, name: "Projects" }),
    })
  })

  test("soft Library folder commits instantly", async ({ baseURL, page }) => {
    await expectInstantSoftNavigation({
      baseURL: baseURL!,
      contentTestId: "library-content",
      from: "/library",
      page,
      shellTestId: "library-shell",
      to: `/library/${fixtures.folder.id}`,
      trigger: (currentPage) =>
        currentPage.locator(
          `#main-content a[href="/library/${fixtures.folder.id}"]`
        ),
    })
  })

  test("soft Library root commits instantly", async ({ baseURL, page }) => {
    await expectInstantSoftNavigation({
      baseURL: baseURL!,
      contentTestId: "library-content",
      from: `/library/${fixtures.folder.id}`,
      page,
      shellTestId: "library-shell",
      to: "/library",
      trigger: (currentPage) =>
        currentPage
          .locator("#main-content")
          .getByRole("link", { exact: true, name: "Library" }),
    })
  })
})

test.describe("no-workspace instant navigation", () => {
  test.use({ storageState: INSTANT_NAVIGATION_STORAGE_STATES.onboarding })

  test("initial onboarding shell commits instantly", async ({
    baseURL,
    page,
  }) => {
    await expectInstantInitialNavigation(
      page,
      baseURL!,
      "/onboarding",
      "onboarding-shell",
      "onboarding-content"
    )
  })

  test("initial invitation shell commits instantly", async ({
    baseURL,
    page,
  }) => {
    await expectInstantInitialNavigation(
      page,
      baseURL!,
      `/accept-invitation/${fixtures.invitation.id}`,
      "invitation-shell",
      "invitation-content"
    )
  })
})
