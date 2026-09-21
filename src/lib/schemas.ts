import { z } from "zod/v4";

const contactFields = {
  nafn: z.string().min(1, "Nafn er nauðsynlegt"),
  netfang: z.email("Ógilt netfang"),
  simanumer: z.string().optional(),
  samskipti: z.enum(["hringja", "tolvupostur"]).optional(),
  skilabod: z.string().min(1, "Skilaboð eru nauðsynleg"),
};

export const contactSchema = z.object({
  ...contactFields,
  // Honeypot field — should always be empty
  website: z.string().max(0).optional(),
});

export const contactSubmissionSchema = z.object({
  ...contactFields,
  website: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// Rondva biðlisti (rondva.com). Enska — villuboð birtast notanda.
const waitlistFields = {
  email: z.email("Please enter a valid email address").max(254),
  country: z
    .string()
    .trim()
    .min(2, "Tell us which country you inspect in")
    .max(80, "Please keep this under 80 characters"),
};

export const waitlistSchema = z.object({
  ...waitlistFields,
  // Honeypot — must stay empty
  website: z.string().max(0).optional(),
});

export const waitlistSubmissionSchema = z.object({
  ...waitlistFields,
  website: z.string().optional(),
});

export type WaitlistFormData = z.infer<typeof waitlistSchema>;
