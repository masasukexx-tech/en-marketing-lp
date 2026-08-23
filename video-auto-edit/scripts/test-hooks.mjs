/**
 * テスト実行専用のNode ESM resolve hook。
 * Next.js(webpack)は拡張子なしの相対import ("./ffmpeg")を解決できるが、
 * npm install不要でテストを走らせるための `node --experimental-strip-types` 直接実行では
 * 拡張子が必須なため、失敗時に .ts / .tsx を補って再解決する。
 * 本番コード（Next.jsアプリ本体）の挙動には一切影響しない。
 */
const EXTENSIONS = [".ts", ".tsx"];

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    try {
      return await nextResolve(specifier, context);
    } catch (err) {
      for (const ext of EXTENSIONS) {
        try {
          return await nextResolve(specifier + ext, context);
        } catch {
          // try next extension
        }
      }
      throw err;
    }
  }
  return nextResolve(specifier, context);
}
