# ウヨパヨ診断

50問で「経済政策をどのレンズで見ているか」を診断する、GitHub Pages向けの静的サイトです。

## 方針

- 各診断結果の本文を厚くしています。
- 結果は人格や善悪の判定ではなく、政策論で何を重視し、何を見落としやすいかを読むためのものです。

## できること

- サーバー不要。`index.html` を GitHub Pages で配信するだけです。
- 結果タイプは24種類。
- 採点は8つの経済思想軸に基づくベクトル近似です。
- 結果ページは `/results/<slug>/` に静的HTMLとして生成済みです。
- 診断後は `/results/<slug>/?s=<score>&a=<answers>` に遷移します。
- `result.html?type=<slug>&s=<score>` でも直接表示できます。

## デプロイ

1. このフォルダの中身をGitHubリポジトリにpush。
2. GitHubの Settings → Pages で `main` ブランチの `/root` を公開。
3. 公開URLに合わせて `og:url` の絶対URLを更新します。

```bash
python3 tools/set-site-url.py --url "https://<user>.github.io/<repo>"
```

## 設計メモ

採点は、8軸のベクトルで回答者を表現し、各経済思想タイプのプロトタイプベクトルとの距離で近いタイプを出します。

詳しくは `docs/economic-basis.md` を見てください。

## 注意

これは教育・娯楽用の近似診断です。政治的な善悪判定でも、学派所属の証明書でもありません。SNSの棍棒にすると、どんな道具もだいたい棍棒になります。
