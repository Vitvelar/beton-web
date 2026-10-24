import { z } from "zod/v4";

const contactFields = {
  nafn: z.string().min(1, "Nafn er nauðsynlegt"),
  netfang: z.email("Ógilt netfang"),
  simanumer: z.string().optional(),
  // Valfrjálst. react-hook-form skilar null fyrir óvalinn radio-hóp — .optional()
  // hafnaði því og formið sendi ekkert (villan birtist hvergi) frá 2026-05-20.
  samskipti: z
    .enum(["hringja", "tolvupostur"], { error: "Veldu hringja eða tölvupóst" })
    .nullish(),
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
