# Hex AR

A two-player Hex board game that is placed on a real table with AR. Built with Expo, React Native, TypeScript, and ViroReact.

**Status:** early stage. The AR table placement and the pure game core are in place. The board, piece rendering, and hot-seat flow are next.

## Requirements

- Node 20 or newer
- A physical iOS device (ARKit) or Android device (ARCore). AR does not run in Expo Go or on simulators.

## Setup

```bash
npm install
npx expo prebuild        # generates ios/ and android/ with the ViroReact plugin applied
npx expo run:android     # or: npx expo run:ios
```

For cloud builds, use EAS: `npx eas-cli@latest build --profile development`.

## Scripts

- `npm test`: run the Jest tests for the game core
- `npm run typecheck`: TypeScript check with no emit

## Layout

- `src/game/`: pure Hex rules (no React or native imports). Fully unit-tested.
- `src/ar/`: ViroReact scene, plane detection, and board anchoring.
- `App.tsx`: AR navigator entry point.

## Licence

MIT. See `LICENSE`.
