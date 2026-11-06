# 使ったスキル

| スキル / 読んだ所 | 場面 | 効いたか |
| --- | --- | --- |
| hyperframes `SKILL.md` | 最初。守ること（clip・timelines への登録・乱数禁止など）と作業の流れ | 〇 1回目から check のエラー0で通った |
| hyperframes `references/format.md` | index.html の形、`fromTo`、clip の時間の扱い | 〇 |
| hyperframes `references/types/3d.md` | 疑似3D（円卓・光）の作り方。「時間から毎フレーム描く」「乱数はシード付き」 | 〇 描画を `renderAt(t)` 1本にまとめる方針がここから決まった |
| hyperframes `references/runtimes.md`（hf-seek の所だけ grep） | canvas を時間で描く方法 | 〇 GSAP の onUpdate と hf-seek の両方から `renderAt` を呼ぶ形にした |
| hyperframes-cli（SKILL.md は読まず、`render --help` だけ） | 出力先・fps の指定 | △ help の出力が長く、要る所が少しだけだった |
| gsap（スキルは読まず） | `gsap.set`・`parseEase`・タイムラインは既知の範囲で使った | × 読んでいない |
