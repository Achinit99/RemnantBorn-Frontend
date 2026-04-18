export const MESSAGES_TABLE = "messages"
export const MESSAGES_SELECT_WITH_PROFILE = "*, profiles(username, avatar_url, level)"

export const GLOBAL_TEXT_CHANNEL = "global"
export const GLOBAL_CHANNEL_FILTER = `channel=eq.${GLOBAL_TEXT_CHANNEL}`
export const GLOBAL_CHAT_SYNC_CHANNEL = "global-chat"
export const GLOBAL_CHAT_PAGE_SIZE = 10
