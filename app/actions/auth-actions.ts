'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

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