// Hotspot coordinates as percentages of the rendered image dimensions.
// { x, y } = top-left corner; { w, h } = size — all in % of image width/height.
//
// IMPORTANT: These are placeholder coordinates set before the final room-scene.jpg
// was chosen. After placing room-scene.jpg, open coord-helper.html in a browser,
// then click each hotspot location to capture calibrated % coordinates.
//
// Current layout assumes a wide asylum ward interior (1920×1080):
//   Left door:          Ward B entrance with combination lock
//   Left wall:          Electroshock machine panel
//   Right wall:         Medicine cabinet with glass door
//   Right far:          Patient filing cabinet
//   Lower-centre:       Bookcase hiding ritual chamber
//   Centre-upper:       Asylum main gate (final puzzle)
//
export const HOTSPOTS = {
  'ward-lock':        { x: 43, y: 52, w: 8,  h: 12 },
  'therapy-machine':  { x: 12, y: 28, w: 11, h: 24 },
  'medicine-cabinet': { x: 71, y: 22, w: 9,  h: 28 },
  'patient-files':    { x: 81, y: 58, w: 8,  h: 17 },
  'ritual-chamber':   { x: 33, y: 68, w: 14, h: 11 },
  'asylum-gate':      { x: 46, y: 38, w: 18, h: 28 },
};
