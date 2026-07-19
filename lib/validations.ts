import { z } from "zod"
import { NextResponse } from "next/server"

// ── Shared helpers ──

export function zodErrorResponse(error: z.ZodError) {
  const message = error.issues.map((i) => i.message).join("; ")
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function parseBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) }
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    return { error: zodErrorResponse(result.error) }
  }
  return { data: result.data }
}

// ── Auth ──

export const RegisterSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
})

export const ProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .transform((s) => s.trim()),
})

// ── Workspace ──

export const CreateWorkspaceSchema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name is too long")
    .transform((s) => s.trim()),
})

// ── Team ──

export const InviteMemberSchema = z.object({
  email: z.string().email("Invalid email address").transform((s) => s.trim().toLowerCase()),
  name: z
    .string()
    .max(100, "Name is too long")
    .optional()
    .transform((s) => s?.trim() || null),
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]).optional().default("VIEWER"),
})

export const AcceptInviteSchema = z.object({
  token: z.string().min(1, "Invalid invitation link"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .transform((s) => s.trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
})

export const UpdateMemberStatusSchema = z.object({
  isActive: z.boolean(),
})

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"], {
    errorMap: () => ({ message: "Role must be ADMIN, ANALYST, or VIEWER" }),
  }),
})

// ── Feedback ──

export const ManualFeedbackSchema = z.object({
  content: z.string().min(1, "Feedback content is required"),
  channel: z.string().min(1, "Channel is required"),
  customerName: z.string().max(200).optional(),
  rating: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return null
      const n = Number(v)
      if (Number.isNaN(n) || n < 1 || n > 5) return null
      return n
    }),
  feedbackDate: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return null
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) return null
      return d
    }),
})

export const InboxQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(10),
})

// ── Ask LOOP ──

export const AskLoopSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(2000, "Message is too long (max 2000 characters)")
    .transform((s) => s.trim()),
  conversationId: z.string().optional(),
})

// ── Reports ──

export const GenerateReportSchema = z
  .object({
    title: z.string().max(200).optional().default("Voice of Customer Report"),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    status: z.enum(["DRAFT", "SCHEDULED", "COMPLETED"]).optional().default("COMPLETED"),
    reportType: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.periodStart && data.periodEnd) {
        const parse = (v: string) => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00.000Z`)
          return new Date(v)
        }
        const start = parse(data.periodStart)
        const end = parse(data.periodEnd)
        return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end
      }
      return true
    },
    { message: "Start date must be on or before end date, and dates must be valid" }
  )

export const UpdateReportSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.periodStart) {
        const d = new Date(data.periodStart)
        if (isNaN(d.getTime())) return false
      }
      if (data.periodEnd) {
        const d = new Date(data.periodEnd)
        if (isNaN(d.getTime())) return false
      }
      if (data.periodStart && data.periodEnd) {
        return new Date(data.periodStart) <= new Date(data.periodEnd)
      }
      return true
    },
    { message: "Invalid date range" }
  )

export const ReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(""),
  status: z.string().optional().default("ALL"),
})
