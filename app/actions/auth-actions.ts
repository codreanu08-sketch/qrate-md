'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function sendCustomResetEmail(email: string, locale: string) {
  // 1. Generăm link-ul folosind opțiunea 'redirectTo'
  // Astfel, Supabase va construi el link-ul corect cu codul inclus
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: email,
    options: {
      redirectTo: `https://www.qrate.md/${locale}/auth/update-password`,
    },
  });

  if (error) {
    console.error("Supabase Admin Error:", error);
    throw error;
  }

  // 2. Acum 'data.properties.action_link' conține URL-ul perfect
  // Ex: https://qrate.md/ro/auth/update-password?code=12345...
  const resetLink = data.properties.action_link;

  // 3. Trimitem prin Resend
  await resend.emails.send({
    from: '"Qrate.md" <hello@qrate.md>',
    to: [email],
    subject: 'Resetează parola',
    html: `
      <h2>Resetare Parolă</h2>
      <p>Click pe butonul de mai jos pentru a-ți schimba parola:</p>
      <a href="${resetLink}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Resetare Parolă</a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">
        Dacă butonul nu funcționează, accesează: ${resetLink}
      </p>
    `,
  });

  return { success: true };
}