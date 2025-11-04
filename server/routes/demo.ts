import { RequestHandler } from "express";

interface DemoConfigResponse {
  demoMode: boolean;
  requiresUserApiKey: boolean;
  message: string;
}

export const handleDemo: RequestHandler = (req, res) => {
  // Check for both DEMO and Demo (case-insensitive)
  const demoMode =
    process.env.DEMO === "true" || process.env.Demo === "true";

  const response: DemoConfigResponse = {
    demoMode,
    requiresUserApiKey: demoMode,
    message: demoMode
      ? "Demo mode enabled: Users can provide their own Fashion.ai API keys"
      : "Demo mode disabled: System API key will be used for all generations",
  };

  console.log("[DemoConfig] demoMode:", demoMode, "- DEMO env:", process.env.DEMO, "- Demo env:", process.env.Demo);
  console.log("[DemoConfig]", response.message);
  res.status(200).json(response);
};
