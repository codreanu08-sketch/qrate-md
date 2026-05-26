'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function sendCustomResetEmail(email: string, locale: string) {
  // 1. Generăm link-ul de resetare securizat
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: email,
  });

  if (error) throw error;

  // 2. Construim URL-ul nostru personalizat folosind token-ul de la Supabase
  // Extragem hash-ul din link-ul generat sau folosim token-ul direct
  const resetLink = `https://www.qrate.md/${locale}/auth/update-password?code=${data.properties.hashed_token}`;

  // 3. Trimitem prin Resend
  await resend.emails.send({
    from: '"Qrate.md" <hello@qrate.md>',
    to: [email],
    subject: 'Resetează parola',
    html: `
      <h2>Resetare Parolă</h2>
      <p>Click pe butonul de mai jos pentru a-ți schimba parola:</p>
      <a href="${resetLink}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Resetare Parolă</a>
    `,
  });

  return { success: true };
}