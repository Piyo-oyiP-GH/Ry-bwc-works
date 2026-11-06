# 実際に読んだスキル

| スキル / 参照 | 場面 | 効いたか |
| --- | --- | --- |
| hyperframes `SKILL.md`（Contract） | 全体 | 〇 clip・timeline 登録・決定論の決まりを最初に押さえられた |
| hyperframes `references/format.md` | 構成・960×540 の設定 | 〇 data-width/height と root の書き方 |
| hyperframes `references/types/3d.md` | 3D/質感・光、カメラ | 〇 「render(t) を純関数に」「乱数は seed」「暖色キー」 |
| hyperframes `references/runtimes.md` | 光の揺れ・ほこり | 〇 hf-seek と mulberry32 の書き方をそのまま使った |
| hyperframes `references/motion.md` | カメラと動き | △ 回転は両端イーズ、到着は expo.out、プッシュは回転と同時に止める、に効いた。数値の多くは文字・UI 向け |
| hyperframes `references/look.md` | 質感・光 | △ 「暗地に全面リニアグラデはバンディング→放射状」は効いた。プリセット・ブランド部分は今回は無関係 |
| hyperframes `references/review.md` | 仕上げ | △ P0/P1 の見方で「傾きが弱い・最後に写真が真横を向く」を直せた |
| hyperframes-cli（SKILL.md は未読。CLI の `check` / `snapshot` / `render` を使用） | レンダー | 〇 snapshot の contact-sheet が確認に便利 |

読まなかったもの：gsap スキル本体、hyperframes-registry（catalog 検索も省略）、path-tracing.md、huashu-art-motion、media-use、remotion 系。
