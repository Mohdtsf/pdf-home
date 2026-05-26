import { Zap, Eye, Shield, Globe } from "lucide-react";

const trustBadges = [
  { icon: Zap, title: "100% Free", description: "No hidden costs or premium locks" },
  { icon: Eye, title: "No Login Required", description: "Start editing immediately" },
  { icon: Shield, title: "Files Stay Private", description: "Processed in your browser" },
  { icon: Globe, title: "Works Everywhere", description: "Any device, any browser" },
];

export function TrustBadgesSection() {
  return (
    <section className="py-20 px-4 border-t border-[var(--color-border-glass)]">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustBadges.map((badge) => (
            <div key={badge.title} className="glass-card p-6 text-center group hover:translate-y-[-2px] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-100/70 dark:group-hover:bg-indigo-900/50">
                <badge.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold mb-1 text-[var(--color-text-primary)]">{badge.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
