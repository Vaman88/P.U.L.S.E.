import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5174', headless: true },
  webServer: {
    command: 'python3 -m http.server 5174 --bind 127.0.0.1 --directory .',
    url: 'http://127.0.0.1:5174/',
    reuseExistingServer: !process.env.CI,
  },
})
