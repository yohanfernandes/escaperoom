// Hotspot coordinates as percentages of the rendered image dimensions.
// { x, y } = top-left corner; { w, h } = size — all in % of image width/height.
//
// IMPORTANT: These are placeholder coordinates. After generating room-scene.jpg
// for ARES Protocol, open http://localhost:5173/coord-helper.html?game=ares-station
// and calibrate these values against the actual image.
//
// Suggested sci-fi room layout (control room / station interior):
//   Left panel:        airlock control terminal
//   Centre console:    power relay panel
//   Left-mid floor:    bio-scanner pod
//   Right large screen: ARES terminal
//   Right wall:        navigation beacon array
//   Floor centre:      reactor core access hatch
//   Far right:         escape pod hatch
//
export const HOTSPOTS = {
  'airlock-bypass': { x: 3.2, y: 23.1, w: 6.6, h: 27.3 },  // left wall panel
  'power-relay': { x: 14.5, y: 66.4, w: 24.7, h: 22.7 },  // centre floor console
  'bio-scanner': { x: 20.7, y: 21.3, w: 9.1, h: 35.3 },  // left-mid pod
  'ares-terminal':  { x: 48.7, y: 22.1, w: 26.4, h: 22.9 },  // right large screen
  'nav-beacon': { x: 82.7, y: 26.9, w: 13.8, h: 12.3 },  // right wall array
  'reactor-core': { x: 50.2, y: 62.2, w: 15.6, h: 9.4 },  // floor centre hatch
  'escape-pod': { x: 84.2, y: 45.9, w: 11.8, h: 16.1 },  // far right hatch
};
