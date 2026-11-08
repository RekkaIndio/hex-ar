import React, { useState } from 'react';
import {
  ViroARScene,
  ViroARPlaneSelector,
  ViroBox,
  ViroNode,
  ViroText,
  ViroMaterials,
} from '@reactvision/react-viro';
import type { ViroVec3 } from '@reactvision/react-viro';

// Stage 1 placeholder: a flat tile standing in for the board. Replaced in stage 3.
ViroMaterials.createMaterials({
  board: { diffuseColor: '#D9C9A3' },
});

type Anchor = { position: ViroVec3 };

export function HexARScene() {
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  return (
    <ViroARScene anchorDetectionTypes="PlanesHorizontal">
      <ViroARPlaneSelector
        alignment="HorizontalUpward"
        minWidth={0.2}
        minHeight={0.2}
        onPlaneSelected={(_plane, tapPosition) => {
          setAnchor({ position: tapPosition as ViroVec3 });
        }}
      />

      {anchor === null ? (
        <ViroText
          text="Move your phone slowly to find a table"
          scale={[0.3, 0.3, 0.3]}
          position={[0, 0.2, -1]}
          style={{ fontSize: 24, color: '#FFFFFF' }}
        />
      ) : (
        <ViroNode position={anchor.position}>
          <ViroBox
            scale={[0.4, 0.01, 0.4]}
            position={[0, 0.005, 0]}
            materials={['board']}
          />
        </ViroNode>
      )}
    </ViroARScene>
  );
}

export default HexARScene;
