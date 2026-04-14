// helpers.js
// Converted from library.swift

// Calculates the Euclidean distance between two points
export function norm2(a, b) {
    return Math.sqrt(a * a + b * b)
  }
  
  // Calculates the approximate side length of a detected QR code
  // by averaging the two middle edge lengths (ignores largest and smallest)
  // corners: { topLeft, topRight, bottomLeft, bottomRight } each with x, y
  export function getQRCodeLength(corners) {
    const { topLeft, topRight, bottomLeft, bottomRight } = corners
  
    const a = norm2(bottomLeft.x - bottomRight.x, bottomLeft.y - bottomRight.y)
    const b = norm2(bottomLeft.x - topLeft.x, bottomLeft.y - topLeft.y)
    const c = norm2(topLeft.x - topRight.x, topLeft.y - topRight.y)
    const d = norm2(topRight.x - bottomRight.x, topRight.y - bottomRight.y)
  
    const edges = [a, b, c, d].sort((x, y) => y - x) // sort descending
    return 0.5 * (edges[1] + edges[2]) // average of middle two
  }