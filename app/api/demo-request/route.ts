import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, message } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Ad ve e-posta zorunludur" },
        { status: 400 }
      );
    }

    // Send email using a simple fetch to an email service
    // For production, you'd use services like Resend, SendGrid, or Nodemailer

    // For now, we'll create the email content and log it
    // In production, replace this with actual email sending
    const emailContent = {
      to: "brainfo@brainarts.com.tr",
      subject: `Demo Talebi: ${name} - ${company || "Şirket belirtilmedi"}`,
      html: `
        <h2>Yeni Demo Talebi</h2>
        <p><strong>Ad Soyad:</strong> ${name}</p>
        <p><strong>E-posta:</strong> ${email}</p>
        <p><strong>Şirket:</strong> ${company || "Belirtilmedi"}</p>
        <p><strong>Mesaj:</strong></p>
        <p>${message || "Mesaj yok"}</p>
        <hr>
        <p><em>Bu e-posta BrainArts web sitesinden gönderilmiştir.</em></p>
      `,
    };

    console.log("Demo request received:", emailContent);

    // TODO: Implement actual email sending with your preferred service
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@brainarts.com.tr',
    //   to: 'brainfo@brainarts.com.tr',
    //   subject: emailContent.subject,
    //   html: emailContent.html,
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing demo request:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
