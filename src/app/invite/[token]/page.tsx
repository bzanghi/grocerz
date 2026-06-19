"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const { token } = await params;
      router.replace(`/setup?invite=${token}`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  return null;
}
