import { createHash } from "node:crypto";
import { Resend } from "resend";
import { waitlistSubmissionSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase/service";
import { BRANDS } from "@/lib/brand";

// Rondva biðlisti. Skráning fer í public.rondva_waitlist (service role, RLS
// lokar töflunni fyrir anon/authenticated). Tilkynningarpóstur er „best
// effort" — ef Resend fellur telst skráningin samt tekist, hún er í töflunni.
//
// Ekkert staðfestingarbréf er sent til skráðs aðila enn: rondva.com er ekki
// staðfest sendandalén hjá Resend. Sjá plan/rondva/HANDOFF.md §9C.

const NOTIFY_EMAIL = process.env.RONDVA_NOTIFY_EMAIL || BRANDS.rondva.contactEmail;
const FROM_EMAIL = process.env.RESEND_FROM;

function hashIp(request: Request): string | null {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  if (!ip) return null;
  // Aðeins til að telja tvítekningar — ekki geymt á auðkennanlegu formi.
  return createHash("sha256").update(`rondva:${ip}`).digest("hex").slice(0, 32);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = waitlistSubmissionSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { error: "Please check the email and country fields." },
        { status: 400 }
      );
    }

    const { email, country, website } = result.data;

    // Honeypot — vélmenni fylla þetta út, fólk ekki.
    if (website && website.length > 0) {
      return Response.json({ success: true });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let supabase;
    try {
      supabase = createServiceClient();
    } catch (error) {
      console.error("Waitlist: service client unavailable:", error);
      return Response.json(
        { error: "The waitlist is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase
      .from("rondva_waitlist")
      .insert({
        email: normalizedEmail,
        country,
        source: "rondva.com",
        user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
        ip_hash: hashIp(request),
      });

    // 23505 = unique_violation: netfangið er þegar á listanum. Svörum eins og
    // skráning hafi tekist svo ekki sé hægt að fletta upp hverjir eru á listanum.
    if (insertError && insertError.code !== "23505") {
      console.error("Waitlist insert failed:", insertError);
      return Response.json(
        { error: "Something went wrong saving your place. Please try again." },
        { status: 500 }
      );
    }

    const isNew = !insertError;
    const apiKey = process.env.RESEND_API_KEY;
    if (isNew && apiKey && FROM_EMAIL) {
      try {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: FROM_EMAIL,
          to: NOTIFY_EMAIL,
          subject: `Rondva waitlist: ${normalizedEmail} (${country})`,
          text: [
            "New Rondva waitlist signup",
            "",
            `Email:   ${normalizedEmail}`,
            `Country: ${country}`,
            `Source:  rondva.com`,
            `Time:    ${new Date().toISOString()}`,
          ].join("\n"),
        });
      } catch (error) {
        console.error("Waitlist notification email failed:", error);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
