import { c as createSsrRpc } from "./router-D-2d6VGp.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as createServerFn } from "./server-BadC42R4.js";
const CHALLENGE_TYPES = ["weight_loss", "muscle_gain", "steps", "healthy_eating", "workout", "hydration", "sleep", "custom"];
const createSquad = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  name: z.string().trim().min(2).max(60),
  challenge_type: z.enum(CHALLENGE_TYPES),
  custom_challenge: z.string().trim().max(80).optional().nullable(),
  goal_description: z.string().trim().max(200).optional().nullable(),
  goal_target: z.number().finite().optional().nullable(),
  period: z.enum(["weekly", "monthly"]).default("weekly")
}).parse(d)).handler(createSsrRpc("5efc2b2c9b24fa77cd6095b41f7155ff7c36c42324ebfdddb946f79799565e81"));
const joinSquadByCode = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  code: z.string().trim().min(4).max(12)
}).parse(d)).handler(createSsrRpc("c3dc46127f14a54e7df138d417a5ac37e40d1481f9920cc4687cc8f0d64e3a8a"));
const leaveSquad = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  squad_id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("bd0f77e53ca2928c1bce18ffa2537a04bcab3b61c6c7df4ac705be8cdfc33cda"));
const listMySquads = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("fbca84a5f7c8c34c8852bd37909635ee2fcb13502503849634b462e079603d95"));
const getSquadLeaderboard = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  squad_id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("1fa5bcc52ae09f201067ac28ab7ab87f76e09369c90fe71b7aaa7356bd99e361"));
const finalizeSquad = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  squad_id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("64432c48bc99a3e7da4ea75101b45ff162aa0b9ced9537ef850bd08c06da60bf"));
createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("f1e215f0428b914f7ce03e1a28dd627184b27500ce91575c3e680834c4970718"));
export {
  leaveSquad as a,
  createSquad as c,
  finalizeSquad as f,
  getSquadLeaderboard as g,
  joinSquadByCode as j,
  listMySquads as l
};
