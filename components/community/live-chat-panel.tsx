"use client"

import { MessageCircle, SendHorizontal } from "lucide-react"
import { useState } from "react"

import type { ChatMessage } from "@/components/community/types"

interface LiveChatPanelProps {
  messages: ChatMessage[]
}

export function LiveChatPanel({ messages }: LiveChatPanelProps) {
  const [messageDraft, setMessageDraft] = useState("")

  return (
    <section className="rounded-2xl border border-[#1c2f33] bg-[#041419]/85 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="text-[#ff620f]" size={20} />
        <h2 className="font-sans text-xl tracking-[0.08em] text-[#ff620f]">Live Chat</h2>
      </div>

      <div className="mt-4 max-h-72 space-y-4 overflow-y-auto rounded-xl border border-[#153038] bg-[#071a1f] p-4">
        {messages.map((message) => (
          <article key={message.id}>
            <p className="font-sans text-sm font-semibold text-[#ff620f]">{message.author}</p>
            <p className="font-sans text-sm text-[#d4dee1]">{message.content}</p>
            <p className="font-sans text-xs text-[#6f888e]">{message.postedAt}</p>
          </article>
        ))}
      </div>

      <form
        className="mt-4 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          setMessageDraft("")
        }}
      >
        <label htmlFor="chat-message" className="sr-only">
          Type message
        </label>
        <input
          id="chat-message"
          value={messageDraft}
          onChange={(event) => setMessageDraft(event.target.value)}
          placeholder="Type message..."
          className="h-11 w-full rounded-xl border border-[#153038] bg-[#071a1f] px-3 font-sans text-sm text-[#e6edf0] placeholder:text-[#7f979d] focus:border-[#1d4f5b] focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff620f] text-black transition-colors hover:bg-[#ff7b36]"
          aria-label="Send message"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </section>
  )
}
