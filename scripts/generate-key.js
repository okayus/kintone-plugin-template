import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, "../dist");
const outDir = path.resolve(__dirname, "../dist/out");
const pluginDir = path.resolve(__dirname, "../plugin");

// ディレクトリを再帰的にコピーする関数
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName),
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// dist/out ディレクトリが存在しない場合は作成
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// plugin ディレクトリの内容を dist/out にコピー
copyRecursiveSync(pluginDir, outDir);

// kintone-plugin-packer を実行して秘密鍵を生成
execSync("kintone-plugin-packer dist/out");

// 生成された秘密鍵をルートディレクトリに移動
const generatedKey = fs
  .readdirSync(distDir)
  .find((file) => file.endsWith(".ppk"));
if (generatedKey) {
  fs.renameSync(
    path.join(distDir, generatedKey),
    path.resolve(__dirname, "../private.ppk"),
  );
  console.log("秘密鍵が生成され、ルートディレクトリに移動されました。");
} else {
  console.error("秘密鍵の生成に失敗しました。");
}
