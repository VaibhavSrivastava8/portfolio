"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const Scene3D = dynamic(() => import("./Scene3D"), {
  ssr: false,
  loading: () => null,
});

export default function SceneLoader() {
  return (
    <Suspense fallback={null}>
      <Scene3D />
    </Suspense>
  );
}
