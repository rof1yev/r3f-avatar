import { Environment, useTexture } from "@react-three/drei";
import Avatar from "./avatar";
import { useThree } from "@react-three/fiber";

const Experience = () => {
  const texture = useTexture("/texture/background.jpg");
  const viewport = useThree((state) => state.viewport);

  return (
    <>
      {/* <OrbitControls  /> */}
      <Avatar position={[0, -3, 5]} scale={2} />
      <Environment preset="sunset" />
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};

export default Experience;
