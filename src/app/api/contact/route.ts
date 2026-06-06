import { NextRequest, NextResponse } from "next/server";

/**
 * Contact form API endpoint.
 * Validates input and logs the submission.
 * 
 * In production, integrate with:
 * - Email service (SendGrid, Resend, etc.)
 * - Database storage
 * - Slack webhook notification
 */

// Simple rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3; // Max submissions per IP per hour
const RATE_WINDOW = 3600_000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, message } = body;

    // Validate fields
    const errors: string[] = [];

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      errors.push("Name must be at least 2 characters.");
    }
    if (name && name.length > 100) {
      errors.push("Name must be under 100 characters.");
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      errors.push("Please provide a valid email address.");
    }
    if (email && email.length > 254) {
      errors.push("Email address is too long.");
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      errors.push("Message must be at least 10 characters.");
    }
    if (message && message.length > 5000) {
      errors.push("Message must be under 5000 characters.");
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    // Log the submission (replace with email/DB in production)
    console.log("[Contact Form]", {
      name: name.trim(),
      email: email.trim(),
      messageLength: message.trim().length,
      timestamp: new Date().toISOString(),
      ip: ip.substring(0, 3) + "***",
    });

    return NextResponse.json(
      { message: "Thank you! Your message has been received. We'll get back to you soon." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Contact Form] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
