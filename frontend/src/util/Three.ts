import { BufferAttribute, BufferGeometry } from "three";
import { type ExcludeMethods } from "./TypeScript";

/**
 * Creates a new BufferGeometry out of a structured clone of a BufferGeometry.
 *
 * ! Uses shallow copies !
 * ! Only copies attributes !
 *
 * @param structuredClone a structured clone of a BufferGeometry
 * @returns a new BufferGeometry
 */
export function createGeometryFromClone(
	structuredClone: ExcludeMethods<BufferGeometry>
): BufferGeometry {
	const geometry = new BufferGeometry();
	if (!structuredClone.attributes) {
		throw new Error("No attributes found in serialized data!");
	}
	const serializedAttrs = structuredClone.attributes;
	for (const key in serializedAttrs) {
		const oldAttrData = serializedAttrs[
			key
		] as ExcludeMethods<BufferAttribute>;
		const newAttr = new BufferAttribute(
			oldAttrData.array,
			oldAttrData.itemSize,
			oldAttrData.normalized
		);
		geometry.setAttribute(key, newAttr);
	}
	return geometry;
}
