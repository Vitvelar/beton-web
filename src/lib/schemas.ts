import { z } from "zod/v4";

export const contactSchema = z.object({
  nafn: z.string().min(1, "Nafn er nauðsynlegt"),
  netfang: z.email("Ógilt netfang"),
  simanumer: z.string().optional(),
  skilabod: z.string().min(1, "Skilaboð eru nauðsynleg"),
  // Honeypot field — should always be empty
  website: z.string().max(0).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
