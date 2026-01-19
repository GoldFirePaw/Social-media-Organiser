"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
exports.ensureAuth = ensureAuth;
const argon2_1 = __importDefault(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function parseCookies(cookieHeader) {
    const out = {};
    if (!cookieHeader)
        return out;
    const parts = cookieHeader.split(';');
    for (const part of parts) {
        const idx = part.indexOf('=');
        if (idx === -1)
            continue;
        const name = part.slice(0, idx).trim();
        const value = part.slice(idx + 1).trim();
        out[name] = decodeURIComponent(value);
    }
    return out;
}
function buildSetCookie(name, value, opts = {}) {
    const parts = [];
    parts.push(`${name}=${encodeURIComponent(value)}`);
    if (opts.path)
        parts.push(`Path=${opts.path}`);
    if (opts.httpOnly)
        parts.push('HttpOnly');
    if (opts.sameSite)
        parts.push(`SameSite=${opts.sameSite}`);
    if (opts.secure)
        parts.push('Secure');
    if (typeof opts.maxAge === 'number')
        parts.push(`Max-Age=${Math.floor(opts.maxAge)}`);
    if (opts.maxAge === null)
        parts.push('Max-Age=0');
    return parts.join('; ');
}
async function authRoutes(fastify) {
    fastify.post("/login", async (request, reply) => {
        try {
            const body = request.body;
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
                    valid = await argon2_1.default.verify(hash, password);
                }
                catch {
                    valid = false;
                }
            }
            else {
                // fallback: plaintext password in ENV (not recommended)
                valid = password === plain;
            }
            if (!valid) {
                return reply.status(401).send({ message: "Invalid credentials" });
            }
            const secret = process.env.AUTH_JWT_SECRET || "dev_secret_change_me";
            const token = jsonwebtoken_1.default.sign({ role: "admin" }, secret, { expiresIn: "12h" });
            const cookieStr = buildSetCookie("sm_session", token, {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                maxAge: 12 * 60 * 60, // 12 hours
            });
            reply.header("Set-Cookie", cookieStr);
            return { ok: true };
        }
        catch (err) {
            return reply.status(400).send({ message: "Invalid request" });
        }
    });
    fastify.post("/logout", async (request, reply) => {
        const cookieStr = buildSetCookie("sm_session", "", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: null,
        });
        reply.header("Set-Cookie", cookieStr);
        return { ok: true, message: "Logged out" };
    });
    // Graceful shutdown endpoint (admin only)
    fastify.post("/shutdown", async (request, reply) => {
        // Reuse auth check from /auth/status
        const cookieHeader = (request.headers && request.headers.cookie) || null;
        const cookies = parseCookies(cookieHeader);
        const token = cookies["sm_session"];
        const secret = process.env.AUTH_JWT_SECRET || "dev_secret_change_me";
        if (!token) {
            return reply.status(401).send({ ok: false, message: "Not authorized" });
        }
        try {
            jsonwebtoken_1.default.verify(token, secret);
            reply.send({ ok: true, message: "Server stopping" });
            // exit after response flushes
            setTimeout(() => {
                process.exit(0);
            }, 150);
        }
        catch (err) {
            return reply.status(401).send({ ok: false, message: "Not authorized" });
        }
    });
    fastify.get("/auth/status", async (request, reply) => {
        const cookieHeader = (request.headers && request.headers.cookie) || null;
        const cookies = parseCookies(cookieHeader);
        const token = cookies["sm_session"];
        const secret = process.env.AUTH_JWT_SECRET || "dev_secret_change_me";
        if (!token) {
            return reply.status(401).send({ ok: false });
        }
        try {
            jsonwebtoken_1.default.verify(token, secret);
            return { ok: true };
        }
        catch (err) {
            return reply.status(401).send({ ok: false });
        }
    });
}
function ensureAuth(request, reply) {
    const cookieHeader = (request.headers && request.headers.cookie) || null;
    const cookies = parseCookies(cookieHeader);
    const token = cookies["sm_session"];
    const secret = process.env.AUTH_JWT_SECRET || "dev_secret_change_me";
    if (!token) {
        reply.status(401).send({ message: "Unauthorized" });
        throw new Error("Unauthorized");
    }
    try {
        jsonwebtoken_1.default.verify(token, secret);
        return true;
    }
    catch (err) {
        reply.status(401).send({ message: "Unauthorized" });
        throw new Error("Unauthorized");
    }
}
