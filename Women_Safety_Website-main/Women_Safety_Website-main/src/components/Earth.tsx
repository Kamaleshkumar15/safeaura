import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  
  const [colorMap, normalMap, specularMap, cloudsMap] = useTexture([
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
  ]);

  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group>
      {/* Earth - Reduced size from 2 to 1.5 */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          shininess={5}
        />
      </mesh>
      
      {/* Clouds - Adjusted proportionally */}
      <mesh>
        <sphereGeometry args={[1.505, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.4}
        />
      </mesh>

      {/* Atmosphere - Adjusted proportionally */}
      <mesh>
        <sphereGeometry args={[1.55, 64, 64]} />
        <meshPhongMaterial
          color={new THREE.Color(0x4444ff)}
          transparent={true}
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}