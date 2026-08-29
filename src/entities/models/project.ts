/** User and workspace pair that scopes every Project operation. */
export type ProjectOwnerScope = {
  readonly organizationId: string;
  readonly ownerId: string;
};

/** Persisted owner-private Project in one Workspace. */
export type Project = ProjectOwnerScope & {
  readonly createdAt: Date;
  readonly description: string | null;
  readonly folderId: string | null;
  readonly id: string;
  readonly instructions: string;
  readonly name: string;
  readonly pinned: boolean;
  readonly updatedAt: Date;
};
