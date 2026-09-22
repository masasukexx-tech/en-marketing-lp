// APP_PASSWORD_HASH用のbcryptハッシュを生成するユーティリティ。
// 使い方: npm run auth:hash-password -- "設定したいパスワード"
// 出力されたハッシュ値だけを環境変数 APP_PASSWORD_HASH に設定してください。
// 平文パスワードはコードにもGitHubにも保存しないでください。

import bcrypt from "bcryptjs";

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('使い方: npm run auth:hash-password -- "設定したいパスワード"');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  console.log(hash);
}

main().catch((error) => {
  console.error("ハッシュ生成でエラーが発生しました", error);
  process.exit(1);
});
