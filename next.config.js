/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/shuangpingtaihuikuanshujutongji' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/shuangpingtaihuikuanshujutongji' : '',
}

module.exports = nextConfig
