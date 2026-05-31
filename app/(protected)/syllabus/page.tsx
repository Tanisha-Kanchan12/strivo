import { SyllabusPageClient } from "@/components/syllabus/syllabus-page-client";

export default function SyllabusPage() {
  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-strivo-text">Syllabus Tracker</h1>
        <p className="mt-1 text-sm text-strivo-secondary">
          Track topics by subject and share progress with your study pairs
        </p>
      </div>
      <SyllabusPageClient />
    </div>
  );
}
