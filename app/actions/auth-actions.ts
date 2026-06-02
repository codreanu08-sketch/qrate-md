'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendWelcomeEmail(email: string, locale: string) {
  const dashboardUrl = `https://www.qrate.md/${locale}/dashboard`;
  const isRu = locale === 'ru';

  await resend.emails.send({
    from: '"QRate.md" <hello@qrate.md>',
    to: [email],
    subject: isRu ? 'Bun venit la QRate.md!' : 'Bun venit la QRate.md!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #0f172a; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -1px;">
            QRate<span style="color: #3b82f6;">.MD</span>
          </h1>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="color: #0f172a; font-size: 22px; font-weight: 900; margin: 0 0 16px;">
            ${isRu ? 'Contul tău a fost creat!' : 'Contul tău a fost creat!'}
          </h2>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            ${isRu
              ? 'Bun venit pe platforma QRate.md. Contul tău este activ și poți începe să colectezi recenzii.'
              : 'Bun venit pe platforma QRate.md. Contul tău este activ și poți începe să colectezi recenzii.'}
          </p>
          <a href="${dashboardUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 14px; letter-spacing: 0.5px;">
            ${isRu ? 'Mergi la Dashboard' : 'Mergi la Dashboard'}
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin: 32px 0 0;">
            ${isRu ? 'Dacă nu ai creat acest cont, ignoră acest email.' : 'Dacă nu ai creat acest cont, ignoră acest email.'}
          </p>
        </div>
        <div style="background: #f8fafc; padding: 20px 32px; border-radius: 0 0 16px 16px; text-align: center;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">QR RATING S.R.L. · suport@qrate.md · 068 688 484</p>
        </div>
      </div>
    `,
  });

  return { success: true };
}

export async function sendCustomResetEmail(email: string, locale: string) {
  // URL-ul final pentru producție
  const redirectTo = `https://www.qrate.md/${locale}/auth/update-password`;

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: email,
    options: {
      redirectTo: redirectTo,
    },
  });

  if (error) {
    console.error("Supabase Admin Error:", error);
    throw new Error("Nu am putut genera link-ul de resetare.");
  }

  const resetLink = data.properties.action_link;

  try {
    await resend.emails.send({
      from: '"Qrate.md" <hello@qrate.md>',
      to: [email],
      subject: 'Resetează parola',
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2>Resetare Parolă</h2>
          <p>Click pe butonul de mai jos pentru a-ți schimba parola:</p>
          <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Resetare Parolă</a>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Resend Error:", emailError);
    throw new Error("Eroare la trimiterea email-ului.");
  }

  return { success: true };
}