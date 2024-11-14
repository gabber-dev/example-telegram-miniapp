'use client'

import TelegramWebApp from '../components/TelegranWebApp'
import { TelegramProvider } from '@/context/TelegramContext'

export default function Home() {
  return (
    <TelegramProvider>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <TelegramWebApp />
      </main>
    </TelegramProvider>
  )
}