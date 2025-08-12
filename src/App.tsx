import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Experience from "./components/experience";
import Loader from "./components/loader";

const App = () => {
  return (
    <div className="relative w-screen h-screen">
      <Canvas
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%" }}
        shadows
        camera={{ position: [0, 0, 10], fov: 30 }}
      >
        <color attach="background" args={["#ececec"]} />
        <Suspense fallback={<Loader />}>
          <Experience />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default App;
