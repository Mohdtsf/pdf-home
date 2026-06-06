import { NextRequest, NextResponse } from "next/server";

/**
 * Analytics API endpoint.
 * Receives anonymous usage events from the client.
 * 
 * In production, this could forward to:
 * - PostgreSQL (Neon)
 * - Google Analytics Measurement Protocol
 * - A simple log file
 * 
 * For now, logs to console for development/staging.
 */

// Simple in-memory rate limiter (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // Max events per IP per minute
const RATE_WINDOW = 60_000; // 1 minute in ms

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

// Allowed event names
const VALID_EVENTS = new Set(["tool_used", "download_completed", "page_view"]);

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    // Parse and validate the event
    const body = await request.text();
    let event: Record<string, unknown>;

    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Validate event shape
    if (!event.name || typeof event.name !== "string" || !VALID_EVENTS.has(event.name)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    // Log the event (replace with DB write in production)
    console.log("[Analytics]", {
      event: event.name,
      tool: event.tool || null,
      fileSize: event.fileSize || null,
      path: event.path || null,
      timestamp: event.timestamp || Date.now(),
      ip: ip.substring(0, 3) + "***", // Anonymize IP in logs
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[Analytics] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Only POST is allowed
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
