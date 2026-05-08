# 品質基準（SSOT）

> NG・製品の事実・推敲比較はここが正。チェックリストの項目列挙・減点表・レビューMarkdownの骨子は [agents/reviewer-rubric.md](../agents/reviewer-rubric.md)。`/チェック` の手順は [agents/reviewer.md](../agents/reviewer.md)。

---

## 絶対NGパターン

以下が含まれている場合、即座に修正を求める：

| NG | 理由 | 検出パターン | 代替表現 |
|---|------|-------------|---------|
| Markdown太字 `**` | 体裁統一・貼り付け先で崩れやすい | 連続する `**` で囲んだ箇所 | 見出し・箇条書き・「」で強調 |
| 競合批判 | 信頼を損なう | 「〜より優れている」「〜はダメ」 | 「〜も良いですが、今回は〜」 |
| 誇張表現 | 40-60代に響かない | 「神」「やばい」「最強」「爆速」 | 「かなり便利」「おすすめ」 |
| 不安煽り | ブランドに合わない | 「大変なことに」「危険」「知らないと損」 | 「備えておくと安心」 |
| マウント | 距離が生まれる | 「私はできる」「当然」「常識」 | 「私みたいなズボラでも」 |
| 専門用語無説明 | 離脱につながる | API, UI, UX, クラウド等 | 必ず噛み砕いて説明 |

---

## 製品・アプリの事実（誤情報・未確認断定の禁止）

台本では、確認していない状態でアプリの有無・入手方法・画面上の名前を断定しない。OS やブランド・アプリの構成は変更されやすいため、ツール依存の回では次を守る。

1. 執筆前：Microsoft / Google / Apple など公式ヘルプ、または開発元の現在の製品ページを参照する（検索結果の要約だけで済ませず、本文の主張どおりか本文を自分で読む）。
2. 本文では：変更されうる文言（ボタンの位置・アプリの版）は「画面上で確認して」「自分の環境のアプリでは」と逃がす余地を残す。
3. 典型例（Microsoft Sticky Notes × Android／SSOT に明記）  
   Android で「Sticky Notes と名のついただけの単体アプリ」を入れるだけで Windows の付箋一覧に触れると断定するような書き方は誤解を招く。公式説明では Android は主に Microsoft OneNote 内の付箋（Sticky Notes）から利用する案内がある。収録では実機または最新公式の説明で確認する。  
   参照URL（執筆時に本文を確認すること）：  
   https://support.microsoft.com/office/see-your-sticky-notes-on-other-devices-and-the-web-cf4bacd0-c042-46fd-9077-ca8c82dc0236  
   https://support.microsoft.com/office/troubleshoot-sticky-notes-89b1bb37-ef52-4e56-a066-418d7ea0f112  
   https://support.microsoft.com/office/where-did-my-sticky-notes-go-170fcaa4-99c1-4c21-98ff-83c8f97017f7  

チェック側（reviewer）は、製品説明として公式と矛盾する断定を検出したら重大指摘として扱う。

---

## 推敲比較（キャリブレーション）時の絶対ルール

以下は、推敲比較を行うすべてのエージェント・チャット指示に準拠する。

1. 文脈が足りないと判断したら推測で埋めず必ず利用者に質問する。質問を省略しない。
2. 手直し側を真似する観点は主に三つ：言葉づかい、リズム、構成。
3. AI が削ったが確定稿に残っている内容は「削りすぎ候補」として拾う（事実と推論を混同しない）。
4. 改善提案は `config/voice.md` に閉じず、差分に応じて brand / audience / calibration / templates / 各 agents を指名する。自動マージはしない。

推敲比較のたびに 1 を満たすこと。`outputs/06-calibration.md` 等への保存は明示時のみ（通常はチャットで足りる）。

マーカー境界：[config/calibration.md](calibration.md)。手順：[agents/calibrator.md](../agents/calibrator.md)。

---

## 採点・チェックリストの所在

計器（チェックリスト本文・減点表・スコア帯）は [agents/reviewer-rubric.md](../agents/reviewer-rubric.md)。
