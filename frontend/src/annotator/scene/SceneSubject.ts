import { type Object3D } from "three";
import { type Disposable, type Updatable } from "~entity/Types";

/**
 * A SceneSubject
 */
export interface SceneSubject extends Updatable, Disposable {
	/**
	 * Returns objects as Iterable
	 *
	 * @returns a Iterable
	 */
	getObjects(): Object3D[];
}
