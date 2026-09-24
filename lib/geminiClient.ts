/**
 * Shared Gemini client helpers.
 * Model name comes from GEMINI_MODEL (default: gemini-3.6-flash).
 * gemini-2.5-flash is no longer available to new API keys (404).
 */

import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai"

const DEFAULT_MODEL = "gemini-3.6-flash"

export function getGeminiModelName(): string {
  const fromEnv = process.env.GEMINI_MODEL?.trim()
  return fromEnv || DEFAULT_MODEL
}

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null
}

/**
 * Create a GenerativeModel. Throws if no API key is configured.
 */
export function createGeminiModel(): GenerativeModel {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set")
  }
  const model = getGeminiModelName()
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model })
}

/**
 * Create a GenerativeModel, or null if no API key is configured
 * (used by optional AI paths that fall back to heuristics).
 */
export function createGeminiModelOptional(): GenerativeModel | null {
  const apiKey = getApiKey()
  if (!apiKey) return null
  const model = getGeminiModelName()
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model })
}
