'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Inițializăm clienții cu variabilele de mediu necesare
const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

/**
 * Trimite un email personalizat de resetare a parolei.
 * Folosește Admin API pentru a genera un link de tip 'recovery' 
 * cu redirect către ruta ta de update-password.
 */
export async function sendCustomResetEmail(email: string, locale: string) {
  // 1. Definim URL-ul unde dorim să ajungă utilizatorul după click
  const redirectTo = `https://www.qrate.md/${locale}/auth/update-password`;

  // 2. Generăm link-ul prin Admin API
  // Opțiunea 'redirectTo' forțează Supabase să anexeze token-ul la URL-ul nostru
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

  // 3. Link-ul complet (cu tot cu token/hash) este disponibil în action_link
  const resetLink = data.properties.action_link;

  // 4. Trimitem email-ul prin Resend
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
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Dacă butonul nu funcționează, copiază și lipește următorul link în browser:<br/>
            <span style="word-break: break-all;">${resetLink}</span>
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Resend Error:", emailError);
    throw new Error("Eroare la trimiterea email-ului.");
  }

  return { success: true };
}