# AI事業コンテキスト（SSOT）

このリポジトリは **AI伴走プログラム**まわりの**単一情報源（SSOT）**です。  
同じ事実を複数ファイルに書かないことを原則にし、**拡大時も「どこを直すか」が迷子にならない**構成にしています。

## タスク管理と「いまの現状」（Notion ＋ このリポ）

| 何の正か | どこ |
|----------|------|
| **締切・進捗・やること一覧（編集する場所）** | [**Notion：AIローンチ進捗管理**](https://www.notion.so/AI-33e2623b5cc0803e9959f49c7f8b3a52?source=copy_link) |
| **Notion の写し（自動・読み取り専用）** | [context/notion-tasks.generated.md](context/notion-tasks.generated.md)（[同期のセットアップ](docs/NOTION_SYNC_SETUP.md)） |
| **事業コンテンツ**（商品・経歴・ICP など） | 下記 `ssot/` |
| **Cursor / AI に渡す短いメモ（任意・手動）** | [context/current-phase.md](context/current-phase.md) |

Notion を更新すると、**GitHub Actions で `notion-tasks.generated.md` が更新される**（設定後）。Cursor では **`@context/notion-tasks.generated.md`** で最新タスク表を参照できる。

**Mac のフォルダまで自動で揃えたい:** Git は **リモート（GitHub）だけ**を更新するので、手元は **`git pull` が必要**。朝に自動化する手順は [docs/LOCAL_AUTO_PULL.md](docs/LOCAL_AUTO_PULL.md)（`launchd` + `scripts/git-pull-repo.sh`）。

## 運用ルール（1人運用向け）

1. **事実・数値・肩書・約束の文言は、該当する `ssot/*.md` だけを編集する。**  
   LP・提案書・AIへのプロンプト用メモに**同文を複製しない**（参照する）。
2. **経歴と実数の正本は常に `ssot/career.md`。** 他ファイルは「解釈・角度・約束」に留める。
3. **ICP（ペルソナ）は `ssot/persona-icp.md` のみ。** `career.md` の実話と矛盾させない。
4. **商品の週次・フローは `ssot/product-ai-accompany.md` のみ。** キャッチやゴールを変えたらここを先に直す。
5. 将来ファイルが増えても、**新規は `ssot/` 配下に置き、下の「ファイル地図」に1行追加する**（検索の入口を増やしすぎない）。
6. **タスクの締切・完了は Notion が正。** リポジトリには [context/notion-tasks.generated.md](context/notion-tasks.generated.md) が **自動同期**で追従する（手で編集しない）。自分用の一言メモは [context/current-phase.md](context/current-phase.md)。

## ファイル地図（どこに何があるか）

| ファイル | 中身 |
|----------|------|
| [context/notion-tasks.generated.md](context/notion-tasks.generated.md) | Notion タスク表の自動スナップショット（**編集禁止**） |
| [context/current-phase.md](context/current-phase.md) | いまのフェーズ・焦点の短いメモ（任意・手動） |
| [docs/NOTION_SYNC_SETUP.md](docs/NOTION_SYNC_SETUP.md) | Notion ↔ GitHub 自動同期のセットアップ手順 |
| [docs/LOCAL_AUTO_PULL.md](docs/LOCAL_AUTO_PULL.md) | Mac で朝に自動 `git pull` する（任意） |
| [ssot/brand.md](ssot/brand.md) | 表示名・事業コンセプト |
| [ssot/career.md](ssot/career.md) | **経歴・実績・公表数値の正本** |
| [ssot/profile.md](ssot/profile.md) | USP・キャラ・約束（事実の重複なし） |
| [ssot/persona-icp.md](ssot/persona-icp.md) | 対象者・ペルソナ |
| [ssot/product-ai-accompany.md](ssot/product-ai-accompany.md) | AI伴走プログラム（1ヶ月）の設計 |

## よくある作業

- **プロフィールの話し方を変えたい** → `ssot/profile.md`
- **実績の数字や肩書を変えたい** → `ssot/career.md`（ここだけ）
- **誰に売るかを変えたい** → `ssot/persona-icp.md`
- **プログラムの週の中身を変えたい** → `ssot/product-ai-accompany.md`
- **ブランド名・事業の一文を変えたい** → `ssot/brand.md`

## 拡大するとき

- 新しい商品・プログラムが増えたら **`ssot/product-<名前>.md`** を追加する（例: `product-3month.md`）。
- チーム・協業などで境界が増えたら **`ssot/` にドメイン名のファイルを足す**だけにし、README のファイル地図に1行追加する。
