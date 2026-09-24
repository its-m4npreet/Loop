-- Drop abandoned RAG scaffolding. The production Ask LOOP path uses
-- AskLoopConversation / AskLoopMessage; Embedding, Conversation and Message
-- were never wired up.
DROP TABLE IF EXISTS "Message";
DROP TABLE IF EXISTS "Conversation";
DROP TABLE IF EXISTS "Embedding";
