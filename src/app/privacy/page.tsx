import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "PDFHome's privacy policy. Your files are processed locally and never uploaded to our servers.",
};

export default function PrivacyPage() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Privacy Policy</h1>

        <div className="glass-card p-8 space-y-8">
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              At PDFHome, your privacy is our top priority. This policy explains how our website
              handles your data — which is to say, we handle as little of it as possible.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">1. File Processing</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              <strong className="text-[var(--color-text-primary)]">Your files never leave your device.</strong>{" "}
              All PDF processing (merging, splitting, rotating, editing, etc.) happens entirely
              in your web browser using client-side JavaScript. We do not upload, store, or have
              access to any file you work with on PDFHome.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">2. No Account Required</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              PDFHome does not require you to create an account, provide an email address, or
              share any personal information to use our tools. You can use every feature
              anonymously.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">3. Cookies & Analytics</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              We may use minimal, privacy-respecting analytics to understand which tools are
              most popular and improve the user experience. We do not use tracking cookies for
              advertising purposes beyond what is required by our ad provider (Google AdSense).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">4. Advertising</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              PDFHome is supported by advertisements served through Google AdSense. Google may
              use cookies to serve ads based on your visit to PDFHome and other websites. You
              can opt out of personalized advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#667eea] hover:underline"
              >
                Google Ad Settings
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              We do not share your data with any third parties beyond what is described in this
              policy. The only third-party service integrated is Google AdSense for
              advertising.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Since files are processed locally, there is no data to retain. When you close
              your browser tab, all file data is automatically cleared from memory.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">7. Contact</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              If you have any questions about this privacy policy, please contact us at{" "}
              <a href="mailto:hello@pdfhome.com" className="text-[#667eea] hover:underline">
                hello@pdfhome.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
