/** Context-aware replies when Claude API is not configured */

interface ChatTurn {
  role: string;
  content: string;
}

function lastUserTopic(history: ChatTurn[]): string {
  const users = history.filter((m) => m.role === "user").map((m) => m.content);
  return users.length >= 2 ? users[users.length - 2] : users[0] ?? "";
}

export function localStudyBuddyResponse(
  message: string,
  history: ChatTurn[] = []
): string {
  const lower = message.toLowerCase().trim();
  const topic = lastUserTopic(history);

  if (
    lower === "yes" ||
    lower === "yeah" ||
    lower === "yep" ||
    lower === "ok" ||
    lower === "okay"
  ) {
    if (topic.includes("iron") || topic.includes("carbon") || topic.includes("phase")) {
      return "Perfect. Start with the eutectoid reaction (0.76% C at 727°C), then trace slow vs fast cooling. Do 3 labeled sketches today; 25 min each. Ping me if a region confuses you.";
    }
    if (topic.includes("plan")) {
      return "Great. Block your calendar now: Slot 1 theory, Slot 2 problems. Start with the hardest topic first tomorrow morning. Let's go!";
    }
    return "Awesome. Pick one concrete task for the next 25 minutes and start now. Tell me what you're working on if you want a quick plan.";
  }

  if (lower === "no" || lower === "not really") {
    return "No worries. What part feels unclear? Share the topic or question and we'll break it down step by step.";
  }

  if (
    lower.includes("iron") ||
    lower.includes("carbon") ||
    lower.includes("eutectoid") ||
    lower.includes("pearlite") ||
    lower.includes("martensite") ||
    lower.includes("phase diagram")
  ) {
    return "Iron-carbon diagram cheat sheet: (1) Eutectoid at 0.76% C and 727°C gives pearlite. (2) Slow cool = coarse pearlite; fast quench = martensite. (3) Draw the diagram once, then label 5 microstructures from memory. Want a 25-min study block plan for today?";
  }

  if (lower.includes("study plan") || lower.includes("plan for") || lower.includes("schedule")) {
    return "Try this today: 25 min theory → 10 min break → 25 min problems → 10 min error review. Repeat for your hardest chapter. Sunday = full revision only. Adjust times to your evening/morning slot.";
  }

  if (lower.includes("case") || lower.includes("pm ") || lower.includes("product management")) {
    return "PM case flow: Clarify goal → Users & pain → 2-3 solutions → Pick one + metrics → Risks. For practice, pick one prompt and timebox 25 min. Structure pehle, numbers baad mein.";
  }

  if (lower.includes("guesstimate") || lower.includes("estimate market")) {
    return "Guesstimate: Population → relevant segment → frequency of use → price. Round aggressively, state every assumption out loud. Practice one daily. Speed matters more than precision.";
  }

  if (
    lower.includes("explain") ||
    lower.includes("what is") ||
    lower.includes("how does") ||
    lower.includes("help me understand")
  ) {
    return `For "${message.slice(0, 80)}": break it into definition → why it matters → 1 example → 1 exam-style question. Which part is confusing: basics or application?`;
  }

  if (lower.includes("jee") || lower.includes("neet") || lower.includes("upsc") || lower.includes("cat")) {
    return "Exam tip: 70% weightage topics first, then PYQs from last 5 years. Daily: 1 chapter notes + 20 MCQs + mistake log. Consistency > marathon sessions.";
  }

  if (lower.includes("thank")) {
    return "You're welcome! Keep the momentum. Small daily blocks add up. Ask anytime 💪";
  }

  if (message.length < 15) {
    return "Tell me a bit more. Which subject or topic? I can explain, quiz you, or make a quick study plan.";
  }

  return `On "${message.slice(0, 60)}${message.length > 60 ? "…" : ""}": split it into 3 parts: core concept, one worked example, one practice question. Start a 25-min focus block on the hardest part. What step feels toughest right now?`;
}
