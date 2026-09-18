# C2C Agent Protocol

Control plane: Computer Use (tiny structured messages typed into the ChatGPT UI).
Data plane: MCP (ChatGPT pulls files, diffs, search results itself).

Never mix the two: control messages carry state, never content.

## Query-only routing

The Skill recognizes `cwc` case-insensitively and routes informational requests
before any local setup. General queries use ordinary ChatGPT messages and
answers, with web search when needed. They require no workspace, Project,
connector, doctor, pairing, coding boot prompt or model/effort selection.
They do not enter the state machine below or change a coding checkpoint.

Workspace-specific questions may use the existing read-only connector but
still do not execute a plan, run tests, mutate project files, auto-update or
repair configuration. Missing access is reported; repair requires an explicit
action request. Wait for an in-progress reply before sending a query. A suggestion
in an answer does not authorize execution. Explicit action requests retain
the full INIT → PLAN → EXECUTED → REVIEW loop.

Reuse the chat bound to this Codex thread. A new workspace chat reuses the
same connector; never delete/recreate a connector because a chat changed or
a tool call failed. General query chats are tracked in thread context and
must not replace a workspace session pointer. See the Skill for route details.

## States (action requests only)

```
INIT → PLAN → EXECUTING → EXECUTED → REVIEW → PLAN | DONE | BLOCKED | ERROR
```

| State | Sender | Meaning |
| --- | --- | --- |
| INIT | Codex | New task; asks ChatGPT to inspect + plan |
| PLAN | ChatGPT | Executable plan for the next iteration |
| EXECUTING | Codex | (optional) execution in progress |
| EXECUTED | Codex | Iteration finished; metadata only |
| REVIEW | ChatGPT | (implicit) ChatGPT is inspecting via MCP |
| DONE | ChatGPT | Success criteria met |
| BLOCKED | ChatGPT | Cannot proceed; contains reason |
| ERROR | either | Protocol/infrastructure failure |
| HANDOFF | Codex | Continuation brief sent to a replacement conversation |

There is no `STATE: RESUME`. If Codex restarts mid-task, it reads a **local
checkpoint** on the session file (`protocolState`, `waitingFor`, goal, issues,
next step). Those values are not ChatGPT protocol states. ChatGPT still sees
only the table above. If the original chat is gone, Codex sends HANDOFF
built from the checkpoint (never from logs).

Local checkpoint values (session only):

| Checkpoint | Meaning |
| --- | --- |
| `INIT` | INIT sent; waiting for PLAN |
| `PLAN_RECEIVED` | PLAN in hand; not finished executing |
| `EXECUTING` | Codex is applying the current PLAN |
| `EXECUTED_LOCAL` | Recorded locally; EXECUTED not yet typed |
| `EXECUTED_SENT` | EXECUTED typed; waiting for review |
| `DONE` / `BLOCKED` | Terminal; DONE should `--clear-checkpoint` |

Legacy sessions without a checkpoint keep the old loop. The first normal
iteration after this version writes a checkpoint automatically.

Do not re-pair, recreate the connector, or rewrite Project instructions
just to resume.

## Communication language

All natural-language requests, plans, reviews, answers and user-facing updates
use Chinese. Keep `[C2C]`, header keys, state values, code, commands, paths and
URLs unchanged. Translate prose in legacy examples before sending it. Explicit
requests for a different output language apply to the requested content only.

## Message format

Every control message starts with `[C2C]` and key-value headers, then sections.
Keep messages < 1 KB. No diffs, no logs, no file bodies.

### INIT (Codex → ChatGPT)

```
[C2C]
STATE: INIT
TASK_ID: c2c_f81a
ITERATION: 0

GOAL:
实现深色模式。

INSTRUCTION:
请通过 Codex with ChatGPT MCP 检查当前工程，
用中文给出供 Codex 执行的实施方案。
```

### PLAN (ChatGPT → Codex)

```
[C2C]
STATE: PLAN
TASK_ID: c2c_f81a
ITERATION: 1

GOAL:
...

RATIONALE:
...

ACTIONS:
1. ...
2. ...
3. ...

FILES_LIKELY_INVOLVED:
...

TESTS:
...

SUCCESS_CRITERIA:
...
```

Plans must be finite, concrete, executable. Not 40-step epics.

### EXECUTED (Codex → ChatGPT)

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

Before sending EXECUTED, Codex records the iteration:
`c2c record --task c2c_f81a --iteration 1 --changed-files ... --tests ... --exit-status ok`
and, when a test/build/lint/typecheck was run, `--command` plus `--output-file`.
ChatGPT reads metadata via `execution_summary` / `test_status`. Command output
is a separate opt-in: `execution_output` (`list` then `read`). Codex nominates
the log; a **local sanitizer** decides whether ChatGPT may see the body
(tokens/paths redacted; private keys withheld entirely; size/line caps).
Restricted items appear in `list` with no body. Old records without output
stay valid. Never paste logs into the control message.

### DONE / BLOCKED (ChatGPT → Codex)

```
[C2C]
STATE: DONE
TASK_ID: c2c_f81a
ITERATION: 3

SUMMARY:
...
```

```
[C2C]
STATE: BLOCKED
TASK_ID: c2c_f81a
ITERATION: 3

REASON:
...

NEEDS:
...
```

### HANDOFF (Codex → new ChatGPT conversation)

`c2c session --json` → `conversation.mode` chooses how chats are grouped.

- **long-chat:** one long-lived C2C conversation per workspace. Codex opens a
  replacement chat only when the user asks, the old chat lags, or the chat was
  lost.
- **project:** one ChatGPT Project (collection) per workspace. A new Codex
  conversation starts a new chat **inside that Project**. The same Codex
  conversation keeps using its saved chat URL.

Right after the boot prompt, Codex sends a HANDOFF so the new chat can
continue — a brief, never a data dump (the new chat re-reads code via MCP).
Project instructions and project-only memory hold durable workspace identity.
HANDOFF still wins for the current task:

Trust order: connector (current code) > HANDOFF (this task) > Project
instructions > Project memory.

```
[C2C]
STATE: HANDOFF
TASK_ID: c2c_f81a
ITERATION: 4

ORIGINAL_GOAL:
实现深色模式，并持久化用户偏好。

PROGRESS:
- 第 1–2 轮：主题状态和切换按钮已实现，复核通过。
- 第 3 轮：已加入持久化；复核发现加载时闪烁。

CURRENT_STATE:
EXECUTED（第 4 轮修复已应用，尚待复核）。

KNOWN_ISSUES:
需要验证 src/theme/ThemeProvider.tsx 的加载闪烁修复。

NEXT_EXPECTED_STEP:
请通过 git_diff 独立复核第 4 轮，并用中文回复 PLAN 或 DONE。
```

## Loop limits

`maxIterations` (default 12, configurable in `.c2c.json`). When reached, Codex
pauses and asks the user whether to continue.

## Boot Prompt

Send once at the start of a new coding conversation, not a query-only chat:

```
你是 Codex 编码任务的规划与复核助手。Codex 负责执行，你负责分析、规划和复核。
自然语言沟通全部使用中文；C2C 协议字段、代码、命令、路径和专有名词保留原样。

明确标注“仅查询”的请求只需回答，不要给出待执行计划。普通查询不需要本机
验证或连接器，可按需联网查证；涉及工程的查询只读取必要资料，不执行修改。

工程资料通过当前项目指定的“Codex with ChatGPT”连接器读取：
1. 不要求 Codex 粘贴文件、diff 或日志。只读取当前任务需要的文件。
2. 规划前检查实际代码和 git 状态，给出有限、具体、可执行的 PLAN。
3. Codex 使用自己的工具执行；收到 EXECUTED 后独立检查真实 diff。
4. execution_output 有可读取的本轮记录时先列出再读取；受限则从 git 复核。
5. 不因 Codex 声称成功就假定实施完成，按成功标准判断，避免无关重写。
6. 操作任务返回 C2C 结构化控制消息。PLAN 和复核需说明理由、涉及文件、
   具体修改建议及验证方法；不要只有一句结论，也不要拆成冗长计划。
7. HANDOFF 表示继续已有任务：按摘要了解进展，重新读取必要代码，再从
   NEXT_EXPECTED_STEP 继续。
8. 只用本项目指定的连接器读取本机资料，不使用其他工作目录的连接器。
9. 普通查询直接中文回答，不要求插件，不返回编码计划或执行记录。

```

## Project instructions

New workspaces store durable identity in the ChatGPT Project settings
(指令), not in every boot prompt. The Skill fills this template once.
Never put a public or temporary URL in the instructions — only the
connector **name**.

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
