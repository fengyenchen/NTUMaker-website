"use client";

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { MathUtils, type Group } from "three";

function CrownCork({ reducedMotion }: { reducedMotion: boolean }) {
  const { scene } = useGLTF("/crownCork.glb");
  const model = useRef<Group>(null);

  useFrame((state) => {
    if (!model.current || reducedMotion) return;
    const elapsed = state.clock.getElapsedTime();
    model.current.position.y = 0.06 * Math.sin(elapsed);
    model.current.position.x = 0.03 * Math.cos(elapsed * 0.8);
    model.current.rotation.x = MathUtils.lerp(model.current.rotation.x, 0.2 * state.pointer.y, 0.05);
    model.current.rotation.z = MathUtils.lerp(model.current.rotation.z, 0.23 * state.pointer.x, 0.05);
  });

  return <primitive ref={model} object={scene} />;
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={[1, 3, 1]} intensity={2} />
      <directionalLight position={[3.8, 1.5, -1]} intensity={4} />
      <directionalLight position={[0, 1.5, 1]} intensity={1} />
      <directionalLight position={[-2, 0.5, -3]} intensity={4} />
      <pointLight position={[-1, 0, 2]} intensity={6} />
      <pointLight position={[2, 1, 1]} intensity={3} color="#a9572c" />
    </>
  );
}

export function BottleCapScene() {
  const [mobile, setMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMobile(media.matches);
    const updateMotion = () => setReducedMotion(motionMedia.matches);
    update();
    updateMotion();
    media.addEventListener("change", update);
    motionMedia.addEventListener("change", updateMotion);
    return () => {
      media.removeEventListener("change", update);
      motionMedia.removeEventListener("change", updateMotion);
    };
  }, []);

  useEffect(() => {
    if (!container.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} className="relative h-full min-h-90 w-full" aria-label="會隨游標輕微傾斜的 NTUMaker 瓶蓋模型" role="img">
      <Canvas
        camera={{ position: mobile ? [1.4, 4.8, 2.8] : [1.2, 4.6, 2.6], fov: mobile ? 48 : 45 }}
        dpr={[1, 1.5]}
        frameloop={reducedMotion || !visible ? "demand" : "always"}
        gl={{ antialias: true, alpha: true }}
      >
        <SceneLights />
        <Suspense fallback={null}><CrownCork reducedMotion={reducedMotion} /></Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/crownCork.glb");
