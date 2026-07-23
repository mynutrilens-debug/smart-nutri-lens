import { c as createSsrRpc } from "./router-D-2d6VGp.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as createServerFn } from "./server-BadC42R4.js";
const ScanInput = z.object({
  image_base64: z.string().min(50),
  mime_type: z.string().regex(/^image\/(jpeg|png|webp|heic|heif)$/),
  hint: z.string().max(200).optional()
});
const analyzeFood = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => ScanInput.parse(d)).handler(createSsrRpc("b693696f56473fcf7fa0b9dcdf7ef61be0370e1d490508a83409f42a39e1373d"));
const generateInsight = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("13ed6f0e334bf96b543d440d5ea6dff125ac4e36f6961db1422a2ebf4b08617f"));
export {
  analyzeFood as a,
  generateInsight as g
};
