import { Html, useProgress } from "@react-three/drei";

const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ color: "black", fontSize: "2rem" }}>
        Yuklanmoqda... {progress.toFixed(0)}%
      </div>
    </Html>
  );
};

export default Loader;
