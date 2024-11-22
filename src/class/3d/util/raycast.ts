import {
  Object3D,
  Raycaster,
  type Object3DEventMap,
  type Vector3,
} from "three";

export function getRaycastIntersection(
  sceneObjects: Object3D<Object3DEventMap>[],
  origin: Vector3,
  direction: Vector3
) {
  // Create a raycaster object
  const raycaster = new Raycaster(origin, direction);

  // Perform the raycast
  const intersects = raycaster.intersectObjects(sceneObjects, true);

  // Check if there are any intersections
  if (intersects.length > 0) {
    // Return the first intersecting point
    return intersects[0];
  } else {
    // Return null if no intersection is found
    return null;
  }
}
