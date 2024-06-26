import { appDescription } from './constants/index'

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      // apiKey: process.env.API_KEY,
      apiKey: '1234567890',
      chatCompletion: '/lin_chat/message',
      chatCompletionUserApi: '/lin_chat/messageUseUserApi',
      chatMessage: '/lin_chat/chatMessage',
      modifyMessage: '/lin_chat/modifyMessage',
      apiBase: 'https://linchatgpt.linlin.online',
      wsBase: 'wss://linchatgpt.linlin.online',
      // apiBase: 'http://localhost:8080',
      // wsBase: 'ws://localhost:8080',
    },
  },
  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@element-plus/nuxt',
  ],

  experimental: {
    // when using generate, payload js assets included in sw precache manifest
    // but missing on offline, disabling extraction it until fixed
    payloadExtraction: false,
    renderJsonPayloads: true,
  },

  css: [
    '@unocss/reset/tailwind.css',
  ],

  colorMode: {
    classSuffix: '',
  },

  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    prerender: {
      crawlLinks: false,
      routes: ['/'],
      ignore: ['/hi'],
    },
  },

  app: {
    head: {
      viewport: 'width=device-width,initial-scale=1',
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/svg+xml', href: '/nuxt.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: appDescription },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { 'http-equiv': 'content-security-policy', 'content': 'upgrade-insecure-requests' },
      ],
    },
  },
  devtools: {
    enabled: true,
  },
  elementPlus: {
    icon: 'ElIcon',
    themes: ['dark'],
  },
})
