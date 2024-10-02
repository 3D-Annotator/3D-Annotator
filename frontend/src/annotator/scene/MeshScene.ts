import { Mesh } from "./model/Mesh";
import { Scene } from "./Scene";

/**
 * A Scene for a mesh
 */
export class MeshScene extends Scene<Mesh> {
	protected createModel(): Mesh {
		return new Mesh();
	}
}
