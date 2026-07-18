import { prisma } from "@/lib/prisma"
import type { ChatTurn } from "@/lib/askLoop"

/**
 * List a user's Ask LOOP conversations, most recently active first.
 * Scoped per-user (not shared workspace-wide) since chat history is personal.
 */
export async function listConversations(workspaceId: string, userId: string) {
  const conversations = await prisma.askLoopConversation.findMany({
    where: { workspaceId, userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  })

  return conversations.map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updatedAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
  }))
}

/**
 * Fetch a single conversation with its full message history.
 * Returns null if it doesn't exist or belongs to a different user/workspace.
 */
export async function getConversationWithMessages(
  workspaceId: string,
  userId: string,
  conversationId: string
) {
  const conversation = await prisma.askLoopConversation.findFirst({
    where: { id: conversationId, workspaceId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })

  if (!conversation) return null

  return {
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt.toISOString(),
    messages: conversation.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  }
}

/** Derive a short, human-readable title from a conversation's first message. */
export function titleFromMessage(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ")
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed || "New conversation"
}

/**
 * Load the last N turns of a conversation as plain chat turns, for feeding
 * back into the model as history. Excludes the just-inserted user message
 * when `excludeMessageId` is given.
 */
export async function getRecentTurns(
  conversationId: string,
  limit = 12,
  excludeMessageId?: string
): Promise<ChatTurn[]> {
  const messages = await prisma.askLoopMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  })

  return messages
    .filter((m) => m.id !== excludeMessageId)
    .slice(0, limit)
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }))
}

/** Ensure a conversation exists for this user/workspace, creating one if needed. */
export async function ensureConversation(
  workspaceId: string,
  userId: string,
  conversationId: string | undefined,
  firstMessage: string
) {
  if (conversationId) {
    const existing = await prisma.askLoopConversation.findFirst({
      where: { id: conversationId, workspaceId, userId },
      select: { id: true },
    })
    if (existing) return existing.id
  }

  const created = await prisma.askLoopConversation.create({
    data: {
      workspaceId,
      userId,
      title: titleFromMessage(firstMessage),
    },
    select: { id: true },
  })
  return created.id
}

export async function addMessage(
  conversationId: string,
  role: "USER" | "ASSISTANT",
  content: string
) {
  await prisma.$transaction([
    prisma.askLoopMessage.create({ data: { conversationId, role, content } }),
    prisma.askLoopConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ])
}

export async function deleteConversation(
  workspaceId: string,
  userId: string,
  conversationId: string
): Promise<boolean> {
  const result = await prisma.askLoopConversation.deleteMany({
    where: { id: conversationId, workspaceId, userId },
  })
  return result.count > 0
}
