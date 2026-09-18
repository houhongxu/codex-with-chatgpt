---
name: codex-with-chatgpt
description: >
  Use ChatGPT web for query-only answers and for planning/review while Codex
  owns execution. Trigger on "cwc" (case-insensitive), "使用 Codex with ChatGPT",
  "用 ChatGPT 规划", or CWC setup/repair/disconnect requests. Also use by default
  for informational questions, lookups, explanations and comparisons unless
  the user opts out. General queries need no workspace or plugin; workspace
  queries are read-only; action requests use the full planning/execution/review loop.
---

# Codex with ChatGPT

ChatGPT thinks. Codex works.

You (Codex) own execution: editing, shell, git, tests, recovery.
ChatGPT answers queries and provides high-level reasoning, planning and review.
General queries go directly into the ChatGPT composer. The C2C Bridge is
needed only for local workspace data; it gives ChatGPT read-only MCP access.
Coding control messages stay tiny (< 1 KB); files, diffs and logs stay in MCP.

## Communication language

Use Chinese for all natural-language communication: user-facing updates and
answers, questions sent to ChatGPT, boot/HANDOFF prompts, plans and review
requests. Ask ChatGPT to reply in Chinese. Keep protocol keys/state values
(`STATE`, `PLAN`, etc.), code, commands, paths, URLs and proper names unchanged.
Translate explanatory prose in legacy prompt examples before sending it.
Preserve source quotations when needed and explain them in Chinese. Follow
an explicit request for another output language for that requested content.

## Route the request first

Choose the route BEFORE update checks, sandbox changes, doctor, session commands,
workspace verification or any connector setup. `cwc`, `CWC` and the full name
mean the same skill, not a terminal command. An explicit opt-out ("不用 cwc",
"Codex 直接回答") wins. A keyword in quoted text/code is not itself an instruction.

| User intent | Route |
| --- | --- |
| General lookup, explanation, comparison or discussion | **Query-only chat** below; no workspace or plugin required, even if an unrelated connector is broken. |
| Question requiring local files, code, git state or recorded results | **Workspace query** below; use the existing read-only connector. |
| Implement, edit, install, run tests, commit, publish or otherwise change state | **Coding task** (full plan → execute → review), or the explicit setup/repair/disconnect workflow. |

"怎么修复？" asks for advice; "帮我修复" requests execution. A mixed request
that explicitly asks to investigate AND fix uses the full workflow. If intent
is ambiguous, answer in query-only mode or clarify; a suggested fix is not
permission to apply it. Normal follow-up answers stay in the selected route
until the user's intent changes. Do not run another model/effort selection
or confirmation step: use ChatGPT's current setting.

## Workflow: query-only chat

1. Use the one in-app browser tab, keeping it visible and marked for reuse.
   Reuse the ChatGPT conversation already bound to THIS Codex thread. If none
   exists, start an ordinary Chat conversation at `https://chatgpt.com/` and
   remember its URL in this thread. Do not require a Project or save a generic
   query chat over a workspace's session/checkpoint. Never borrow an unrelated
   task's conversation just because it is open.
2. Send the user's question directly, retaining its constraints and useful
   context. Make the route explicit, especially in an existing coding chat:
   "本次仅查询，请用中文回答，不要规划或执行修改。不需要访问本机工程。
   涉及时效信息或需要来源时请联网查证，并附上实际读取的来源链接。"
   Do not send the coding boot prompt or INIT/EXECUTED, ask for workspace_info,
   inspect the repository, upload files, or copy local file bodies/diffs/logs.
3. Wait for the ordinary answer on the same tab using the browser waiting
   rules. Check that the submitted question is visible before waiting. A
   timeout does not justify resending it or opening another chat. If a browser
   call was interrupted, read the chat first to avoid duplicate submissions.
4. Return the answer with useful source links, uncertainty and any material
   corrections clearly attributed. Do not say ChatGPT answered unless it did.
   A weak answer can get a focused follow-up, not an execution/review cycle.
   Do not run builds/tests, change project files, write execution records or
   create/clear a coding checkpoint for an informational answer.
5. Handle ChatGPT login or page errors as browser issues. No c2c CLI command,
   connector repair, pairing or local service is a prerequisite for this route.
   If ChatGPT is unavailable, report that limitation; do not silently claim
   a Codex-only answer came from CWC. Keep the tab for the next follow-up.

## Workflow: workspace query

Use this only when the answer actually depends on local workspace data.
Reuse the current workspace and its existing connector. Apply the connection
checks and conversation binding from **Coding task** steps 0–1, but skip the
coding boot/INIT/PLAN. If a coding task is still generating, wait for its
reply before sending a query on that chat. Do not resume, overwrite or clear an in-progress
coding checkpoint merely to answer a question. For a new workspace chat,
verify workspace_info before binding its URL, then send the query-only request.

Ask ChatGPT to read only the relevant files through the exact connector and
answer with file/line evidence. It may read recorded test results, but neither
agent runs tests or applies fixes in this route. If required access is missing,
report what could not be verified and use non-destructive repair; do not infer
local facts from memory. General parts of the question can still be answered
without the connector. A later request to apply a fix starts the full workflow.

`query-only` and `workspace query` are intent routes, not new persisted
conversation modes or coding protocol states.

**Golden rules**

1. NEVER paste file contents, diffs, or logs into ChatGPT. ChatGPT reads them through MCP.
2. NEVER show the user technical internals (MCP, OAuth, PKCE, tunnel, ports, localhost).
   Speak in terms of "连接 ChatGPT / 安全连接 / 配对". The only exception is the
   **guided manual ChatGPT setup** below: expose only the exact settings
   field labels/values the user must enter, without explaining internals.
3. The pairing code is the ONLY credential you may ever type into a browser.
   Never touch OAuth tokens, cookies, or session storage.
4. If workspace access fails, run `c2c doctor` and repair non-destructively.
   General query/browser failures never trigger doctor or connector setup.
   Only involve the user for logins, CAPTCHA, 2FA, explicit consent screens, or **guided manual
   ChatGPT setup** below — and then give them ONE action.
   Before the first ChatGPT connection on this machine, `c2c prefs --json`:
   - `setupMode` missing: tell the user exactly `setupChoicePrompt`, wait for
     「1」or「2」, then `c2c prefs set --setup-mode auto|manual --json`.
     Do not start ChatGPT configuration until they answer. Do not guess.
   - `setupMode` is `manual`: skip automatic ChatGPT settings. Use guided
     manual from the start (chosen, not a failure).
   - `setupMode` is `auto`: automatic browser setup. Two explicit failures of
     the same configuration step after repair then enter guided manual.
     A browser/js timeout, a page still loading/generating, or waiting for
     user login/2FA does NOT count as a failure. Do not change the saved
     `setupMode` when falling back.
   `developerModeEnabled: true` means skip `#settings/Security` until a
   connector create fails because developer mode is required. Then open
   that page, enable it, and `c2c prefs set --developer-mode --json`.
   These prefs are for this machine, not per workspace. Do not ask again
   on reconnect or a second repo. A new computer (empty prefs) asks/checks
   once.
5. ALWAYS use the built-in in-app browser (iab) for every ChatGPT step.
   Follow **In-app browser (ChatGPT)** below. NEVER Computer Use (no
   screenshot-click). NEVER launch or control a third-party/external browser
   (Chrome, Safari, Edge…), and never use `open <url>` to hand off to one.
   - The ONLY exception: the user explicitly says the Cloudflare login must use
     their own browser session — that single Cloudflare login step may go through
     their browser; everything else stays in the built-in browser.
   - If the user asks to run ChatGPT in their own browser, refuse politely and
     explain: "Codex 需要持续调用 ChatGPT 和配置连接，这会频繁操作页面，可能影响
     你浏览器的正常使用。ChatGPT 只能跑在内置浏览器里。" Only if the user replies
     with an explicit "我愿意承担影响" may you proceed in their browser; otherwise
     keep ChatGPT in the built-in browser, every time they ask.
6. For workspace tasks, conversation reuse depends on `c2c session --json` → `conversation.mode`
   (see Conversation management). Do not invent a second mode.
   - **long-chat** (legacy session file, or the user opted out): ONE ChatGPT
     conversation per workspace. Never silently start a new chat.
   - **project** (new workspaces, or an existing workspace that opted in):
     ONE ChatGPT Project (collection) per workspace. Same Codex conversation
     reuses the ChatGPT chat URL saved in THIS thread. A new Codex
     conversation opens a new chat from the Project collection page — never
     `goto` `https://chatgpt.com/` to create it, and never reuse another
     Codex conversation's chat URL just because `session.url` exists.
   Each workspace also has exactly ONE ChatGPT connector. Do not create a
   second connector for the same workspace. Other workspaces may have their
   own connectors — never edit those. Switching chats never requires a new
   plugin. NEVER delete, uninstall or recreate an existing connector to repair
   it, including in manual fallback. An unchanged address uses the same plugin;
   renew authorization only when an actual authorization failure requires it.
   If an address changed, update the existing connector only if the UI supports
   it. Otherwise preserve it and report the blocker, without creating a duplicate.
7. After first-time setup, never ask the user to approve writing C2C's local
   settings directory. Run `c2c sandbox-allow --json` (idempotent). If it fails
   with EPERM / Operation not permitted, request elevated permissions and retry
   ONCE. After `{ "alreadyAllowed": true }` or `{ "added": true }`, stay silent.
8. ChatGPT pages: only the URLs in **In-app browser (ChatGPT)**. Never start
   from chatgpt.com and click through menus.
9. **Doctor gate (workspace access only).** General query-only chat bypasses
   this gate. After `c2c doctor --json`, do not start workspace access and do not
   send `[C2C]` until local is green — except the reconnect settings pages when
   `chatgptRepair.needed` is true. Not green:
   - `report.bridge.ok` is not true
   - `report.mcp.ok` is not true (unauthenticated local `/mcp` must be 401)
   - sandbox / state-dir write failed (EPERM)
   - this workspace used to have a public URL and the tunnel is down
   - `chatgptRepair.needed` is true (fix the connector first, then doctor again)
   - `namedRepair.needed` is true (user must log in to Cloudflare, then doctor again.
     Do not Delete the ChatGPT connector — the address did not change)
   - `report.bridge` says 状态无法确认: the local bridge may still be running.
     Do not `c2c start`, do not Delete the connector, do not treat it as
     `chatgptRepair`. Wait and run doctor again.
   If doctor is already green and `chatgptRepair.needed` is false, do not
   `c2c restart`, do not start a second tunnel, and do not Delete the
   connector. ChatGPT/IAB-only errors are not permission to churn the
   public address.
   A ChatGPT-side 401 after a sent message is different: repair then, do not
   treat it as permission to skip this gate next time.

## In-app browser (ChatGPT)

Official skill: `control-in-app-browser`. These C2C rules override defaults
that close the tab, hide the window, or stall on the settings page.

1. **Surface.** Once per Codex session: `setupBrowserRuntime()`, then
   `const iab = await agent.browsers.get("iab")`. Reuse `iab`. Do not re-read
   `documentation()` if it is already bound. Never `getDefault()`, `getForUrl()`,
   or Computer Use.

2. **One tab.** Create the ChatGPT tab once (`tabs.new()`). After that, only
   `tab.goto(...)` to switch URLs. If the tab still exists, claim it — never
   open a second ChatGPT tab. Do not `goto` the URL you are already on.

3. **Foreground + keep (standby).** Right after opening or claiming the tab:
   - `await (await iab.capabilities.get("visibility")).set(true)` — first-time
     setup and ChatGPT chatting stay in front of the user so they can watch.
   - `await tab.markHandoff()` immediately, then again at the start and end of
     every turn. After setup succeeds or the C2C chat is open, also
     `await tab.markDeliverable()`.
   Never close this tab. Finished, waiting for the user, or timed out: leave it
   marked (standby). Do not let default turn cleanup close it.

4. **URLs only** (same tab, `goto` — never hunt menus):
   - 开发人员模式: `https://chatgpt.com/#settings/Security`
     (skip when `c2c prefs --json` has `developerModeEnabled: true`)
   - 插件总管: `https://chatgpt.com/plugins`
   - 加插件: `https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins`
   - 新对话 (general query with no thread-bound chat, or long-chat with no saved chat): `https://chatgpt.com/`
   - Saved C2C chat: `conversation.chatUrl` / `session.url` (long-chat, or
     the chat already bound in THIS Codex conversation)
   - Saved Project collection: `conversation.projectUrl`
     (`https://chatgpt.com/g/g-p-…/project`)
   Reuse THIS workspace's existing connector. Never delete/recreate it to
   reconnect. At an unchanged address, use its existing authorization flow
   only when needed. If the address changed, do not blindly click Reconnect
   against the stale address: update it in place if supported, otherwise report
   the blocker and preserve the connector. Create only when genuinely absent
   and setup is requested; never create one for a general query. Store only
   the connector **name**, not its public address, in Project instructions.

5. **Do not wait for 8 tools** on the settings page. "Connected" / authorize
   success / pairing accepted is enough. Confirm tools in the conversation with
   `workspace_info`.

6. **Batch.** Fill a known form in one Playwright / `js` script when you can.
   After an action, one cheap DOM check. Do not screenshot-poll.

7. **One conversation, Chat mode.** The first ChatGPT chat is the C2C
   conversation. Chat and Work (聊天 / 工作) are separate: a Work conversation
   cannot become Chat. On every NEW conversation, if a Chat/Work switcher is
   visible (often top-left), confirm **Chat** is selected before the boot
   prompt. If it is Work, do not continue there — Switch to a new Chat
   conversation (HANDOFF). If no switcher is visible, do not hunt menus; continue.
   For a coding task, send the boot prompt and workspace_info check there;
   for a workspace query, send only the identity check and query request.
   General queries skip both checks and need no workspace binding.
   For workspace chats, confirm the reply names the current workspace **before** saving or replacing
   the session URL. If validation fails, keep the old saved URL. Do not open a
   throwaway verify chat and later another C2C chat.

   A collection or chat page that shows only `Retry` / `重试` is a navigation
   error, not generation and not a pairing failure. Reuse the same iab tab.
   Try Retry once. If it stays Retry-only, `goto` the last working chat URL
   from this thread (or `session.url` if that is the only saved chat), then
   click the on-page `Open … project` / `打开“… ”项目` link — that same-site
   hop is allowed. Do not treat the URLs-only rule as forbidding this link.
   On the collection, require the project chat list and new-chat composer
   before continuing. Keep the old saved URL/checkpoint until the replacement
   chat passes workspace_info. Do not `session clear`. Do not use Computer Use.

8. **Wait for a ChatGPT reply (do not hold one long browser wait).** After you
   send INIT, EXECUTED, boot, or the workspace_info check: `markHandoff`, keep
   the tab foreground, and stay in this same task. Do not `waitFor` 5 minutes
   and do not screenshot-poll. Every 20–30 seconds, one cheap DOM check:
   - still generating → wait again (do not type, do not resend);
   - `STATE: PLAN` / `DONE` / `BLOCKED` / the verify workspace name, or a
     completed ordinary query answer → read it and continue the selected route;
   - visible error → repair; do not start a new chat.
   A browser/js timeout is not failure. Claim the same tab, read the page, keep
   standby. If ChatGPT is still thinking, keep polling. Never open a second
   tab and never resend INIT/EXECUTED just because a wait timed out.

## Locations

- The codex-with-chatgpt checkout lives at: `<ACTUAL_CHECKOUT_PATH>`
  (installer/update MUST replace this line in the installed Skill with the user's actual checkout path.)
- CLI: let `<checkout>` mean the path on the previous line; run
  `node "<checkout>/bin/c2c.js" <command>` (or `c2c <command>` if globally linked).
  All commands support `--json` for parsing.
- If the checkout has no `node_modules` or no `dist/`, first run
  `corepack pnpm install && corepack pnpm build` inside it.
- For commands that act on the user's project (`setup`, `doctor`, `session`,
  `restart`, `start`, `stop`, `status`, `pair`, `unpair`, `logs`, `workspace`,
  `record`, `tunnel status`, `tunnel choose`), pass `-w <workspace root>`
  (the project the user is working on, NOT the c2c repo).
- Do not add `-w` to machine-wide commands: `update-check`, `sandbox-allow`,
  `prefs`, `tunnel login`. They still accept and ignore `-w`, so a leftover
  flag must not fail the command.

## Daily update check

For workspace and explicit maintenance workflows only, after routing and
before their connection steps, run these two commands. General query-only
chat skips this entire section (including auto-update and sandbox writes):

1. `c2c update-check --json` (do not pass `-w`)
2. `c2c sandbox-allow --json` (do not pass `-w`) — writes the C2C state directory into Codex's
   sandbox `writable_roots` (macOS: `~/Library/Application Support/codex-with-chatgpt`;
   Windows: `%LOCALAPPDATA%\codex-with-chatgpt`; config file is
   `~/.codex/config.toml` on both, or `%USERPROFILE%\.codex\config.toml` on Windows).
   If already allowlisted, this is a no-op and does not trigger elevation.

- `{ "updateAvailable": false }` → continue silently. Never mention the check.
- `{ "updateAvailable": true }` → tell the user one line:
  "检测到 Codex with ChatGPT 有新版本，我先更新一下（约 1 分钟），随后继续你的任务。"
  Then run the update workflow below, and CONTINUE the original task afterwards.

## Workflow: update（"更新 Codex with ChatGPT"，or triggered by the daily check）

Inside the checkout directory (see Locations):

1. `git pull --ff-only` (if it fails due to local edits: `git stash && git pull --ff-only`).
2. `corepack pnpm install && corepack pnpm build`.
3. Re-install the Skill: copy `skill/SKILL.md` to
   `~/.codex/skills/codex-with-chatgpt/SKILL.md`, then fix the "checkout lives at:"
   line in the copy to the actual checkout path. Preserve any installed
   `Local machine installation` section and machine-local launcher scripts.
4. `c2c sandbox-allow --json` (so existing installs pick up the sandbox allowlist),
   then `c2c restart -w <workspace>` so the bridge runs the new code, then
   `c2c update-check --force --json` to refresh the cache (should now report up to date).
5. Tell the user "✓ 已更新到最新版本" — then resume whatever task triggered this.
   (The updated SKILL.md takes effect from the next Codex session; that's expected.)

## Connection choice (once per workspace)

Ask this **before** the public address exists (`c2c setup` / first `doctor --fix`
that starts a tunnel). Do not mention tunnels, wrangler, DNS, or hostnames.
Speak only of 临时地址 / 固定域名 / 登录 Cloudflare.

1. `c2c tunnel status -w <workspace> --json`
2. If `needsChoice` is false: do not ask again.
3. If `needsChoice` is true: tell the user exactly `userPrompt` and wait.
   - 没有账号 / 没有域名 / 临时 / 不用 →
     `c2c tunnel choose -w <ws> --mode quick --json`
   - 有域名（例如 example.com）→ first tell them `loginPrompt`, then
     `c2c tunnel choose -w <ws> --mode named --zone <domain> --json`.
     This may open the user's own browser (the Cloudflare exception in
     Golden rule 5). Wait until the command finishes.
     If they said they have an account but gave no domain: ask once for the
     domain. If the command returns `need: "zone"`, ask once and retry.
     If `fallback` is true: tell them `userMessage` and continue on the
     temporary address. Do not retry named unless they ask.
4. Never put connection credentials in the project. The CLI stores them in
   the C2C state directory.

## Workflow: first-time setup（"使用 Codex with ChatGPT 完成首次配置"）

1. Detect prerequisites yourself: `node --version` (>= 20), and check `cloudflared`.
   - If cloudflared is missing on macOS run `brew install cloudflared`; on Windows use
     `winget install Cloudflare.cloudflared`. Do this yourself; don't ask.
2. If the c2c repo has no `node_modules`, run `pnpm install && pnpm build` in it.
3. Run `c2c sandbox-allow --json`, then **Connection choice**, then
   `c2c setup -w <workspace> --json`.
   `sandbox-allow` edits Codex `config.toml` only — it adds C2C's state directory
   to `[sandbox_workspace_write].writable_roots` so later chats can write logs
   without elevation. If the write is denied, request approval and retry once.
   → returns `{ mcpUrl, pairingCode, workspaceName, connectorName, ... }`.
   `connectorName` is this workspace's plugin title (legacy installs stay
   `Codex with ChatGPT`; additional workspaces get `Codex with ChatGPT · <name>`).
   Pairing codes expire in ~5 minutes. Do not mint one until the ChatGPT
   Authorize / pairing form is on screen: run `c2c pair --json` then type
   that code immediately. Doctor does not pre-mint a code.
4. `c2c prefs --json` (this machine, not this workspace).
   - If `setupMode` is null: tell the user exactly `setupChoicePrompt`. Wait
     for「1」or「2」. Then `c2c prefs set --setup-mode auto` or `--setup-mode manual`.
     Do not open ChatGPT settings and do not start automatic configuration
     until they answer. Do not default to auto.
   - If they later ask to switch: same `c2c prefs set --setup-mode` command.
     Do not re-ask on a later workspace or on reconnect.
   - `setupMode: "manual"`: skip step 5's automatic ChatGPT settings. Go to
     **Guided manual ChatGPT setup** (chosen). Opening line:
     `接下来用手动教学配置。一次只需要做一个操作。`
     Do not say 自动配置没有成功.
   - `setupMode: "auto"`: continue with step 5. Keep the two-failure fallback.
5. Open ChatGPT on the ONE iab tab (see **In-app browser**). Foreground +
   markHandoff immediately. Same tab, `goto` only:
   - 开发人员模式: skip `https://chatgpt.com/#settings/Security` when
     `developerModeEnabled` is true. Otherwise open it, enable 开发人员模式
     ("Developer mode") if it is off, then `c2c prefs set --developer-mode`.
     Never record it as off. If creating the connector later says developer
     mode is required, open this page, enable it, save `--developer-mode`,
     and retry create — do not skip that recovery.
   - 已有该 `connectorName`: reuse it. If access fails, use the non-destructive
     repair workflow; never delete it or create a duplicate. Continue to step 6
     when the existing connection is usable.
   - 确认尚不存在: `https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins`
     Operate ONLY on `connectorName` from step 3:
      - If that exact name already exists: return to the reuse path.
      - If it does not exist: create one with that exact name.
      - Never rename, delete, or edit a connector that belongs to another workspace.
      - Description: `Securely connect ChatGPT to the current Codex workspace for planning and review.`
      - Server URL: the `mcpUrl` from step 3
      - Authentication: OAuth
     Fill the known form in one script when you can. Then Connect / Authorize.
     Only then run `c2c pair --json` and type that code. As soon as it shows
     Connected / authorized / pairing accepted, continue — do NOT wait for 8
     tools on this page.
6. Same tab: open the first C2C chat per **Conversation management**
   (Project collection for a new workspace; `https://chatgpt.com/` only
   in long-chat). Confirm Chat mode per **In-app browser** §7 (if it is Work,
   open a new Chat conversation instead). Send the boot prompt from
   `docs/protocol.md` §Boot Prompt, then (same chat) send:
   `请使用“<connectorName>”连接器调用 workspace_info，并读取一个简单的顶层文件。用中文回复实际验证的工作目录名称。`
   Confirm the reply matches `workspaceName` (wait per **In-app browser** §8).
   Only then save the chat URL with `c2c session set` (see Conversation
   management). If the name does not match, do not save. markDeliverable.
7. Report to the user exactly in this shape (no internals):

```
Codex with ChatGPT

✓ 当前项目已识别
✓ Workspace Bridge 已启动
✓ 安全连接已建立
✓ ChatGPT 已连接
✓ 文件读取测试通过

Ready.
```

If a login wall appears (ChatGPT, Cloudflare): stop, tell the user the ONE thing
to do ("请登录 ChatGPT，完成后告诉我'好了'"), then continue.

### Guided manual ChatGPT setup

Enter this path when `setupMode` is `manual` (chosen at the start), or when
automatic ChatGPT browser configuration fails twice at the same explicit
setup/reconnect step after `c2c doctor` / repair. Do NOT enter the failure
path for a browser/js timeout without a visible error, a page that is
still loading/generating, or while waiting for login / 2FA / CAPTCHA.
A chosen manual path does not wait for those two failures.

Stop automating ChatGPT settings. Keep the current local C2C state and the
current `mcpUrl`, `pairingCode`, `workspaceName`, and `connectorName`. Do not
silently fall back to Codex-only execution and do not permanently disable C2C.
Do not change the saved `setupMode` when this is a failure fallback.

Opening line:

- Chosen (`setupMode: "manual"`): `接下来用手动教学配置。一次只需要做一个操作。`
- Failure fallback: `自动配置没有成功，我来带你手动完成。一次只需要做一个操作。`

Then guide ONE action at a time, waiting for the user to say「好了」before the
next action:

1. If `developerModeEnabled` is not true: ask them to open
   `https://chatgpt.com/#settings/Security` and enable 开发人员模式. After they
   say「好了」, `c2c prefs set --developer-mode`. If it is already remembered,
   skip this step.
2. Ask them to open `https://chatgpt.com/plugins`. If the exact `connectorName`
   exists, keep it and guide its existing authorization or supported in-place
   address update. If the UI cannot do that, stop that repair and report the
   blocker. Never ask them to delete it, create a duplicate or touch another
   workspace's connector.
3. Only if the connector is confirmed absent and setup is requested, open
   `https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins`
   and create the exact `connectorName` with:
   - Description: `Securely connect ChatGPT to the current Codex workspace for planning and review.`
   - Server URL: the current `mcpUrl`
   - Authentication: OAuth
4. Ask them to Connect / Authorize. Then run `c2c pair --json` and give them
   only that pairing code. If it expires before they finish, run pair again.
5. When they report Connected / authorized / pairing accepted, resume the normal
   setup/reconnect flow at its ChatGPT verification step. If automatic browser
   verification then hits the same explicit failure twice, stop and report the
   exact failed step; do not loop indefinitely and do not continue without C2C.

## Conversation management

`c2c session -w <ws> --json` → `{ session, conversation }`.
`conversation.mode` is the only switch. Missing / legacy files with a chat URL
and no Project stay **long-chat**. Do not ask those users to migrate. If they
later say they want a Project, run **Bind Project**. A brand-new workspace
(no session file) is **project**.

Never match a Project or a chat by display name. Never upload the repo to
Project sources. Never click 分享 / Share. Do not rename ChatGPT chats.

### long-chat (do not rewrite this path)

ONE ChatGPT conversation per workspace. Same as before.

- **Find it**: if `conversation.reuseSavedChat` and `conversation.chatUrl`,
  `goto` that URL (foreground + markHandoff) and continue there.
- **Save it**: after boot + workspace_info, and the reply names this workspace,
  `c2c session set -w <ws> --mode long-chat --url <url> --title "C2C <workspace name>"`.
  If the name does not match, do not overwrite a previously saved URL.
- **Update it**: after each EXECUTED/DONE,
  `c2c session set -w <ws> --task <id> --iteration <n> --state <STATE>`
  plus checkpoint flags from the coding workflow (`--protocol-state`,
  `--waiting-for`, `--goal`, `--next-step`, `--known-issues`, or
  `--clear-checkpoint` on DONE). Do not put logs or diffs in those fields.
- **Switch it** ONLY when (a) the user asks for a new chat, (b) the current
  chat visibly lags, or (c) this conversation is Work. Then:
  1. Same iab tab: `goto` `https://chatgpt.com/`, confirm Chat mode
     (**In-app browser** §7), then send the boot prompt.
  2. Send a HANDOFF (`docs/protocol.md`) — goal, progress, state, issues,
     next step. Never paste files.
  3. workspace_info check; only then `c2c session set --url`. On failure,
     leave the old saved URL unchanged.
- Saved chat 404s: treat as a switch. Reconstruct HANDOFF from
  `session.checkpoint` (goal, progress, issues, next step). If there is no
  checkpoint, use `task` / `iteration` / `lastState` and `execution_summary`
  metadata only. Never paste logs or output bodies.

### project (new workspaces)

One ChatGPT Project per workspace. Mapping:

1. Same Codex conversation (this thread still has context) → same ChatGPT
   chat URL. `goto` that URL directly. Do not open the collection first.
2. Same workspace, a **new** Codex conversation → new ChatGPT chat from the
   collection page (`conversation.projectUrl`). Ignore `session.url` unless
   you already saved it earlier in THIS Codex thread.
3. Different workspace → different Project and different connector.

**Open a chat in this Codex thread**

- If you already saved a ChatGPT chat URL earlier in THIS Codex conversation:
  `goto` that URL. Continue. No new chat. No HANDOFF.
- Else if `conversation.projectReady`: `goto` `conversation.projectUrl`.
  On that page, use the on-page composer (「{项目名}中的新聊天」 / "New chat
  in …"). Do not use the sidebar and do not `goto` `https://chatgpt.com/`.
  Confirm Chat mode (**In-app browser** §7). Boot prompt, then workspace_info
  with the **exact** `connectorName`. After the reply names this workspace,
  `c2c session set -w <ws> --mode project --project-url <collection> --url <chat> --connector-name "<connectorName>" --title "C2C <workspace name>"`.
  If this Codex thread is continuing a previous C2C task, send HANDOFF right
  after the boot prompt.
- Else: **Bind Project** first.

**Update it**: same `c2c session set --task / --iteration / --state` as long-chat.

**Wrong collection**: do not guess another Project. Tell the user the expected
workspace name, ask them to open the right collection, then say「已找到」.
Also offer「继续用长对话」. If they pick long-chat:
`c2c session set -w <ws> --mode long-chat` and use the long-chat path.
If the collection 404s or the new chat is not inside the Project, same choice.

**Saved chat 404s** (this thread): `goto` the collection, open a new chat
there, boot + HANDOFF from `session.checkpoint` (no logs) + workspace_info,
then save the new chat URL. Keep `--project-url`.

### Bind Project (user creates the collection once)

Do this for a new workspace, or when an existing user asks to switch to
Project. Do **not** click the ChatGPT sidebar to create the Project
(Computer Use is forbidden; IAB must not hunt that menu).

1. Tell the user exactly this (fill in the workspace name):

```
请在 ChatGPT 里新建一个项目，名字用「<workspaceName>」，记忆请选「仅限项目记忆」。

如果侧栏里看不到「项目」：把鼠标放在「聊天」上，点右边出现的三个点，选择「按项目整理」。

建好后会打开合集页面。看到页面后跟我说「好了」。
```

2. Wait for「好了」/ the collection page. Same iab tab: read the address bar.
   It must look like `https://chatgpt.com/g/g-p-…/project`. If it does not,
   ask them to open that project until it does. Then:
   `c2c session set -w <ws> --mode project --project-url <url> --connector-name "<connectorName>"`.

3. On that same collection page only, open 右上角 **… → 项目设置**.
   Do not click 分享. Do not add 来源 / files.
   - 记忆: 仅限项目记忆 (project-only). Leave 库访问权限 disabled.
   - 指令: paste **Project instructions** below (fill `{{…}}` from
     `workspace_info` / setup). Use the exact `connectorName` from setup.
     Never write the public / temporary address into 指令.
   Save and close settings.

4. Still on the collection page, create the first chat with the on-page
   composer, then boot + workspace_info as in setup step 5. Save the chat URL.

### Project instructions (paste into 项目设置 → 指令)

```
你负责这个工作目录的规划与复核，Codex 负责执行。自然语言沟通全部使用中文，
协议字段、代码、命令、路径和专有名词保留原样。

本项目只绑定：
- 工作目录名称：{{workspace_name}}
- 类型：{{project_type}}（{{languages}} / {{frameworks}}）
- 本机资料连接器（仅用此连接器）：{{connector_name}}

普通资料查询无需连接器，可按需联网查证并附来源，直接回答，不要求本机验证，
不返回编码计划。工程查询通过指定连接器读取必要资料，只回答，不执行修改。
读取本机资料时不要使用其他工作目录的连接器。若 workspace_info 返回不同工作
目录，停止该工程任务，不规划，不使用本项目记忆。

代码、git、diff 和获准读取的执行输出通过连接器读取，不要求粘贴文件或日志。
收到 EXECUTED 后，有可读 execution_output 时先列出再读取；受限时从 git 复核。
不要把仓库上传到本项目文件或来源。

事实冲突时依次相信：
1. 连接器读取的当前代码
2. 本聊天的 HANDOFF（当前目标、进展和下一步）
3. 本项目指令
4. 本项目记忆（长期架构信息；过时记忆不能覆盖当前证据）

本项目记忆仅用于本工作目录。收到 HANDOFF 后按摘要了解进展，重读必要代码，
从 NEXT_EXPECTED_STEP 继续。操作任务使用 C2C 控制消息，说明理由、涉及文件和
验证方法；不要空泛的一句结论，也不要冗长的数十步计划。普通查询不走执行循环。
```

## Workflow: coding task（"使用 cwc / Codex with ChatGPT 完成 XXX"）

Use for requested actions, including "查一下并修复". Query-only questions
never enter this loop. Start a workspace-bound conversation when moving from
a generic chat to execution unless this thread's chat is already bound to the
right workspace, in which case reuse it. Do not overwrite a different active task.

Protocol states sent to ChatGPT: INIT → PLAN → EXECUTING → EXECUTED → REVIEW → (PLAN | DONE | BLOCKED).
Local checkpoint states (session only, never a ChatGPT `STATE:` line):
`INIT`, `PLAN_RECEIVED`, `EXECUTING`, `EXECUTED_LOCAL`, `EXECUTED_SENT`, `DONE`, `BLOCKED`.
Do not invent `STATE: RESUME`. If the original chat is gone, send HANDOFF.
All control messages start with `[C2C]`. Keep Codex→ChatGPT messages under 1 KB.
ChatGPT's replies are expected to be substantive (see step 3). Docs: `docs/protocol.md`.

0. `c2c tunnel status -w <workspace> --json`. If `needsChoice`, follow
   **Connection choice** first (existing installs: ask once, then remember).
   Then `c2c doctor -w <workspace> --json` (auto-repairs). **Doctor gate:** if local
   is not green, do not open ChatGPT and do not send INIT. If
   `namedRepair.needed` is true, tell the user `namedRepair.userMessage`, run
   `c2c tunnel login --json` (their browser; Cloudflare exception), then doctor
   again. If `chatgptRepair.needed` is true, tell the user `chatgptRepair.userMessage`
   (one paragraph, no internals), run **Workflow: reconnect after address
   reclaim**, then doctor again and only continue when the gate is green.
   Generate task id: `c2c_` + 4 random hex chars — unless a checkpoint already
   has one (reuse that id; do not mint a second task).
1. `c2c session -w <workspace> --json`. Open ChatGPT on the same iab tab
   per **Conversation management** for `conversation.mode` (foreground +
   markHandoff). long-chat: saved chat, or `https://chatgpt.com/` if none.
   project: this thread's chat URL, or the collection page for a new chat,
   or **Bind Project** if `projectReady` is false. On a NEW conversation
   confirm Chat mode (**In-app browser** §7), then send the boot prompt from
   `docs/protocol.md` §Boot Prompt and the workspace_info check (name the
   exact `connectorName`). Confirm the reply names the current workspace
   before saving the session URL. Do not use the browser to re-read code MCP
   already provides. After sending a control message, wait per
   **In-app browser** §8.

   **Resume from `session.checkpoint` before any INIT.** Missing checkpoint
   (legacy session): continue as a normal new/continued loop. A browser/js
   timeout is not a lost task — claim the original tab; do not INIT, re-run,
   or resend EXECUTED just because a wait timed out.
   - `EXECUTED_SENT` + `waitingFor=GPT_REVIEW`: do not INIT, do not re-run,
     do not resend EXECUTED. Stay on the saved chat and wait for review. If
     that chat 404s: HANDOFF from checkpoint fields (no logs), then wait.
   - `EXECUTED_LOCAL`: local work is done; only send EXECUTED (record first
     if this iteration has no record yet). Do not re-run.
   - `EXECUTING`: not finished. Continue the current PLAN if you still have
     it; otherwise HANDOFF and ask ChatGPT to restate the last PLAN. Do not
     treat it as done and do not INIT a new task.
   - `PLAN_RECEIVED`: execute that plan. Do not INIT.
   - `INIT` / `waitingFor=GPT_PLAN`: claim the tab and wait. Do not resend INIT.
   - `DONE`: summarize to the user if needed; `c2c session set --clear-checkpoint`.
   - `BLOCKED`: surface ChatGPT's reason; do not INIT.
   Never re-pair, never recreate the connector, and never rewrite Project
   instructions just to resume.
2. Send INIT with the user's goal (skip when the checkpoint says not to):

```
[C2C]
STATE: INIT
TASK_ID: c2c_f81a
ITERATION: 0

GOAL:
<user's goal, one paragraph>

INSTRUCTION:
请通过当前工作目录的 Codex with ChatGPT 连接器检查工程，
用中文给出 C2C PLAN，说明理由、涉及文件和验证方法。
```

   Confirm the INIT message is visibly in that ChatGPT conversation (one cheap
   DOM check). If the page is Retry-only, recover per **In-app browser** §7
   first. Do not write the waiting checkpoint, and do not wait for PLAN, until
   that message is visible.
   Then:
   `c2c session set -w <ws> --task <id> --iteration 0 --state INIT --protocol-state INIT --waiting-for GPT_PLAN --goal "<short goal>" --next-step "wait for PLAN"`
3. Wait for ChatGPT's `STATE: PLAN` reply (**In-app browser** §8 — short DOM
   checks, same tab; do not treat a 5-minute browser timeout as failure).
   Read GOAL/ACTIONS/TESTS/SUCCESS_CRITERIA.
   A good PLAN also carries RATIONALE and concrete natural-language edit
   suggestions (which file, what to change, why). If the reply is a bare
   one-liner with no rationale or file-level guidance, ask once:
   "请用中文补充方案理由，以及各文件的具体修改建议。"
   Then:
   `c2c session set -w <ws> --protocol-state PLAN_RECEIVED --waiting-for none --next-step "execute PLAN"`
4. Execute the plan yourself with your own harness (your tools, your judgment;
   ChatGPT does not micro-manage tool calls).
   Before you start:
   `c2c session set -w <ws> --protocol-state EXECUTING --waiting-for none --next-step "finish PLAN then record"`
5. Record the execution so ChatGPT can read it via MCP. Metadata always:
   `c2c record -w <ws> --task c2c_f81a --iteration 1 --changed-files "src/a.ts,src/b.ts" --tests "27 passed" --exit-status ok`
   If this iteration ran a **test / build / lint / typecheck** command, also
   pass that command's output. Write stdout/stderr to a local temp file first,
   then:
   `c2c record … --command "pnpm test" --output-file <temp> --exit-code <n>`
   Record both success and failure. Do not record shell history, `.env`,
   keys, or unrelated dumps. Never paste that file (or any log) into ChatGPT.
   If the CLI says the output was not released, still send EXECUTED; ChatGPT
   reviews from git. Then:
   `c2c session set -w <ws> --iteration 1 --state EXECUTED --protocol-state EXECUTED_LOCAL --waiting-for none --next-step "send EXECUTED"`
6. Send EXECUTED (no diffs, no logs). Tell ChatGPT to use MCP, including
   `execution_output` when a readable item exists:

```
[C2C]
STATE: EXECUTED
TASK_ID: c2c_f81a
ITERATION: 1

RESULT:
本轮执行已完成。

CHANGED_FILES:
4

TESTS:
27 passed

请通过 MCP 独立检查工程和当前 git diff，并用中文反馈。
如果 execution_output 有本轮可读取的记录，请先列出再读取；
若记录受限，请从 git_diff 复核，不要索取日志正文。
```

   Then:
   `c2c session set -w <ws> --protocol-state EXECUTED_SENT --waiting-for GPT_REVIEW --next-step "wait for PLAN or DONE"`
7. ChatGPT reviews via MCP (`git_diff`, `read_file`, `test_status`,
   `execution_output`) and replies DONE / PLAN (next iteration) / BLOCKED.
8. Loop. Respect maxIterations (`.c2c.json`, default 12). At the limit, pause and ask
   the user: "已完成 12 轮协作，仍有未解决问题，是否继续？"
9. On DONE: summarize the result to the user in plain language.
   `c2c session set -w <ws> --state DONE --clear-checkpoint`
10. On BLOCKED: read ChatGPT's reason, fix what you can, or surface the single
    decision the user must make.
    `c2c session set -w <ws> --protocol-state BLOCKED --waiting-for USER --known-issues "<short reason>"`

## Workflow: disconnect（"断开 ChatGPT"）

1. `c2c unpair -w <workspace>` (revokes all tokens immediately).
2. Keep the connector configuration. Revoking access does not require
   deleting the plugin. Delete only if the user separately explicitly asks
   to remove it, never as a repair or reconnect step.
3. Tell the user: "已断开 ChatGPT 对该项目的访问。"

## Workflow: reconnect after address reclaim（地址变化，保留插件）

`chatgptRepair.needed` / `connectorAction: "update"` reports an address
change, not permission to delete or replace a plugin. This workflow applies
only when the task needs workspace access; general queries continue directly.

1. Keep the connector, Project, saved chat and checkpoint. Tell the user the
   address changed using `chatgptRepair.userMessage`. Respect the saved setup
   preference; manual fallback has the same no-deletion boundary.
2. On `https://chatgpt.com/plugins`, locate the exact existing `connectorName`.
   If the UI supports editing its server URL in place, update to the reported
   `mcpUrl`, then use the existing authorization flow if required. Mint a
   pairing code only when its pairing form is ready. Never copy credentials.
3. If in-place update is unavailable, preserve the plugin and report that
   workspace access is blocked by the stale address. Keep this unresolved
   mismatch in the task context/checkpoint until actual workspace verification
   succeeds; a later green doctor alone does not clear it. Do not delete/uninstall,
   create a replacement/duplicate, guess hidden endpoints, or repeatedly
   reconnect to the dead URL. Continue independent general queries. A stable
   address can be discussed as a separate configuration change, not applied
   as an automatic workaround.
4. After supported repair, doctor must be green and the same chat must pass
   workspace_info before resuming workspace work. A generic "couldn't connect"
   error is not proof the plugin must be replaced. Inspect the actual error
   and binding; do not create successive chats or plugins as a retry strategy.
5. If the existing chat is genuinely lost, use the normal conversation recovery
   and HANDOFF with the SAME connector. Never rewrite Project instructions
   merely because the chat changed.

## Workflow: repair（workspace access only）

1. For a general query, handle the ChatGPT page directly; do not enter this
   workflow. For workspace access, run `c2c doctor -w <workspace> --json`.
   Diagnose local connectivity separately from ChatGPT authorization. Keep
   the existing plugin; a browser timeout or generic account error alone
   does not justify restarting a healthy bridge, replacing a URL or pairing.
2. If `namedRepair.needed`, tell the user `namedRepair.userMessage`, run
   `c2c tunnel login --json`, then doctor again. Do not Delete the connector.
3. If `chatgptRepair.needed`, follow **reconnect after address reclaim**, then
   doctor again.
4. Otherwise apply the recovery map. Only involve the user for login / 2FA /
   CAPTCHA — one action.

## Recovery map

| Symptom | Action |
| --- | --- |
| Bridge not running | `c2c start` (doctor does this automatically) |
| Tunnel dead / URL unreachable / 全关掉后连接失效 | Workspace tasks: doctor, then existing-connector authorization or supported in-place URL update. If unavailable, preserve it and report the blocker. Never delete/recreate. General queries need no repair. |
| Collection page shows only Retry | Same iab tab: Retry once, then open the last working chat and click its Project link. Do not write INIT/EXECUTED waiting checkpoints until the message is visible. |
| ChatGPT tool call failed / 401 | Inspect the error first. For confirmed authorization failure at the same address, reauthorize the existing connector with a fresh pairing code. Generic tool errors are not proof of expired credentials; never delete/recreate. |
| Pairing code rejected/expired | `c2c pair --json` for a fresh code |
| Same explicit ChatGPT setup/reconnect browser configuration step fails twice after repair | Stop automating ChatGPT settings and use **Guided manual ChatGPT setup fallback**. Do not count browser/js timeout, loading/generating, or login/2FA waiting as failures. |
| Port conflict | handled automatically; never surface to the user |
| Every new chat “repairs” / cannot write the log or settings directory | `c2c sandbox-allow --json` (once). Do not ask the user. |
| cloudflared missing | install it yourself (brew/winget), then retry |
| Sidebar has no「项目」 | Ask the user to hover「聊天」, click the …, choose「按项目整理」 |
| Collection page is the wrong Project | Ask the user to open the named collection and say「已找到」, or accept long-chat |