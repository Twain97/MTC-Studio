import sharp from 'sharp'

export async function createWebpVariants(file, widths) {
  const metadata = await sharp(file.path).metadata()
  if (!metadata.width) throw new Error(`Could not read image dimensions for ${file.originalname}.`)

  const variants = []
  for (const width of widths) {
    const outputWidth = Math.min(width, metadata.width)
    if (variants.some((variant) => variant.width === outputWidth)) continue

    const outputPath = `${file.path}.${outputWidth}.webp`
    await sharp(file.path)
      .rotate()
      .resize({ width: outputWidth, withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toFile(outputPath)

    variants.push({
      width: outputWidth,
      path: outputPath,
      filename: `${file.filename}-${outputWidth}.webp`,
      originalname: `${file.originalname}-${outputWidth}.webp`,
      mimetype: 'image/webp'
    })
  }

  return variants
}
