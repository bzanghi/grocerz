"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PostAuth() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/profile", { method: "POST" }).finally(() => {
      router.replace("/setup");
    });
  }, [router]);
  return null;
}
