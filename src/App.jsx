import React, { useRef, useState, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

  // (text watermark removed; app now focuses on image/logo watermark)

export default function App() {
  const fileRef = useRef(null);
  const [pdfName, setPdfName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [margin, setMargin] = useState(24);
  const [firstPageOnly, setFirstPageOnly] = useState(false);
  // numbering states
  // numbering is always available when format is set
  const [enableNumbering] = useState(true);
  const [numberingFormat, setNumberingFormat] = useState("{page}/{total}");
  const [numberingStart, setNumberingStart] = useState(1);
  const [numberingFontSize, setNumberingFontSize] = useState(12);
  const [numberingColor, setNumberingColor] = useState("#000000");
  const [numberingOpacity, setNumberingOpacity] = useState(0.9);
  const [numberingPosition, setNumberingPosition] = useState("bottom-right");
  const [customX, setCustomX] = useState(0);
  const [customY, setCustomY] = useState(0);

  // フォント取得方式（not used anymore for text）

  // プレビューURLのクリーンアップ
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function buildWatermarkedPdf() {
    const file = fileRef.current?.files?.[0];
    if (!file) throw new Error("PDFを選択してください。");

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = firstPageOnly ? [pdfDoc.getPages()[0]] : pdfDoc.getPages();

  // no image embedding; only numbering

    for (const page of pages) {
      const { width: pw, height: ph } = page.getSize();

  // no image drawing; only page numbering below

  // draw page numbering if a format is provided
  if (numberingFormat && numberingFormat.trim().length > 0) {
        try {
          // determine page index within full document
          const allPages = pdfDoc.getPages();
          const pageIndex = allPages.indexOf(page);
          const total = allPages.length;
          const pageNum = numberingStart + pageIndex;
          const text = numberingFormat.replace("{page}", String(pageNum)).replace("{total}", String(total));

          // load a default standard font
          const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

          const textWidth = helveticaFont.widthOfTextAtSize(text, numberingFontSize);
          const textHeight = numberingFontSize;

          let tx = 0;
          let ty = 0;
          const m = margin;
          switch (numberingPosition) {
            case "top-left":
              tx = m;
              ty = ph - textHeight - m;
              break;
            case "top-right":
              tx = pw - textWidth - m;
              ty = ph - textHeight - m;
              break;
            case "center-top":
              tx = (pw - textWidth) / 2;
              ty = ph - textHeight - m;
              break;
            case "center":
              tx = (pw - textWidth) / 2;
              ty = (ph - textHeight) / 2;
              break;
            case "center-bottom":
              tx = (pw - textWidth) / 2;
              ty = m;
              break;
            case "custom":
              // customX/customY are measured from left-bottom; X to right, Y upwards
              tx = customX;
              ty = customY;
              break;
            case "bottom-left":
              tx = m;
              ty = m;
              break;
            case "bottom-right":
            default:
              tx = pw - textWidth - m;
              ty = m;
          }

          page.drawText(text, {
            x: tx,
            y: ty,
            size: numberingFontSize,
            font: helveticaFont,
            color: rgbFromHex(numberingColor),
            opacity: numberingOpacity,
          });
        } catch (e) {
          console.warn("Failed to draw page number", e);
        }
      }
    }

    const bytes = await pdfDoc.save({ addDefaultPage: false });
    return new Blob([bytes], { type: "application/pdf" });
  }

  async function handlePreview() {
    try {
      setProcessing(true);
      const blob = await buildWatermarkedPdf();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (e) {
      console.error(e);
      alert(e?.message || "プレビューでエラーが発生しました。");
    } finally {
      setProcessing(false);
    }
  }

  async function handleDownload() {
    try {
      setProcessing(true);
      const blob = await buildWatermarkedPdf();
      const outName = makeOutName(fileRef.current?.files?.[0]?.name || pdfName || "watermarked.pdf");
      triggerDownload(blob, outName);
    } catch (e) {
      console.error(e);
      alert(e?.message || "ダウンロード用PDF生成でエラーが発生しました。");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* 左右スペース */}
      <div className="hidden lg:flex w-60" />
      <div className="flex-1 w-full">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">PDFページナンバリングメーカー</h1>
              <p className="text-sm text-gray-500 mt-0.5">PDF にページ番号を一括で追加します</p>
            </div>
            {/* <a className="text-sm underline opacity-80 hover:opacity-100" href="https://pdf-lib.js.org/" target="_blank" rel="noreferrer">Powered by pdf-lib</a> */}
          </div>
        </header>

        <main className="px-4 py-6 w-full">
          <div className="grid md:grid-cols-3 gap-6">
            {/* 左パネル */}
            <section className="md:col-span-1 space-y-4">
              <div className="p-4 bg-white rounded-2xl shadow">
                <label className="block text-sm font-medium mb-1">PDF ファイル</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e)=> setPdfName(e.target.files?.[0]?.name || "")}
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:px-3 file:py-2 file:bg-gray-50 file:hover:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1 truncate">{pdfName}</p>
              </div>

              <div className="p-4 bg-white rounded-2xl shadow space-y-3">
                {/* <div className="flex items-center justify-between">
                  <label className="font-medium">操作 & ページ番号</label>
                </div> */}

                <label className="block text-sm">
                  <span className="font-medium">書式</span>
                  <input className="w-full mt-1 rounded-lg border px-3 py-2" value={numberingFormat} onChange={(e)=> setNumberingFormat(e.target.value)} />
                  <div className="text-xs text-gray-500 mt-1">{`利用可能なプレースホルダ: {page}, {total}`}</div>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <LabeledNumber label="開始番号" value={numberingStart} setValue={setNumberingStart} min={0} max={100000} />
                  <LabeledNumber label="フォントサイズ" value={numberingFontSize} setValue={setNumberingFontSize} min={6} max={128} />
                </div>

        <label className="block text-sm">
                  <span className="font-medium">位置</span>
                  <select className="w-full mt-1 rounded-lg border px-3 py-2" value={numberingPosition} onChange={(e)=> setNumberingPosition(e.target.value)}>
                    <option value="bottom-right">右下</option>
                    <option value="bottom-left">左下</option>
          <option value="top-right">右上</option>
          <option value="top-left">左上</option>
          <option value="center-top">上中央</option>
          <option value="center">中央</option>
                    <option value="center-bottom">下中央</option>
                    <option value="custom">カスタム</option>
                  </select>
                </label>

                {numberingPosition === "custom" && (
                  <div className="grid grid-cols-2 gap-2">
                    <LabeledNumber label="Xオフセット (px)" value={customX} setValue={setCustomX} min={-5000} max={5000} />
                    <LabeledNumber label="Yオフセット (px)" value={customY} setValue={setCustomY} min={-5000} max={5000} />
                  </div>
                )}

                <label className="block text-sm">
                  <span className="font-medium">色</span>
                  <div className="flex gap-2 items-center mt-1">
                    <input type="color" value={numberingColor} onChange={(e)=> setNumberingColor(e.target.value)} className="w-10 h-10 p-0 rounded" />
                    <input className="w-full rounded-lg border px-3 py-2" value={numberingColor} onChange={(e)=> setNumberingColor(e.target.value)} />
                  </div>
                </label>

                <label className="block text-sm">
                  <span className="font-medium">不透明度</span>
                  <input type="range" min={0} max={1} step={0.01} value={numberingOpacity} onChange={(e)=> setNumberingOpacity(Number(e.target.value))} className="w-full mt-1" />
                  <div className="mt-1 text-xs text-gray-600">{numberingOpacity.toFixed(2)}</div>
                </label>

                {/* ページ番号は常に使用可能 */}

                <div className="mt-4">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={firstPageOnly} onChange={(e)=> setFirstPageOnly(e.target.checked)} />
                    1ページ目のみ
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={handlePreview} disabled={processing} className="rounded-xl bg-gray-900 text-white py-2.5 disabled:opacity-60">{processing ? "処理中..." : "プレビュー"}</button>
                  <button
                    onClick={handleDownload}
                    disabled={processing}
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white py-2.5 disabled:opacity-60 border border-transparent hover:border-orange-600 transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                  >
                    {processing ? "処理中..." : "ダウンロード"}
                  </button>
                </div>
              </div>

              <Tips />
            </section>

            {/* 右パネル：PDFプレビュー */}
            <section className="md:col-span-2">
              <div className="p-6 bg-white rounded-2xl shadow">
                <h2 className="text-lg font-semibold mb-3">使い方</h2>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>左上の「PDFファイル」を選択します。</li>
                  <li>書式（例: {`{page}/{total}`})、開始番号、フォントサイズ、表示位置（上中央/中央/下中央 など）、色、不透明度を設定します。</li>
                  <li>「プレビュー」で表示を確認し、問題なければ「ダウンロード」で番号入りPDFを保存してください。</li>
                </ol>
                <p className="text-xs text-gray-500 mt-4">すべての処理はブラウザ内で行われ、ファイルはサーバに送信されません。</p>
              </div>
              <div className="p-6 mt-4 bg-white rounded-2xl shadow min-h-[420px] flex flex-col">
                <h2 className="text-lg font-semibold mb-3">プレビュー</h2>
                {!previewUrl ? (
                  <div className="text-sm text-gray-500">左の設定で「プレビュー」を押すと、このエリアにPDFが表示されます。</div>
                ) : (
                  <object data={previewUrl} type="application/pdf" className="w-full h-[72vh] border rounded-xl" aria-label="PDF preview">
                    <iframe title="PDF preview" src={previewUrl} className="w-full h-[72vh] border rounded-xl" />
                  </object>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
      <div className="hidden lg:flex w-60" />
    </div>
  );
}


function LabeledNumber({ label, value, setValue, min=0, max=9999 }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="number"
        className="w-full mt-1 rounded-lg border px-3 py-2"
        value={value}
        min={min}
        max={max}
        onChange={(e)=> setValue(Number(e.target.value))}
      />
    </label>
  );
}

function Tips() {
  return (
    <div className="p-4 bg-white rounded-2xl shadow mt-4 text-xs text-gray-600 space-y-2">
      <div className="font-semibold text-gray-800">ヒント</div>
      <ul className="list-disc pl-5 space-y-1">
        <li>大きなPDFやページ数が多いPDFは処理に時間がかかります。まず「1ページ目のみ」で挙動を確認してください。</li>
        <li>書式プレースホルダは <code>{"{page}"}</code> と <code>{"{total}"}</code> のみがサポートされています。</li>
        <li>フォントサイズが大きすぎるとページ端ではみ出る場合があります。必要に応じてサイズを小さくしてください。</li>
        <li>カスタム座標は左下が原点 (0,0) です。Xは右方向、Yは上方向に正の値となります。</li>
        <li>色はコントラストの良いものを選んでください（背景が明るければ濃い色を）。</li>
      </ul>
    </div>
  );
}


function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function makeOutName(name) {
  if (!name?.toLowerCase().endsWith(".pdf")) return `${name || "document"}-watermarked.pdf`;
  const base = name.slice(0, -4);
  return `${base}-watermarked.pdf`;
}

// helper utilities removed because text watermarking was removed

// convert #rrggbb to rgb object used by pdf-lib
function rgbFromHex(hex) {
  try {
    const h = hex.replace(/^#/, "");
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  } catch (e) {
    return rgb(0, 0, 0);
  }
}
