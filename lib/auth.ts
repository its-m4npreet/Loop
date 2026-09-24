import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { compare } from "bcryptjs"
import { prisma } from "./prisma"
import { checkRateLimit } from "./rateLimit"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/api/auth",
  },
  providers: [
    Google({}),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null

        // Rate limit per-IP via the Request passed in by NextAuth.
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request?.headers?.get("x-real-ip") ||
          "unknown"

        const allowed = await checkRateLimit({
          key: `credentials-login:ip:${ip}`,
          limit: 10,
          windowSeconds: 300,
          label: "Sign-in attempts",
        })
        if (!allowed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).trim().toLowerCase() },
        })

        if (!user || !user.isActive || !user.passwordHash) return null

        if (!user.emailVerified) return null

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
            },
          })
          user.id = newUser.id
          ;(user as { role: string }).role = newUser.role
        } else {
          user.id = existingUser.id
          ;(user as { role: string }).role = existingUser.role
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        return {
          id: user.id,
          role: (user as { role: string }).role,
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // Re-check fresh DB state so deactivation & role changes apply
        // immediately instead of lingering for the 30-day JWT lifetime.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isActive: true, role: true },
        })

        if (!dbUser || !dbUser.isActive) {
          // Inactive or deleted user — expire the session so guards reject.
          session.expires = new Date(0).toISOString() as never
          return session
        }

        session.user.id = token.id as string
        session.user.role = dbUser.role
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    },
  },
})

