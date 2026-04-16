# 手元のフォルダを GitHub に追従させる（`git pull`）

**背景:** Notion → GitHub の同期は **GitHub 上**で終わります。**Mac のフォルダ**を勝手に更新する機能は Git にないので、**どこかのタイミングで `git pull` が必要**です。

## いちばん手軽：Cursor を開いたときに自動 `git pull`（おすすめ）

このリポジトリには **`.vscode/tasks.json`** があり、**ワークスペース（このフォルダ）を Cursor で開いた直後**に `git pull --ff-only` が走る設定になっています。

1. Cursor で **このリポジトリのルート**（`AI事業コンテクスト` 自体）をフォルダとして開く。  
2. 初回だけ「自動タスクを許可しますか？」のような確認が出たら **許可**する。  
3. 以降、**Cursor を開くたび**に手元が GitHub の `main` に追従しやすくなる（ネットワークと Git の認証が通る前提）。

**注意:** 親フォルダだけ開いていると `${workspaceFolder}` がずれるので、**必ずこのリポジトリのフォルダをワークスペースのルートに**してください。

### 「開き直したのに何も出ない」とき

- **成功しているが見えない**のではなく、**そもそも自動実行が走っていない**ことがあります（Cursor のバージョンによっては `folderOpen` タスクに未対応のことがある）。  
- **手動で同じタスクを試す:** `Cmd + Shift + P` → **「Tasks: Run Task」** → **「Sync: git pull（GitHub の最新を手元に取り込む）」** を選ぶ。ターミナルに `=== 開いた直後の git pull ===` と出れば設定は生きている。  
- **Cursor の設定:** **「Tasks: Allow Automatic Tasks」** がオフだと、フォルダを開いても自動タスクが動かない。コマンドパレットで **「Tasks: Manage Automatic Tasks in Folder」** を開き、**Allow** を選ぶ。  
- いまの `.vscode/tasks.json` は **実行するとターミナルが開く**設定にしてあるので、自動が効いていれば**開いた直後にターミナルが一瞬表示**される。

---

## 別手段：朝だけ Mac が自動で pull（launchd）

Cursor を開かない日でも手元を揃えたい場合。GitHub Actions が **毎朝 4:00（JST）** に取り込んだあと、**6:00（JST）** などに `git pull` する想定で使う。

---

## 1. 手動でスクリプトが動くか試す

ターミナルで（パスは自分の環境に合わせる）:

```bash
chmod +x "/Users/daikisato/AI事業コンテクスト/scripts/git-pull-repo.sh"
"/Users/daikisato/AI事業コンテクスト/scripts/git-pull-repo.sh"
```

- **SSH（`git@github.com:...`）** で push/pull している場合、**鍵のパスフレーズ**を毎回聞かれると自動化できません。macOS の **キーチェーンに SSH 鍵を保存**するか、**HTTPS + credential helper** にすると無人で動きやすいです。

---

## 2. launchd で毎朝実行（Mac 起動中なら）

1. 下の `plist` を **`~/Library/LaunchAgents/com.ai-project-context.gitpull.plist`** として保存する。  
2. **`YOUR_REPO_PATH`** を、このリポジトリの**実際のフルパス**に置き換える（例: `/Users/daikisato/AI事業コンテクスト`）。  
3. **`Hour` / `Minute`** は **Mac のローカル時刻**（日本なら JST）で指定する。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.ai-project-context.gitpull</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>YOUR_REPO_PATH/scripts/git-pull-repo.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>6</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>/tmp/ai-project-context-gitpull.out.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/ai-project-context-gitpull.err.log</string>
</dict>
</plist>
```

4. 読み込み:

```bash
launchctl load ~/Library/LaunchAgents/com.ai-project-context.gitpull.plist
```

5. 止めたいとき:

```bash
launchctl unload ~/Library/LaunchAgents/com.ai-project-context.gitpull.plist
```

---

## 3. 注意（これでも「完全自動」には限界がある）

| こと | 説明 |
|------|------|
| **スリープ中** | 指定時刻に Mac が寝ていると、その回は**飛ぶ**ことがある。起動後に手動 `git pull` するか、**ログイン時に実行**する plist に変える手もある。 |
| **未コミットの変更** | ローカルで編集したままだと `git pull --ff-only` が**失敗**することがある。基本は **このリポジトリでは pull 専用・編集は別ブランチ**などにすると安全。 |
| **Cursor の自動タスク** | 初回だけ「自動タスクを許可」が必要。ワークスペースの**信頼**や Git の認証で止まることがある。 |

---

## 4. まとめ

- **GitHub:** Notion 同期済みの「正」  
- **手元を Cursor 起動時に追従:** **`.vscode/tasks.json` の folderOpen** が第一候補  
- **補助:** `launchd` で朝に pull（Cursor を開かない日用）  
