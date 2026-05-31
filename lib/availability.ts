import type { AvailabilityStatus } from "@prisma/client";

export function formatAvailabilityLabel(
  status: AvailabilityStatus,
  availableAt?: Date | null
): string {
  switch (status) {
    case "AVAILABLE":
      return "🟢 Available now";
    case "STUDYING_ALONE":
      return "🟡 Studying alone";
    case "NOT_AVAILABLE":
      return "🔴 Not available today";
    case "AVAILABLE_AT":
      if (availableAt) {
        const time = availableAt.toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
        });
        return `📅 Available at ${time}`;
      }
      return "📅 Available later";
    default:
      return "";
  }
}
