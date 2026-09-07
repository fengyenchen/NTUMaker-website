"use client";

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { MathUtils, type Group } from "three";

function CrownCork() {
  const { scene } = useGLTF("/crownCork.glb");
  const model = useRef<Group>(null);

  useFrame((state) => {
    if (!model.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const elapsed = state.clock.getElapsedTime();
    model.current.position.y = 0.04 * Math.sin(elapsed);
    model.current.position.x = 0.02 * Math.cos(elapsed * 0.8);
    model.current.rotation.x = MathUtils.lerp(model.current.rotation.x, 0.15 * state.pointer.y, 0.05);
    model.current.rotation.z = MathUtils.lerp(model.current.rotation.z, 0.175 * state.pointer.x, 0.05);
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

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div className="relative h-full min-h-90 w-full" aria-label="會隨游標輕微傾斜的 NTUMaker 瓶蓋模型" role="img">
      <Canvas
        camera={{ position: mobile ? [1.4, 4.8, 2.8] : [1.2, 4.6, 2.6], fov: mobile ? 48 : 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <SceneLights />
        <Suspense fallback={null}><CrownCork /></Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/crownCork.glb");
