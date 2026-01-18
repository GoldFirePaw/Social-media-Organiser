import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'

function parseCookies(cookieHeader?: string | null) {
  const out: Record<string, string> = {}
  if (!cookieHeader) return out
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const name = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    out[name] = decodeURIComponent(value)
  }
  return out
}

function buildSetCookie(name: string, value: string, opts: { path?: string; httpOnly?: boolean; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean; maxAge?: number | null } = {}) {
  const parts: string[] = []
  parts.push(`${name}=${encodeURIComponent(value)}`)
  if (opts.path) parts.push(`Path=${opts.path}`)
  if (opts.httpOnly) parts.push('HttpOnly')
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`)
  if (opts.secure) parts.push('Secure')
  if (typeof opts.maxAge === 'number') parts.push(`Max-Age=${Math.floor(opts.maxAge)}`)
  if (opts.maxAge === null) parts.push('Max-Age=0')
  return parts.join('; ')
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/login",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = request.body as { password?: string };
        let password = body?.password ?? "";

        // Prevent DoS: limit password length
        if (typeof password !== "string" || password.length > 1000) {
          return reply.status(400).send({ message: "Invalid password format" });
        }

        const hash = process.env.AUTH_PASSWORD_HASH;
        const plain = process.env.AUTH_PASSWORD;

        if (!hash && !plain) {
          return reply.status(500).send({
            message: "Authentication is not configured on the server.",
          });
        }

        let valid = false;
        if (hash) {
          try {
            valid = await argon2.verify(hash, password);
          } catch {
            valid = false;
          }
        } else {
          // fallback: plaintext password in ENV (not recommended)
          valid = password === plain;
        }

        if (!valid) {
          return reply.status(401).send({ message: "Invalid credentials" });
        }

        const secret = process.env.AUTH_JWT_SECRET || "dev_secret_change_me";
        const token = jwt.sign({ role: "admin" }, secret, { expiresIn: "12h" });

        const cookieStr = buildSetCookie("sm_session", token, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
          maxAge: 12 * 60 * 60, // 12 hours
        });

        reply.header("Set-Cookie", cookieStr);

        return { ok: true };
      } catch (err) {
        return reply.status(400).send({ message: "Invalid request" });
      }
    }
  );

  fastify.post(
    "/logout",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const cookieStr = buildSetCookie("sm_session", "", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: null,
      });
      reply.header("Set-Cookie", cookieStr);
      return { ok: true, message: "Logged out" };
    }
  );

  // Graceful shutdown endpoint (admin only)
  fastify.post(
    "/shutdown",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Reuse auth check from /auth/status
      const cookieHeader =
        (request.headers && (request.headers as any).cookie) || null;
      const cookies = parseCookies(cookieHeader);
      const token = cookies["sm_session"];
      const secret = process.env.AUTH_JWT_SECRET || "dev_secret_change_me";

      if (!token) {
        return reply.status(401).send({ ok: false, message: "Not authorized" });
      }

      try {
        jwt.verify(token, secret);
        reply.send({ ok: true, message: "Server stopping" });
        // exit after response flushes
        setTimeout(() => {
          process.exit(0);
        }, 150);
      } catch (err) {
        return reply.status(401).send({ ok: false, message: "Not authorized" });
      }
    }
  );

  fastify.get(
    "/auth/status",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const cookieHeader =
        (request.headers && (request.headers as any).cookie) || null;
      const cookies = parseCookies(cookieHeader);
      const token = cookies["sm_session"];
      const secret = process.env.AUTH_JWT_SECRET || "dev_secret_change_me";

      if (!token) {
        return reply.status(401).send({ ok: false });
      }

      try {
        jwt.verify(token, secret);
        return { ok: true };
      } catch (err) {
        return reply.status(401).send({ ok: false });
      }
    }
  );
}

export function ensureAuth(request: FastifyRequest, reply: FastifyReply) {
  const cookieHeader =
    (request.headers && (request.headers as any).cookie) || null;
  const cookies = parseCookies(cookieHeader);
  const token = cookies["sm_session"];
  const secret = process.env.AUTH_JWT_SECRET || "dev_secret_change_me";

  if (!token) {
    reply.status(401).send({ message: "Unauthorized" });
    throw new Error("Unauthorized");
  }

  try {
    jwt.verify(token, secret);
    return true;
  } catch (err) {
    reply.status(401).send({ message: "Unauthorized" });
    throw new Error("Unauthorized");
  }
}
