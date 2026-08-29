# Project Sources are a Library Folder, not model context

A Project scopes Chats with Custom Instructions and collects files ("Sources"). The obvious design — and the one we debated first — was a reference model: a `project_file` join table linking a Project to Library Files, with every referenced file injected into the model context of every Chat in the Project (the app already inlines chat-attached files as base64/text on each request). We rejected it: Sources instead live in an ordinary Library Folder named after the Project, and are not sent to the model at all.

Two reasons. First, cost and blast radius: file injection here is full-content, per request, every request — a Project's file set would multiply that on every message of every Chat in the Project, with no retrieval layer to trim it. Second, zero new concepts: a Folder already exists, already caps and validates uploads, and already gives the user one place in their Library where a Project's files accumulate (page uploads, moves from the Library, and uploads made inside the Project's Chats all land there). Only Custom Instructions reach the model, prepended as a system message per request.

## Consequences

- The Project→Folder link is loose by design: the Folder is created lazily on the first Source, named after the Project at that moment, and never renamed or deleted by the Project afterward. The user may rename or delete it freely; the next Source recreates it. Do not "fix" this by syncing names or cascading deletes.
- "Why doesn't the assistant see my project files?" is expected user feedback, not a bug. Revisit injection only with a retrieval/selection layer (RAG or explicit per-chat attach), not by inlining the whole Folder.
- Deleting a Project deletes its Chats but never touches the Library — Folder and Files survive.
