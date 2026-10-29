// The public address is an open decision (see documentation-platform/PLAN.md).
// Set DOCS_URL when building for a real host; the local default is only for previews.
const config = {
  title: "Snow Seasons Tech Docs",
  tagline: "Product guides for Snow Seasons Tech software",
  url: process.env.DOCS_URL || "http://localhost:3000",
  baseUrl: "/",
  onBrokenLinks: "throw",
  markdown: {
    hooks: { onBrokenMarkdownLinks: "throw" },
  },
  i18n: { defaultLocale: "en", locales: ["en"] },
  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.js",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: "Snow Seasons Tech",
      items: [{ type: "docSidebar", sidebarId: "docs", position: "left", label: "Products" }],
    },
    footer: {
      style: "dark",
      copyright: `Copyright ${new Date().getFullYear()} Snow Seasons Tech`,
    },
  },
};

module.exports = config;
