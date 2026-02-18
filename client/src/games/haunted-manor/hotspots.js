// Hotspot coordinates as percentages of the rendered image dimensions.
// { x, y } = top-left corner; { w, h } = size — all in % of image width/height.
//
// IMPORTANT: These are placeholder coordinates set before the final room-scene.jpg
// was chosen. After generating and selecting room-scene.jpg, open it in a browser,
// use DevTools to inspect the image element, then measure pixel positions and
// convert to percentages: x% = (pxLeft / imgWidth) * 100, etc.
//
// Current layout assumes a wide panoramic manor interior (1920×1080):
//   Left:         entrance door
//   Centre-upper: portrait on wall
//   Lower-left:   cellar hatch in floor
//   Right tall:   grandfather clock
//   Centre-right: vault/safe
//
export const HOTSPOTS = {
  'entrance-code': { x: 9.7, y: 62.6, w: 3.0, h: 6.0 },   // left door
  'portrait-gems': { x: 30.4, y: 17.2, w: 12.9, h: 33.8 },   // portrait frame (centre wall)
  'cellar-word': { x: 5.7, y: 84.6, w: 23.3, h: 10.1 },   // cellar hatch (lower-left)
  'clock-code': { x: 57.1, y: 28.3, w: 4.7, h: 10.1 },   // grandfather clock (right)
  'final-vault': { x: 67.1, y: 55.8, w: 4.2, h: 7.7 },   // vault/safe (centre-right floor)
};
