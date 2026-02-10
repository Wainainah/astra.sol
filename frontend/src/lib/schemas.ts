import { z } from "zod";

export const createTokenSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(32, "Name must be at most 32 characters"),
  ticker: z
    .string()
    .min(3, "Ticker must be at least 3 characters")
    .max(10, "Ticker must be at most 10 characters"),
  description: z.string(),
  image: z.any().nullable().optional(),
  twitter: z.string(),
  telegram: z.string(),
  website: z.string(),
});

export type CreateTokenFormData = z.infer<typeof createTokenSchema>;
