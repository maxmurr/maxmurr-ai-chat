# AI Chat

A workspace-based AI chat app: users sign in with email OTP, belong to workspaces, and hold persisted conversations with an AI assistant that can be shared with teammates or via public link.

## Language

**Chat**:
A single linear conversation between one user and the assistant — an append-only sequence of Messages. Owned by exactly one User (its creator, forever) and scoped to exactly one Workspace.
_Avoid_: Conversation, thread, session

**Message**:
One turn in a Chat, from either the user or the assistant. Stored as the full AI SDK UIMessage (parts: text, reasoning, tool calls, files, sources), never as plain text.

**Workspace**:
The team container users belong to and chat within. Backed by Better Auth's `organization` table — "organization" is the storage name only.
_Avoid_: Organization, team, org

**Owner (of a Chat)**:
The User who created the Chat. The only person who can append Messages to it, rename it, change its Visibility, or delete it. Ownership never transfers.

**Visibility**:
Who can see a Chat: `private` (owner only), `workspace` (all members of the Chat's Workspace, read-only), or `public` (anyone with the Public Link, read-only). Viewing never grants writing.
_Avoid_: Access level, sharing mode

**Public Link**:
An unguessable token URL granting live read-only access to a Chat's current state. Revocable; deleting the Chat kills it.
_Avoid_: Share link, snapshot

**Title**:
A Chat's display name. Auto-generated once by a cheap model after the first exchange; owner can rename.
