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
  'airlock-bypass': { x: 5,  y: 25, w: 12, h: 50 },  // left wall panel
  'power-relay':    { x: 28, y: 55, w: 18, h: 35 },  // centre floor console
  'bio-scanner':    { x: 15, y: 55, w: 12, h: 35 },  // left-mid pod
  'ares-terminal':  { x: 58, y: 10, w: 20, h: 55 },  // right large screen
  'nav-beacon':     { x: 72, y: 15, w: 14, h: 40 },  // right wall array
  'reactor-core':   { x: 38, y: 65, w: 20, h: 30 },  // floor centre hatch
  'escape-pod':     { x: 82, y: 30, w: 14, h: 55 },  // far right hatch
};
