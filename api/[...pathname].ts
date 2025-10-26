// This file has been replaced by api/[[...pathname]].ts
// The double brackets [[...pathname]] properly catch all routes with multiple segments
// (e.g., /api/video-status/56), while single brackets [pathname] only match one segment.

export default function handler(req: any, res: any) {
  res.status(404).json({
    error: "This route is deprecated. Use api/[[...pathname]].ts instead.",
  });
}
