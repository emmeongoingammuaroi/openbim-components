import * as THREE from "three";
import { Component } from "../../base-types";
import { Components } from "../Components";
import { ToolComponent } from "../ToolsComponent";

/**
 * A tool to safely remove meshes and geometries from memory to
 * [prevent memory leaks](https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects).
 */
export class Disposer extends Component<Set<string>> {
  private _disposedComponents = new Set<string>();

  /** {@link Component.enabled} */
  enabled = true;

  static readonly uuid = "76e9cd8e-ad8f-4753-9ef6-cbc60f7247fe" as const;

  constructor(components: Components) {
    super(components);
    components.tools.add(Disposer.uuid, this);
  }

  /**
   * {@link Component.uuid}.
   * @return the list of UUIDs of deleted components.
   */
  get() {
    return this._disposedComponents;
  }

  /**
   * Removes a mesh, its geometry and its materials from memory. If you are
   * using any of these in other parts of the application, make sure that you
   * remove them from the mesh before disposing it.
   *
   * @param mesh - the [mesh](https://threejs.org/docs/#api/en/objects/Mesh)
   * to remove.
   *
   * @param materials - whether to dispose the materials of the mesh.
   *
   * @param recursive - whether to recursively dispose the children of the mesh.
   */
  destroy(
    mesh: THREE.Mesh | THREE.LineSegments,
    materials = true,
    recursive = true
  ) {
    mesh.removeFromParent();
    this.disposeGeometryAndMaterials(mesh, materials);
    if (recursive && mesh.children.length) {
      this.disposeChildren(mesh);
    }
    mesh.material = [];
    (mesh.geometry as any) = null;
    mesh.children.length = 0;
  }

  /**
   * Disposes a geometry from memory.
   *
   * @param geometry - the
   * [geometry](https://threejs.org/docs/#api/en/core/BufferGeometry)
   * to remove.
   */
  disposeGeometry(geometry: THREE.BufferGeometry) {
    if (geometry.boundsTree) {
      geometry.disposeBoundsTree();
    }
    geometry.dispose();
  }

  private disposeGeometryAndMaterials(
    mesh: THREE.Mesh | THREE.LineSegments,
    materials: boolean
  ) {
    if (mesh.geometry) {
      this.disposeGeometry(mesh.geometry);
    }
    if (materials) {
      Disposer.disposeMaterial(mesh);
    }
  }

  private disposeChildren(mesh: THREE.Mesh | THREE.LineSegments) {
    for (const child of mesh.children) {
      this.destroy(child as THREE.Mesh);
    }
  }

  private static disposeMaterial(mesh: THREE.Mesh | THREE.LineSegments) {
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        for (const mat of mesh.material) {
          mat.dispose();
        }
      } else {
        mesh.material.dispose();
      }
    }
  }
}

ToolComponent.libraryUUIDs.add(Disposer.uuid);
