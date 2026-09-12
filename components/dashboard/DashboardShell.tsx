'use client';

import { useGeneratedImages } from '@/lib/gallery/useGeneratedImages';
import Navbar from './Navbar';
import PromptArea from './PromptArea';
import Sidebar from './Sidebar';

type DashboardShellProps = {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  plan: string;
};

/* ────────────────────────────────────────────────────────────
   Client-side shell for the dashboard: owns the generated-image
   gallery state (backed by Supabase) and wires it between the
   Sidebar (reads it) and PromptArea (appends to it, and reads it
   too — for the "attach from my thumbnails" reference picker).
   ──────────────────────────────────────────────────────────── */
export function DashboardShell({ userId, fullName, avatarUrl, plan }: DashboardShellProps) {
  const { images, addImage } = useGeneratedImages(userId);

  return (
    <>
      <Navbar fullName={fullName} avatarUrl={avatarUrl} plan={plan} />
      <Sidebar images={images} />
      <div className="dash__stage">
        <PromptArea images={images} onImageGenerated={addImage} />
      </div>
    </>
  );
}

export default DashboardShell;
