/**
 * What: Community chat page that shows the full live-chat stream.
 * Why: Separates chat into its own route so users can focus on conversations.
 */
"use client"

import { LiveChatPanel } from "@/components/community/live-chat-panel"

export default function CommunityChatPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[560px] flex-col sm:h-[calc(100vh-9rem)]">
      <LiveChatPanel channel="global" />
    </div>
  )
}
