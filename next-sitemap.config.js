/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://pdfhome.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: 'weekly',
  priority: 0.7,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/'] },
    ],
    additionalSitemaps: [],
  },
  // Exclude API routes and internal pages
  exclude: ['/api/*'],
  // Transform to set custom priorities
  transform: async (config, path) => {
    // Homepage gets highest priority
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }

    // Tool pages get high priority
    const toolPaths = [
      '/merge-pdf', '/split-pdf', '/rotate-pdf',
      '/compress-pdf', '/pdf-to-jpg', '/jpg-to-pdf',
      '/add-text-to-pdf', '/watermark-pdf', '/sign-pdf',
      '/add-page-numbers', '/protect-pdf', '/unlock-pdf',
    ];

    if (toolPaths.includes(path)) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.9,
        lastmod: new Date().toISOString(),
      };
    }

    // Default for other pages
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
