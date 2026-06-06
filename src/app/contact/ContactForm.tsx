"use client";

import { useState, useCallback } from "react";
import { Send, Loader2, CheckCircle } from "lucide-react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [name, email, message]);

  if (submitted) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
        <p className="text-[var(--color-text-secondary)] text-sm mb-6">
          Thank you for reaching out. We&apos;ll get back to you within 48 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="btn-secondary text-sm"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
      <h3 className="text-lg font-semibold mb-2">Send us a message</h3>

      <div>
        <label htmlFor="contact-name" className="text-sm font-medium block mb-2">
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={100}
          placeholder="Your name"
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#6366f1] focus:outline-none transition-colors placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="text-sm font-medium block mb-2">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={254}
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#6366f1] focus:outline-none transition-colors placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="text-sm font-medium block mb-2">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          placeholder="How can we help?"
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#6366f1] focus:outline-none transition-colors resize-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#f43f5e]/10 border border-[#f43f5e]/20">
          <p className="text-sm text-[#f43f5e]">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-aurora w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
        ) : (
          <><Send className="w-5 h-5" /> Send Message</>
        )}
      </button>
    </form>
  );
}
