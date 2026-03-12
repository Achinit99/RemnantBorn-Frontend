import { liveChatMessages } from "@/app/community/mock-data"
import { LiveChatPanel } from "@/components/community/live-chat-panel"

export default function CommunityChatPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-bold text-[#e6edf0] sm:text-4xl">Live Chat</h1>
        <p className="mt-2 font-sans text-sm text-[#8d9fa3] sm:text-base">Full live chat stream from mock data.</p>
      </header>
      <LiveChatPanel messages={liveChatMessages} />
    </div>
  )
}
