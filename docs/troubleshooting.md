# Troubleshooting

First classify the request. General informational queries use ChatGPT directly:
no plugin, workspace, doctor, pairing or local service is required. A broken
workspace connector does not block general chat. Keep the current model/effort.

For a task that actually needs workspace access:

```
c2c doctor
```

It checks Node, workspace, bridge, MCP, OAuth and tunnel — and repairs what it
can (restarts the bridge, restarts the tunnel) without asking.

## Common situations

### "Bridge 未运行"
`c2c start` (or let doctor do it). Bridge logs:
`c2c logs`, or verbose: `c2c logs --verbose`.

If doctor says the bridge state is **uncertain** (无法确认), do not start a
second bridge and do not Delete the ChatGPT connector. Wait and run doctor
again. The local process may still be running.

### Everything was quit and ChatGPT can no longer connect
If the bridge restarts and its temporary address changes, doctor may report
`chatgptRepair.needed`. Preserve the existing connector, Project and chat.
`connectorAction: "update"` requests an in-place address update if the UI
supports it; it never means Delete + create. If editing the address is not
available, report the blocker without deleting or duplicating the plugin.

At an unchanged address, an actual authorization failure can be repaired
through the existing connector's authorization flow. Mint a pairing code
only when the pairing form is ready. After repair, verify workspace_info in
the saved chat before resuming workspace work. Do not create successive new
chats just because a tool call failed. General queries can continue directly.

Fixed ChatGPT pages for first-time setup and later repair (do not hunt the UI):

- Developer mode: https://chatgpt.com/#settings/Security
- Plugins hub (manage existing connectors): https://chatgpt.com/plugins
- Add a connector:
  https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins

### Tunnel URL unreachable / ChatGPT says the connector is broken
For workspace access, run doctor and distinguish a connectivity failure from
an authorization failure. Reuse the existing plugin. Repair its authorization
or update its URL in place if supported; otherwise report the blocker.
Never delete/recreate it. If using a stable hostname and doctor sets
`namedRepair`, log in to Cloudflare and rerun doctor; keep the connector.

### I have a Cloudflare domain and want a stable hostname
During first-time setup (or the next coding session, once), say you have a
Cloudflare account and give the domain. Codex opens a browser for Cloudflare
login, then keeps `c2c-<project>.your-domain.com`. To stay on the temporary
address, say you do not have a domain. Switching later: tell Codex you want
the stable hostname; it runs `c2c tunnel choose --mode named --zone <domain>`.

### "配对码无效/过期"
Pairing codes are one-time and expire after ~5 minutes. Generate one only
when the ChatGPT Authorize page is ready:

```
c2c pair
```

Older codes become invalid immediately. Do not mint a code during `c2c doctor`.

### Temporary address keeps dropping on a UDP-filtered network
cloudflared defaults to QUIC. If the tunnel reconnects over and over on a
corporate network, set `C2C_TUNNEL_PROTOCOL=http2` and restart the bridge.
Leave it unset to keep cloudflared's default.

### ChatGPT gets 401 on every tool call
A confirmed 401 can indicate expired/revoked authorization. At the same
address, authorize the existing connector with a fresh pairing code. If the
address changed, follow the in-place update path above. A generic account or
tool error alone does not prove the credentials expired. Never delete/recreate
the plugin, and never repeatedly reconnect against a known stale address.

### cloudflared is not installed
macOS: `brew install cloudflared`
Windows: `winget install Cloudflare.cloudflared`
Linux: see Cloudflare's package instructions.
The Skill installs this automatically during setup.
If cloudflared is installed in a custom location that is not on `PATH`, set
`C2C_CLOUDFLARED_PATH` to the executable's absolute path before running `c2c`.

### Every new Codex chat “repairs” the connection / cannot write logs
New chats reuse the same workspace connector. Creating a chat is not a reason
to pair again or delete a plugin. General query chats skip local setup entirely.

The C2C state directory lives outside the project (macOS:
`~/Library/Application Support/codex-with-chatgpt`; Windows:
`%LOCALAPPDATA%\codex-with-chatgpt`). Codex's default sandbox cannot write
there, so each new chat looks like a health-check failure.

`c2c setup`, `c2c doctor` and `c2c sandbox-allow` add that directory to
`[sandbox_workspace_write].writable_roots` in `~/.codex/config.toml`
(`%USERPROFILE%\.codex\config.toml` on Windows). After that, later chats
do not need elevation.

### Port already in use
Handled automatically: an existing healthy bridge for the same workspace is
reused; anything else makes the bridge pick a free port. Configuration follows
automatically.

### Reading a file returns ACCESS_DENIED_SENSITIVE_FILE
Working as intended: `.env`, keys, credentials and anything matched by
`.c2cignore` are never readable through ChatGPT. `.env.example` is allowed.

### I cannot see Projects in the ChatGPT sidebar
Hover **Chats** /「聊天」, click the … that appears, and choose
**Organize by project** /「按项目整理」. Then create a project named after
this workspace, with **project-only memory**. Tell Codex「好了」when the
collection page is open (`https://chatgpt.com/g/g-p-…/project`).

### This workspace opened the wrong ChatGPT Project
Do not pick another project by name automatically. Open the collection that
matches this workspace and tell Codex「已找到」, or say you want the old
long-chat instead. Each workspace has its own Project and its own connector.

### Completely stuck
Preserve the connector and checkpoint. Report the observed failure rather than
resetting setup from scratch: restarting can change the temporary address.
Continue independent general queries, and request only the action needed to
restore workspace access. Never delete a plugin as a generic recovery step.
