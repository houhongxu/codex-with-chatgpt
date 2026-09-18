import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { writeLastEndpoint, reclaimUserMessage } from "../src/config/endpoint.js";
import { Workspace } from "../src/workspace/manager.js";
import { cleanup, isolateStateDir, makeTmpDir } from "./helpers.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("doctor preserves unavailable connectors in its complete output", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs) cleanup(dir);
    dirs.length = 0;
    delete process.env.C2C_STATE_DIR;
  });

  it.each([false, true])("does not recommend replacement (json=%s)", (json) => {
    const stateDir = isolateStateDir();
    const workspaceRoot = makeTmpDir("doctor-workspace");
    const codexHome = makeTmpDir("doctor-codex");
    dirs.push(stateDir, workspaceRoot, codexHome);
    const workspace = new Workspace(workspaceRoot);
    const connectorName = "Codex with ChatGPT · Existing";
    writeLastEndpoint({
      workspaceId: workspace.id, port: 48765, connectorName,
      publicUrl: "https://old.example.test", mcpUrl: "https://old.example.test/mcp",
    });
    // No runtime exists: --no-fix exercises repair advice without starting services.
    const result = spawnSync(process.execPath,
      ["--import", "tsx", path.join(root, "src/cli/index.ts"), "doctor",
       "--no-fix", "-w", workspaceRoot, ...(json ? ["--json"] : [])],
      { cwd: root, encoding: "utf8", env: { ...process.env,
        C2C_STATE_DIR: stateDir, CODEX_HOME: codexHome }, timeout: 30000 });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(json ? 0 : 1);
    expect(result.stdout).not.toContain("删除并重新添加");
    expect(result.stdout).not.toContain("本地已就绪");
    expect(result.stdout).toContain(reclaimUserMessage(connectorName));
    if (json) {
      const payload = JSON.parse(result.stdout);
      expect(payload.chatgptRepair).toMatchObject({ needed: true, connectorName,
        connectorAction: "update", userMessage: reclaimUserMessage(connectorName) });
      expect(payload.repairs).toEqual([]);
    }
  }, 40000);
});
