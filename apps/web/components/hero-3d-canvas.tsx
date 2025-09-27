'use client';

import { useEffect, useRef } from 'react';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
  CylinderGeometry,
  TorusGeometry,
  BoxGeometry,
  IcosahedronGeometry,
  Clock,
  SRGBColorSpace,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type AnimatedMeshes = {
  floatingCup?: Mesh;
  steam?: Group;
};

export default function Hero3DCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const width = container.clientWidth || container.offsetWidth || 600;
    const height = container.clientHeight || container.offsetHeight || 400;

    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.outputColorSpace = SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.background = new Color('#f7ede2');

    const camera = new PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(2.6, 1.6, 3.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;

    const warmAmbient = new AmbientLight('#fff4e0', 0.9);
    const mainLight = new DirectionalLight('#ffd9a0', 1.1);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    const rimLight = new DirectionalLight('#f0cfa0', 0.4);
    rimLight.position.set(-4, 3, -2);

    scene.add(warmAmbient, mainLight, rimLight);

    const materials: MeshStandardMaterial[] = [];
    const geometries: (
      PlaneGeometry | CylinderGeometry | TorusGeometry | BoxGeometry | IcosahedronGeometry
    )[] = [];

    const createWarmMaterial = (color: string, metalness = 0.1, roughness = 0.4) => {
      const material = new MeshStandardMaterial({
        color: new Color(color),
        metalness,
        roughness,
      });
      materials.push(material);
      return material;
    };

    const disposables: Mesh[] = [];
    const heroGroup = new Group();
    heroGroup.position.set(0, -0.2, 0);

    const tableTopGeometry = new CylinderGeometry(1.6, 1.6, 0.18, 48);
    const tableTop = new Mesh(tableTopGeometry, createWarmMaterial('#8c5a3b', 0.15, 0.5));
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    geometries.push(tableTopGeometry);
    disposables.push(tableTop);

    const tableStemGeometry = new CylinderGeometry(0.35, 0.5, 1.3, 32);
    const tableStem = new Mesh(tableStemGeometry, createWarmMaterial('#5b3b27', 0.1, 0.7));
    tableStem.position.set(0, -0.65, 0);
    tableStem.receiveShadow = true;
    geometries.push(tableStemGeometry);
    disposables.push(tableStem);

    const clothGeometry = new PlaneGeometry(3, 2, 20, 20);
    const cloth = new Mesh(clothGeometry, createWarmMaterial('#b77945', 0.05, 0.6));
    cloth.rotation.x = -Math.PI / 2;
    cloth.position.set(0, -0.25, 0);
    cloth.receiveShadow = true;
    geometries.push(clothGeometry);
    disposables.push(cloth);

    const menuBlockGeometry = new BoxGeometry(0.5, 0.3, 0.5);
    const menuBlock = new Mesh(menuBlockGeometry, createWarmMaterial('#c49a6c', 0.2, 0.45));
    menuBlock.position.set(-0.4, -0.15, 0);
    menuBlock.rotation.y = Math.PI / 6;
    menuBlock.castShadow = true;
    menuBlock.receiveShadow = true;
    geometries.push(menuBlockGeometry);
    disposables.push(menuBlock);

    const menuPosterGeometry = new PlaneGeometry(0.48, 0.48);
    const menuPoster = new Mesh(menuPosterGeometry, createWarmMaterial('#f4ece0', 0.05, 0.3));
    menuPoster.position.set(-0.4, 0.15, 0.12);
    menuPoster.castShadow = true;
    geometries.push(menuPosterGeometry);
    disposables.push(menuPoster);

    const cupBodyGeometry = new CylinderGeometry(0.25, 0.28, 0.4, 32);
    const floatingCup = new Mesh(cupBodyGeometry, createWarmMaterial('#d9c5a1', 0.05, 0.3));
    floatingCup.castShadow = true;
    floatingCup.receiveShadow = true;
    floatingCup.position.set(0.65, -0.1, 0);
    geometries.push(cupBodyGeometry);
    disposables.push(floatingCup);

    const cupRingGeometry = new TorusGeometry(0.18, 0.04, 16, 100);
    const cupRing = new Mesh(cupRingGeometry, createWarmMaterial('#e6d3b5', 0.05, 0.25));
    cupRing.position.set(0.65, 0.15, 0);
    cupRing.castShadow = true;
    geometries.push(cupRingGeometry);
    disposables.push(cupRing);

    const steam = new Group();
    steam.position.set(0.65, 0.35, 0);
    const steamGeometry = new IcosahedronGeometry(0.12, 1);
    for (let i = 0; i < 3; i += 1) {
      const puff = new Mesh(steamGeometry, createWarmMaterial('#f7ede2', 0, 0.1));
      puff.castShadow = true;
      puff.position.set(0, i * 0.08, 0);
      steam.add(puff);
    }
    geometries.push(steamGeometry);

    const heroObjects: AnimatedMeshes = {
      floatingCup,
      steam,
    };

    heroGroup.add(tableTop, tableStem, cloth, menuBlock, menuPoster, floatingCup, cupRing, steam);
    scene.add(heroGroup);

    const clock = new Clock();
    let animationFrame = 0;

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      if (heroObjects.floatingCup) {
        heroObjects.floatingCup.rotation.y = elapsed * 0.4;
        heroObjects.floatingCup.position.y = -0.4 + Math.sin(elapsed * 1.2) * 0.05;
      }

      if (heroObjects.steam) {
        heroObjects.steam.children.forEach((child, index) => {
          child.position.y = -0.05 + (index + 1) * 0.08 + Math.sin(elapsed * 2 + index) * 0.02;
          child.rotation.y = Math.sin(elapsed * 1.5 + index) * 0.2;
          child.scale.setScalar(0.4 + Math.sin(elapsed * 1.3 + index) * 0.05);
        });
      }

      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || container.offsetWidth || width;
      const newHeight = container.clientHeight || container.offsetHeight || height;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      scene.clear();
      materials.forEach((material) => material.dispose());
      geometries.forEach((geometry) => geometry.dispose());
      disposables.forEach((mesh) => mesh.removeFromParent());
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" aria-hidden />;
}
