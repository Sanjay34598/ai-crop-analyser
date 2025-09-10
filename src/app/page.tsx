"use client";

import Header from "@/components/Header";
import SoilAnalyzer from "@/components/SoilAnalyzer";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <SoilAnalyzer />
      </main>
    </div>
  );
}
