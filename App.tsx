import React from 'react';
import { ViroARSceneNavigator } from '@reactvision/react-viro';
import { StatusBar } from 'expo-status-bar';
import { HexARScene } from './src/ar/HexARScene';

export default function App() {
  return (
    <>
      <ViroARSceneNavigator
        autofocus
        initialScene={{ scene: HexARScene }}
        style={{ flex: 1 }}
      />
      <StatusBar style="light" />
    </>
  );
}
