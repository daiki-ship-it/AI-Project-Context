# Notion → Git 自動同期のセットアップ（手順だけ）

ゴール：**Notion のタスク表を、Git 上の `context/notion-tasks.generated.md` に自動で写す。**  
ここでは「なぜそうなるか」より **やることだけ** を順番に書く。

---

## 全体の流れ（3行）

1. Notion 側で「この連携を許可する鍵」と「見に行くデータベース」を決める。  
2. GitHub に「鍵」と「データベースの住所」を秘密で渡す。  
3. GitHub が決まった時間に Notion を読みに行き、ファイルを書き換えて保存する。

---

## ステップ 1：Notion で「インテグレーション」を作る（鍵を作る）

1. ブラウザで [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations) を開く。  
2. **「新しいインテグレーション」** を押す。  
3. 名前は例：`GitHub同期`（何でもよい）。  
4. ワークスペースはいつも使っているものを選ぶ。  
5. 作成したら、画面に出る **「内部インテグレーションシークレット」**（長い文字列）をコピーする。  
   - これが **NOTION_TOKEN**（秘密の鍵）。**誰にも見せない。**

---

## ステップ 2：データベースに「鍵の権限」を付ける

1. Notion で、**同期したい表（データベース）**を開く。  
   - **重要:** 親ページではなく、**表そのもの**の画面にすること。  
   - 表の右上「⋯」→ **「コネクト」** または **「接続」** で、さきほど作った `GitHub同期` を選ぶ。  
2. これで「この鍵が、この表を読める」ようになる。

---

## ステップ 3：データベースの ID をコピーする（住所）

1. 同じく **データベースを表として開いた状態**で、ブラウザのアドレスバーの URL をコピーする。  
2. URL はだいたい次の形：  
   `https://www.notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...`  
3. **`xxxxxxxx...` の32文字**がデータベース ID。  
   - ハイフンが入っていても入っていなくてもよい。スクリプトが直す。

**うまくいかないとき:** URL が「ページ」で、中に表が埋め込まれているだけのことがある。  
- **おすすめ:** 表を **フルページ表示** にしてから URL をコピーし、その32文字を `NOTION_DATABASE_ID` にする。  
- **補助:** リポジトリの `scripts/notion-sync.mjs` は、**ページID** が渡された場合に **ページ直下の表（データベース）を自動検出**して置き換える。それでも失敗する場合は、表がページの奥深くにある・複数あるなどが考えられる。

---

## ステップ 4：GitHub にリポジトリを作って、このフォルダを push する

まだなら：

1. GitHub で **新しいリポジトリ**を作る（空でよい）。  
2. この `AI事業コンテクスト` フォルダでターミナルを開き、次を実行（例。URL は自分のリポジトリに合わせる）。

```bash
cd "/Users/daikisato/AI事業コンテクスト"
git init
git add .
git commit -m "Initial commit: SSOT + Notion sync"
git branch -M main
git remote add origin https://github.com/<あなたのユーザー名>/<リポジトリ名>.git
git push -u origin main
```

---

## ステップ 5：GitHub に秘密情報を登録する

1. GitHub でそのリポジトリを開く。  
2. **Settings → Secrets and variables → Actions** を開く。  
3. **New repository secret** を2回使う。

| Name | Value |
|------|--------|
| `NOTION_TOKEN` | ステップ1でコピーした **シークレット** |
| `NOTION_DATABASE_ID` | ステップ3の **32文字のID**（ハイフンあってもなくても可） |

---

## ステップ 6：Actions が書き込めるように設定する

「General」という文字がメニューに**出ないことがあります**（UI の言語や GitHub の更新で、サイドバーの並びが違うため）。**やりたいことは次の1つだけ**です。

- **`GITHUB_TOKEN` に「リポジトリへ書き込み」を許可する**（＝ Workflow permissions を Read and write にする）

### いちばん確実：URL で開く

ブラウザのアドレスバーに、**自分のリポジトリ**向けに次を入れて開く（`OWNER` / `REPO` を置き換え）。

`https://github.com/OWNER/REPO/settings/actions`

例（このプロジェクトを GitHub にそのまま置いている場合）:

`https://github.com/daiki-ship-it/AI-Project-Context/settings/actions`

このページを**下までスクロール**し、**Workflow permissions**（日本語だと「ワークフローの権限」など）のブロックを探す。

- **Read and write permissions**（読み取りと書き込み）を選ぶ  
- **Save** を押す  

### メニューから辿る場合

1. リポジトリの **Settings**（設定）を開く。  
   - タブが見えないときは、リポジトリ名の横の **…** メニューから **Settings** を選ぶ。  
   - **自分のリポジトリの管理者**でないと Settings が出ません。
2. 左サイドバーの **「Code and automation」／コードと自動化** のあたりにある **Actions** をクリックする。  
3. サブメニューに **General／一般** があればそれを選ぶ。**なくても**、いま開いているページが Actions の「一般」設定のことが多い。  
4. ページ内の **Workflow permissions** で **Read and write permissions** → **Save**。

### それでも見つからないとき

- 組織のリポジトリだと、**組織のポリシー**で上書きされ、自分では変更できないことがあります（組織の管理者に確認）。  
- 個人リポジトリでも、**別の場所に移動している**場合は [公式ドキュメント（リポジトリの Actions 設定）](https://docs.github.com/ja/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository) の「`GITHUB_TOKEN` の権限を設定する」付近を参照する。

---

## ステップ 7：手元で一度テストする（おすすめ）

ターミナルで：

```bash
cd "/Users/daikisato/AI事業コンテクスト"
export NOTION_TOKEN="ステップ1のシークレット"
export NOTION_DATABASE_ID="ステップ3のID"
npm install
node scripts/notion-sync.mjs
```

- 成功すると `context/notion-tasks.generated.md` が表つきで上書きされる。  
- エラーが出たら、ステップ2（接続）とステップ3（IDがデータベースのものか）を疑う。

---

## ステップ 8：GitHub で自動同期を動かす

1. リポジトリの **Actions** タブを開く。  
2. 左の **Notion sync** を選ぶ。  
3. **Run workflow** で手動実行。  
4. 緑で終われば、そのあと **コードの `context/notion-tasks.generated.md`** が更新されているはず。

**定期実行:** `.github/workflows/notion-sync.yml` の `schedule` は **30分ごと（UTC）** にしてある。変えたければ cron を編集する。

---

## よくあるつまずき

| 症状 | 見るところ |
|------|------------|
| `object_not_found` | データベース ID が違う、またはステップ2の接続ができていない |
| 行数0 | 表が本当に空、または別のデータベースの ID を見ている |
| push で失敗 | ステップ6の Workflow permissions |

---

## このリポジトリ内の役割の整理

| ファイル | 役割 |
|----------|------|
| `context/notion-tasks.generated.md` | **Notion から自動。** 手で直さない。 |
| `context/current-phase.md` | **自分用メモ。** 自動では上書きしない。 |
| `ssot/*.md` | **事業の正本。** Notion とは別。 |
