// Shared Zod schemas. Client forms and API routes both import from here so
// the browser and the server reject exactly the same bad input.

import { z } from "zod";

export const roleSchema = z.enum(["owner", "admin", "member", "viewer"]);
export const contractStatusSchema = z.enum([
  "draft",
  "active",
  "expiring",
  "expired",
  "terminated",
]);
export const milestoneStatusSchema = z.enum([
  "pending",
  "in_progress",
  "done",
  "overdue",
]);
export const clauseTypeSchema = z.enum([
  "payment_terms",
  "termination",
  "auto_renewal",
  "liability_cap",
  "other",
]);
export const riskLevelSchema = z.enum(["low", "medium", "high"]);

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
  orgName: z.string().min(2, "Organization name is required").max(100),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const clientSchema = z.object({
  name: z.string().min(1, "Client name is required").max(200),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactName: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
});
export type ClientInput = z.infer<typeof clientSchema>;

export const contractSchema = z
  .object({
    clientId: z.string().cuid(),
    title: z.string().min(1, "Title is required").max(300),
    status: contractStatusSchema.default("draft"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    autoRenews: z.boolean().default(false),
    renewalNoticeDays: z.number().int().min(0).max(365).optional().nullable(),
    valueAmount: z.number().nonnegative().optional().nullable(),
    valueCurrency: z.string().length(3).default("USD"),
    fileUrl: z.string().url().optional().nullable(),
  })
  .refine(
    (data) => !data.endDate || data.endDate >= data.startDate,
    { message: "End date must be on or after the start date", path: ["endDate"] }
  )
  .refine(
    (data) => !data.autoRenews || data.renewalNoticeDays != null,
    { message: "Renewal notice period is required when auto-renew is on", path: ["renewalNoticeDays"] }
  );
export type ContractInput = z.infer<typeof contractSchema>;

export const milestoneSchema = z.object({
  contractId: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(300),
  dueDate: z.coerce.date(),
  status: milestoneStatusSchema.default("pending"),
  amount: z.number().nonnegative().optional().nullable(),
});
export type MilestoneInput = z.infer<typeof milestoneSchema>;

export const clauseFlagSchema = z.object({
  contractId: z.string().cuid(),
  clauseType: clauseTypeSchema,
  extractedText: z.string().min(1).max(2000),
  riskLevel: riskLevelSchema.default("medium"),
  aiConfidence: z.number().min(0).max(1).optional().nullable(),
});
export type ClauseFlagInput = z.infer<typeof clauseFlagSchema>;

// Query params for the contracts list — mirrored into the URL so filter
// state is shareable and survives the back button.
export const contractQuerySchema = z.object({
  q: z.string().max(200).optional(),
  status: contractStatusSchema.optional(),
  clientId: z.string().cuid().optional(),
  sort: z.enum(["endDate", "value", "createdAt"]).default("endDate"),
  order: z.enum(["asc", "desc"]).default("asc"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type ContractQuery = z.infer<typeof contractQuerySchema>;
