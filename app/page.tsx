// app/page.tsx (Direct în folderul app)
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Forțăm redirecționarea utilizatorului către limba default (română)
  redirect('/ro');
}