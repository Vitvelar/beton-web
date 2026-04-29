import { Resend } from "resend";
import { contactSubmissionSchema } from "@/lib/schemas";

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "beton@betonehf.is";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = contactSubmissionSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: "Ógild gögn. Vinsamlegast athugaðu reitina." },
        { status: 400 }
      );
    }

    const { nafn, netfang, simanumer, skilabod, website } = result.data;

    // Honeypot check — bots fill this in, humans don't
    if (website && website.length > 0) {
      return Response.json({ success: true });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not set");
      return Response.json(
        { error: "Tölvupóstsþjónusta er ekki stillt. Reyndu aftur síðar." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "Beton vefsíða <onboarding@resend.dev>",
      to: CONTACT_EMAIL,
      replyTo: netfang,
      subject: `Ný fyrirspurn frá ${nafn}`,
      text: [
        `Nafn: ${nafn}`,
        `Netfang: ${netfang}`,
        simanumer ? `Símanúmer: ${simanumer}` : null,
        "",
        "Skilaboð:",
        skilabod,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return Response.json(
      { error: "Villa kom upp við sendingu. Reyndu aftur síðar." },
      { status: 500 }
    );
  }
}
