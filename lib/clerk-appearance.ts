import type { Appearance } from "@clerk/types";

export const strivoClerkAppearance: Appearance = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: {
    colorPrimary: "#2D4A0F",
    colorBackground: "#FFFFFF",
    colorText: "#1A2E05",
    colorInputBackground: "#F0F4EB",
    colorInputText: "#1A2E05",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "mx-auto w-full",
    cardBox: "shadow-none",
    card: "bg-white rounded-2xl border-0 shadow-[0_2px_16px_rgba(45,74,15,0.08)]",
    headerTitle: "text-[#1A2E05] font-extrabold text-2xl",
    headerSubtitle: "text-strivo-secondary text-sm",
    socialButtonsBlockButton:
      "bg-white border-[1.5px] border-[#2D4A0F] text-[#1A2E05] hover:bg-strivo-muted shadow-none",
    socialButtonsBlockButtonText: "text-[#1A2E05] font-medium",
    formButtonPrimary:
      "bg-[#2D4A0F] text-white hover:bg-primary-mid rounded-full shadow-none normal-case",
    formFieldInput:
      "bg-[#F0F4EB] border-0 text-[#1A2E05] shadow-none focus:ring-2 focus:ring-[#2D4A0F]/20",
    formFieldInputShowPasswordButton: "text-strivo-secondary",
    footerActionLink: "text-primary hover:text-primary-mid",
    identityPreviewEditButton: "text-primary",
    formFieldLabel: "text-strivo-text font-medium",
    dividerLine: "bg-strivo-muted",
    dividerText: "text-strivo-secondary",
    alert: "rounded-xl",
  },
};

export const clerkLocalization = {
  signIn: {
    start: {
      title: "Welcome back",
      subtitle: "Sign in",
    },
  },
  signUp: {
    start: {
      title: "Join Strivo",
      subtitle: "Create your account",
    },
  },
};
