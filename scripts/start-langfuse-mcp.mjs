const {
  LANGFUSE_BASE_URL: baseUrl,
  LANGFUSE_PUBLIC_KEY: publicKey,
  LANGFUSE_SECRET_KEY: secretKey,
} = process.env;

if (!baseUrl || !publicKey || !secretKey) {
  throw new Error(
    "Langfuse MCP requires LANGFUSE_BASE_URL, LANGFUSE_PUBLIC_KEY, and LANGFUSE_SECRET_KEY in .env"
  );
}

const authorization = `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`;
const mcpRemoteProcess = Bun.spawn(
  [
    "bunx",
    "mcp-remote@0.8.2",
    `${baseUrl.replace(/\/$/, "")}/api/public/mcp`,
    "--transport",
    "http-only",
    "--header",
    "Authorization:${LANGFUSE_MCP_AUTHORIZATION}",
  ],
  {
    env: { ...process.env, LANGFUSE_MCP_AUTHORIZATION: authorization },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }
);

process.exit(await mcpRemoteProcess.exited);
