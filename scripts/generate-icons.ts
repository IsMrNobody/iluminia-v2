import sharp from "sharp";
import fs from "fs";
import path from "path";

const iconsDir = path.resolve(process.cwd(), "public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sourceLogo = path.resolve(process.cwd(), "public/logoiluminia.webp");

async function generate() {
  if (!fs.existsSync(sourceLogo)) {
    console.error("Source logo not found at:", sourceLogo);
    return;
  }

  console.log("Generating PWA icons from source logo...");

  // 1. icon-192.png
  await sharp(sourceLogo)
    .resize(192, 192, { fit: "contain", background: { r: 251, g: 246, b: 237, alpha: 0 } })
    .png()
    .toFile(path.join(iconsDir, "icon-192.png"));

  // 2. icon-512.png
  await sharp(sourceLogo)
    .resize(512, 512, { fit: "contain", background: { r: 251, g: 246, b: 237, alpha: 0 } })
    .png()
    .toFile(path.join(iconsDir, "icon-512.png"));

  // 3. apple-touch-icon.png (180x180)
  await sharp(sourceLogo)
    .resize(180, 180, { fit: "contain", background: { r: 251, g: 246, b: 237, alpha: 1 } })
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));

  // 4. maskable-512.png (512x512 with solid warm background #FBF6ED)
  const resizedLogo = await sharp(sourceLogo)
    .resize(384, 384, { fit: "contain", background: { r: 251, g: 246, b: 237, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 251, g: 246, b: 237, alpha: 1 }
    }
  })
    .composite([{ input: resizedLogo, gravity: "center" }])
    .png()
    .toFile(path.join(iconsDir, "maskable-512.png"));

  console.log("PWA icons generated successfully in public/icons/");
}

generate().catch(err => {
  console.error("Error generating icons:", err);
});
