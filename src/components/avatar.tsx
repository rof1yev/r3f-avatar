import * as THREE from "three";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useGraph, useLoader } from "@react-three/fiber";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import type { GLTF } from "three-stdlib";
import { useControls } from "leva";

type GLTFResult = GLTF & {
  nodes: {
    Wolf3D_Hair: THREE.SkinnedMesh;
    Wolf3D_Body: THREE.SkinnedMesh;
    Wolf3D_Outfit_Bottom: THREE.SkinnedMesh;
    Wolf3D_Outfit_Footwear: THREE.SkinnedMesh;
    Wolf3D_Outfit_Top: THREE.SkinnedMesh;
    EyeLeft: THREE.SkinnedMesh;
    EyeRight: THREE.SkinnedMesh;
    Wolf3D_Head: THREE.SkinnedMesh;
    Wolf3D_Teeth: THREE.SkinnedMesh;
    Hips: THREE.Bone;
  };
  materials: {
    Wolf3D_Hair: THREE.MeshStandardMaterial;
    Wolf3D_Body: THREE.MeshStandardMaterial;
    Wolf3D_Outfit_Bottom: THREE.MeshStandardMaterial;
    Wolf3D_Outfit_Footwear: THREE.MeshStandardMaterial;
    Wolf3D_Outfit_Top: THREE.MeshStandardMaterial;
    Wolf3D_Eye: THREE.MeshStandardMaterial;
    Wolf3D_Skin: THREE.MeshStandardMaterial;
    Wolf3D_Teeth: THREE.MeshStandardMaterial;
  };
  animations: THREE.AnimationClip[];
};

type GroupProps = React.ComponentPropsWithoutRef<"group">;
type GraphResult = {
  nodes: GLTFResult["nodes"];
  materials: GLTFResult["materials"];
};

type ANIMATION_NAME = "Angry" | "Idle" | "Greeting";

const corresponding: Record<string, string> = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

function normalizeMixamoTracks(animation: THREE.AnimationClip) {
  animation.tracks.forEach((track: THREE.KeyframeTrack) => {
    const [boneName, property] = track.name.split(".");
    track.name = boneName.replace(/^mixamorig/i, "") + "." + property;
  });
  return animation;
}
function removeHipsPositionTracks(animation: THREE.AnimationClip) {
  animation.tracks = animation.tracks.filter(
    (track) => !track.name.includes("Hips.position")
  );
  return animation;
}

const Avatar: React.FC<GroupProps> = (props) => {
  const { palyAudio, script } = useControls({
    palyAudio: false,
    script: {
      value: "welcome",
      options: ["welcome"],
    },
  });

  const audio = useMemo(() => new Audio(`/audios/${script}.mp3`), [script]);
  const jsonFile = useLoader(
    THREE.FileLoader,
    `/audios/${script}.json`
  ) as string;
  const lipsync = JSON.parse(jsonFile);

  const { scene } = useGLTF("/medias/6898c258275d5cb372a1faf5.glb");
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone) as unknown as GraphResult;

  const { animations: idleAnimations } = useFBX("/animations/Idle.fbx");
  const { animations: angryAnimations } = useFBX("/animations/angry.fbx");
  const { animations: greetingAnimations } = useFBX("/animations/greeting.fbx");

  normalizeMixamoTracks(idleAnimations[0]);
  removeHipsPositionTracks(idleAnimations[0]);
  normalizeMixamoTracks(angryAnimations[0]);
  removeHipsPositionTracks(angryAnimations[0]);
  normalizeMixamoTracks(greetingAnimations[0]);
  removeHipsPositionTracks(greetingAnimations[0]);

  idleAnimations[0].name = "Idle";
  angryAnimations[0].name = "Angry";
  greetingAnimations[0].name = "Greeting";

  const [animation, setAnimation] = useState<ANIMATION_NAME>("Idle");

  const group = useRef<THREE.Group>(null);

  const { actions } = useAnimations(
    [idleAnimations[0], angryAnimations[0], greetingAnimations[0]],
    group
  );

  useFrame(() => {
    if (!nodes || !nodes.Wolf3D_Head) return;
    const head = nodes.Wolf3D_Head;
    const teeth = nodes.Wolf3D_Teeth;
    const currentAudioTime = audio.currentTime;

    Object.values(corresponding).forEach((value: string) => {
      if (head.morphTargetDictionary && head.morphTargetInfluences) {
        const index = head.morphTargetDictionary[value];
        if (index !== undefined) head.morphTargetInfluences[index] = 0;
      }

      if (teeth.morphTargetDictionary && teeth.morphTargetInfluences) {
        const index = teeth.morphTargetDictionary[value];
        if (index !== undefined) teeth.morphTargetInfluences[index] = 0;
      }
    });

    for (let i = 0; i < lipsync.mouthCues.length; i++) {
      const { start, end, value } = lipsync.mouthCues[i];

      if (currentAudioTime >= start && currentAudioTime <= end) {
        if (head.morphTargetDictionary && head.morphTargetInfluences) {
          const index = head.morphTargetDictionary[corresponding[value]];
          if (index !== undefined) head.morphTargetInfluences[index] = 1;
        }

        if (teeth.morphTargetDictionary && teeth.morphTargetInfluences) {
          const index = teeth.morphTargetDictionary[corresponding[value]];
          if (index !== undefined) teeth.morphTargetInfluences[index] = 1;
        }
      }
    }
  });

  useEffect(() => {
    if (palyAudio) {
      setAnimation("Greeting");
      audio.currentTime = 0;
      audio.play();

      audio.onended = () => setAnimation("Idle");
    } else {
      audio.pause();
      setAnimation("Idle");
    }
  }, [palyAudio, script]);

  useEffect(() => {
    if (!actions || !animation || !actions[animation]) return;

    Object.values(actions).forEach((action) => {
      action?.stop();
    });

    const activeAction = actions[animation];
    activeAction.reset().fadeIn(0.5).play();

    return () => {
      activeAction.fadeOut(0.5);
    };
  }, [animation, actions]);

  return (
    <>
      <group {...props} dispose={null} ref={group}>
        <primitive object={nodes.Hips} />
        <skinnedMesh
          geometry={nodes.Wolf3D_Hair.geometry}
          material={materials.Wolf3D_Hair}
          skeleton={nodes.Wolf3D_Hair.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Wolf3D_Body.geometry}
          material={materials.Wolf3D_Body}
          skeleton={nodes.Wolf3D_Body.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
          material={materials.Wolf3D_Outfit_Bottom}
          skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
          material={materials.Wolf3D_Outfit_Footwear}
          skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Top.geometry}
          material={materials.Wolf3D_Outfit_Top}
          skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
        />
        <skinnedMesh
          name="EyeLeft"
          geometry={nodes.EyeLeft.geometry}
          material={materials.Wolf3D_Eye}
          skeleton={nodes.EyeLeft.skeleton}
          morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
          morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
        />
        <skinnedMesh
          name="EyeRight"
          geometry={nodes.EyeRight.geometry}
          material={materials.Wolf3D_Eye}
          skeleton={nodes.EyeRight.skeleton}
          morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
          morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
        />
        <skinnedMesh
          name="Wolf3D_Head"
          geometry={nodes.Wolf3D_Head.geometry}
          material={materials.Wolf3D_Skin}
          skeleton={nodes.Wolf3D_Head.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
        />
        <skinnedMesh
          name="Wolf3D_Teeth"
          geometry={nodes.Wolf3D_Teeth.geometry}
          material={materials.Wolf3D_Teeth}
          skeleton={nodes.Wolf3D_Teeth.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
        />
      </group>
    </>
  );
};

useGLTF.preload("/medias/avatar.glb");

export default Avatar;
