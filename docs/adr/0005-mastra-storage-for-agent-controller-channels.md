---
status: superseded by ADR-0006
---

# Mastra storage owns Agent Controller channel threads, not app Chats

Agent Controller channels need stored thread mappings and message history across restarts. Mastra now uses PostgreSQL in an isolated `mastra` schema for Agent Controller channel threads and Redis Streams for cross-process signals. App Chats and Messages remain canonical in Drizzle tables because their ownership, workspace scope, sharing, and Library File rules still belong to this app.

This narrows ADR 0001 rather than moving app Chat persistence into Mastra. Web Chats continue through the AI SDK route and do not share history with Slack threads. A later cross-channel Chat feature must first define Slack-to-User and Slack-to-Workspace identity mapping, then deliberately reconcile the two message stores.
