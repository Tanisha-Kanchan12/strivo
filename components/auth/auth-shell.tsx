import Image from "next/image";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

const FEATURES = [
  "Smart matching by goals and availability",
  "Live study sessions with accountability partners",
  "Focus rooms, chat, and progress tracking",
];

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-1/2 flex-col justify-between bg-[#F8FAF5] p-12 lg:flex xl:p-16">
        <div>
          <Image
            src="/strivo-logo.png"
            alt="Strivo"
            width={72}
            height={72}
            className="h-[72px] w-[72px] object-contain"
            priority
          />
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-[#1A2E05]">
            Find your study partner
          </h1>
          <p className="mt-3 max-w-md text-lg text-strivo-secondary">
            Match with serious students, study together, and stay accountable.
          </p>
        </div>

        <ul className="space-y-4">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
              </span>
              <span className="text-[#1A2E05]">{feature}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center bg-strivo-page p-6 sm:p-10">
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <Image
            src="/strivo-logo.png"
            alt="Strivo"
            width={64}
            height={64}
            className="h-16 w-16 object-contain"
            priority
          />
        </div>
        <div className="w-full max-w-md animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
