# Mac で「朝、ローカルも自動で git pull」する

**背景:** Notion → GitHub の同期は **GitHub 上**で終わります。**Mac のフォルダ**を勝手に更新する機能は Git にないので、**この Mac から `git pull` を自動実行**します。

**おすすめの時刻:** GitHub Actions が **毎朝 4:00（JST）** に Notion を取り込んだあとで、**6:00（JST）** などに pull すると、仕事を始める前にローカルが揃いやすいです。

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
| **Cursor** | Cursor 自体が「起動したら pull」は**標準ではない**。上記の定期 pull で実質カバーする。 |

---

## 4. まとめ

- **GitHub:** Notion 同期済みの「正」  
- **Mac:** `launchd` + `scripts/git-pull-repo.sh` で **朝だけ自動 pull** が現実的  
- **Cursor:** 開いたときに最新が見えればよいなら、**朝の自動 pull** でほぼ足りる  
