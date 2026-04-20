/**
 * Notion データベースを取得し、Markdown を生成する。
 * 環境変数: NOTION_TOKEN, NOTION_DATABASE_ID（必須）
 */
import "dotenv/config";
import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "context", "notion-tasks.generated.md");

function normalizeDatabaseId(raw) {
  const s = String(raw).replace(/-/g, "").trim();
  if (!/^[a-f0-9]{32}$/i.test(s)) {
    throw new Error(
      "NOTION_DATABASE_ID が不正です。Notion のデータベースURLの32文字のIDを使ってください。"
    );
  }
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

function plainFromRich(rich) {
  if (!rich || !Array.isArray(rich)) return "";
  return rich.map((t) => t.plain_text || "").join("");
}

function propertyToString(prop) {
  if (!prop) return "";
  switch (prop.type) {
    case "title":
      return plainFromRich(prop.title);
    case "rich_text":
      return plainFromRich(prop.rich_text);
    case "number":
      return prop.number != null && prop.number !== undefined ? String(prop.number) : "";
    case "checkbox":
      return prop.checkbox ? "はい" : "いいえ";
    case "date":
      if (!prop.date) return "";
      const start = prop.date.start || "";
      const end = prop.date.end ? ` → ${prop.date.end}` : "";
      return start + end;
    case "select":
      return prop.select?.name ?? "";
    case "status":
      return prop.status?.name ?? "";
    case "multi_select":
      return (prop.multi_select || []).map((x) => x.name).join(", ");
    case "url":
      return prop.url || "";
    case "email":
      return prop.email || "";
    case "phone_number":
      return prop.phone_number || "";
    case "formula":
      const f = prop.formula;
      if (!f) return "";
      if (f.type === "string") return f.string ?? "";
      if (f.type === "number") return f.number != null ? String(f.number) : "";
      if (f.type === "boolean") return f.boolean ? "はい" : "いいえ";
      if (f.type === "date") {
        if (!f.date) return "";
        return (f.date.start || "") + (f.date.end ? ` → ${f.date.end}` : "");
      }
      return `(formula:${f.type})`;
    case "rollup":
      return "(ロールアップ: Notion で展開)";
    case "relation":
      return "(関連)";
    case "people":
      return (prop.people || []).map((p) => p.name || p.id).join(", ");
    default:
      return `(${prop.type})`;
  }
}

function escapeCell(s) {
  return String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function collectRows(pages) {
  const rows = [];
  const columnOrder = [];
  const seen = new Set();

  for (const page of pages) {
    const props = page.properties || {};
    for (const name of Object.keys(props)) {
      if (!seen.has(name)) {
        seen.add(name);
        columnOrder.push(name);
      }
    }
  }

  columnOrder.sort((a, b) => {
    const ta = pages[0]?.properties?.[a]?.type === "title";
    const tb = pages[0]?.properties?.[b]?.type === "title";
    if (ta && !tb) return -1;
    if (!ta && tb) return 1;
    return a.localeCompare(b, "ja");
  });

  for (const page of pages) {
    const props = page.properties || {};
    const cells = columnOrder.map((name) =>
      escapeCell(propertyToString(props[name]))
    );
    rows.push(cells);
  }

  return { columnOrder, rows };
}

function buildMarkdown(databaseId, pages) {
  const syncedAt = new Date().toISOString();
  const { columnOrder, rows } = collectRows(pages);

  if (columnOrder.length === 0) {
    return `# Notion タスク一覧（自動生成）

**同期日時:** ${syncedAt}（UTC）

データベース \`${databaseId}\` から取得しましたが、**行が0件**か、プロパティが読み取れませんでした。  
Notion で「接続（インテグレーション）」がデータベースに付いているか確認してください。

`;
  }

  const header = ["| " + columnOrder.map((c) => escapeCell(c)).join(" | ") + " |"];
  const sep = ["| " + columnOrder.map(() => "---").join(" | ") + " |"];
  const body = rows.map((r) => "| " + r.join(" | ") + " |");

  return `# Notion タスク一覧（自動生成）

**同期日時:** ${syncedAt}（UTC）  
**データベースID:** \`${databaseId}\`（ページIDを渡した場合は、自動で表のIDに置き換えた可能性があります）

> このファイルは \`scripts/notion-sync.mjs\` で上書きされます。手で編集しないでください。

${header.join("\n")}
${sep.join("\n")}
${body.join("\n")}
`;
}

/**
 * @param {import("@notionhq/client").Client} notion
 * @param {string} databaseId
 */
async function queryAllDatabasePages(notion, databaseId) {
  const pages = [];
  let cursor = undefined;
  do {
    const res = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

/**
 * ページIDのとき、その直下の child_database を1つ探す（表がページに埋め込まれているケース）
 * @param {import("@notionhq/client").Client} notion
 * @param {string} pageId
 */
async function findFirstChildDatabaseId(notion, pageId) {
  let cursor = undefined;
  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const block of res.results) {
      if (block.type === "child_database") {
        return block.id;
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return null;
}

function isPageNotDatabaseError(e) {
  const msg = String(e?.message || "");
  let bodyStr = "";
  try {
    bodyStr = e?.body ? JSON.stringify(e.body) : "";
  } catch {
    bodyStr = "";
  }
  return (
    e?.code === "validation_error" &&
    (msg.includes("not a database") ||
      msg.includes("is a page") ||
      bodyStr.includes("not a database") ||
      bodyStr.includes("is a page"))
  );
}

async function main() {
  const token = String(process.env.NOTION_TOKEN || "").trim().replace(/^["']|["']$/g, "");
  const rawId = String(process.env.NOTION_DATABASE_ID || "").trim().replace(/^["']|["']$/g, "");
  if (!token || !rawId) {
    console.error("環境変数 NOTION_TOKEN と NOTION_DATABASE_ID が必要です。");
    console.error(
      "GitHub の場合: Settings → Secrets and variables → Actions に両方あるか確認してください。"
    );
    process.exit(1);
  }

  let databaseId = normalizeDatabaseId(rawId);
  const notion = new Client({ auth: token, notionVersion: "2022-06-28" });

  let pages;
  try {
    pages = await queryAllDatabasePages(notion, databaseId);
  } catch (e) {
    if (isPageNotDatabaseError(e)) {
      console.error(
        "NOTION_DATABASE_ID が「ページ」のIDでした。ページ直下のデータベース（表）を探します…"
      );
      const childDbId = await findFirstChildDatabaseId(notion, databaseId);
      if (!childDbId) {
        throw new Error(
          "このページの直下に「表（データベース）」が見つかりませんでした。Notion で表をフルページ表示にして URL の ID を Secrets に入れるか、ページ内に表を置いてください。"
        );
      }
      databaseId = childDbId;
      console.error("データベースIDに置き換えました:", databaseId);
      pages = await queryAllDatabasePages(notion, databaseId);
    } else {
      throw e;
    }
  }

  const md = buildMarkdown(databaseId, pages);
  writeFileSync(OUT, md, "utf8");
  console.log("Wrote:", OUT, `(${pages.length} rows)`);
}

main().catch((e) => {
  console.error("--- Notion sync 失敗 ---");
  if (e && typeof e === "object") {
    if ("code" in e) console.error("Notion code:", e.code);
    if ("status" in e) console.error("HTTP status:", e.status);
    if ("body" in e)
      try {
        console.error("Notion body:", JSON.stringify(e.body, null, 2));
      } catch {
        console.error("Notion body:", e.body);
      }
    if (e.message) console.error("message:", e.message);
  } else {
    console.error(e);
  }
  console.error("");
  console.error("よくある原因:");
  console.error("- object_not_found: IDが違う／表に「接続」していない");
  console.error("- validation_error (page not database): 表のURLのIDを使うか、スクリプトが直下の表を自動検出できるようにする");
  console.error("- unauthorized: NOTION_TOKEN が違う・無効");
  process.exit(1);
});
