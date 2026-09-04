import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/dashboard/Navbar';
import PromptArea from '@/components/dashboard/PromptArea';

/* ────────────────────────────────────────────────────────────
   Dashboard — where a signed-in user lands after Google sign-in.
   Server-guarded: no session -> straight to /auth, no flash of
   protected content.
   Design: #181818 canvas with a subtle line grid (editor-canvas
   feel), two floating nav buttons (logo / profile), and a large
   centered PromptArea to describe the thumbnail to generate.
   ──────────────────────────────────────────────────────────── */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const fullName: string | null =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;
  const avatarUrl: string | null =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;

  return (
    <main className="dash">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');

        .dash {
          position: relative;
          min-height: 100vh;
          background-color: #181818;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 32px 32px;
          color: #fff;
        }
        .dash__stage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 24px 48px;
        }
      `}</style>

      <Navbar fullName={fullName} avatarUrl={avatarUrl} />

      <div className="dash__stage">
        <PromptArea />
      </div>
    </main>
  );
}
