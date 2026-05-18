// app/page.tsx (Direct în folderul app)
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Trimitem utilizatorul direct pe varianta în română
  redirect('/ro');
}