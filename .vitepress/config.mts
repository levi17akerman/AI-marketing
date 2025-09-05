import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "AI-marketing",
  description: "AI-marketing",
  base: '/AI-marketing/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'n8n자동화', link: '/n8n-guide' }
    ],

    sidebar: [
      {
        text: 'n8n자동화',
        items: [
          { text: 'n8n자동화', link: '/n8n-guide' },
          { text: '이비오 API', link: '/evio-api' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
