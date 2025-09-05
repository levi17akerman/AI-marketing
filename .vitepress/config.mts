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
      { text: 'n8n 자동화', link: '/n8n-guide' },
      { text: '이비오 API', link: '/evio-api' }
    ],

    sidebar: [
      {
        text: 'n8n 자동화',
        items: [
          { text: '시작하기', link: '/n8n-guide' },
          { text: '실습 #1: 날씨 알림 봇', link: '/n8n-practice-weather' }
        ]
      },
      {
        text: '이비오 API',
        items: [
          { text: '시작하기', link: '/evio-api' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
