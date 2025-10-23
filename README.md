# React + Vite

## 任意の作業フォルダで
```
npm create vite@latest pdf-watermarker -- --template react
cd pdf-image
npm i
npm i pdf-lib
npm install fontkit
npm i fontkit
npm i @pdf-lib/fontkit
```

5) 起動

```
npm run dev
```

表示されたローカルURL（例：http://localhost:5173）にアクセス。
PDFを選択 → 設定変更 → 「PDFに透かしを追加」でダウンロードされます。


そのまま配布できるビルド方法
```
npm run build     # dist/ に静的ファイル生成
npm run preview   # ローカルで配信テスト
```

dist/ をそのままS3/CloudFrontや任意の静的ホスティングに置けば配布できます。


fontsはwordpressのRootディレクトリに配置する

ページ番号の追加:

- サイドバーの「ページ番号」を有効にして、書式（例: {page}/{total}）と開始番号、位置、フォントサイズ、色、不透明度を設定してください。
- 「プレビュー」または「ダウンロード」で番号が付与されたPDFが出力されます。