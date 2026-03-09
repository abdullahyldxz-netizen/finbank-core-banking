import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';

function AnimatedOrb({ color, distort = 0.4, speed = 2 }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
        }
    });

    return (
        <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.5}>
            <MeshDistortMaterial
                color={color}
                envMapIntensity={1}
                clearcoat={1}
                clearcoatRoughness={0.1}
                metalness={0.5}
                roughness={0.2}
                distort={distort}
                speed={speed}
            />
        </Sphere>
    );
}

export default function BalanceOrb3D({ color = "#3b82f6", className = "w-32 h-32" }) {
    return (
        <div className={`relative ${className} pointer-events-none`}>
            <Canvas camera={{ position: [0, 0, 3] }} gl={{ alpha: true }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />
                <directionalLight position={[-10, -10, -5]} intensity={0.5} color={color} />
                <AnimatedOrb color={color} />
            </Canvas>
        </div>
    );
}
