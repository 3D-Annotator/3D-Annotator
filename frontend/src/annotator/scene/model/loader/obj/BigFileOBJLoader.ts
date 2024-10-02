/* eslint-disable */
import {
	BufferGeometry,
	Color,
	FileLoader,
	Float32BufferAttribute,
	Group,
	LineBasicMaterial,
	LineSegments,
	Loader,
	LoadingManager,
	Material,
	Mesh,
	MeshPhongMaterial,
	Points,
	PointsMaterial,
	Vector3,
} from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";

// o object_name | g group_name
const _object_pattern = /^[og]\s*(.+)?/;
// mtllib file_reference
const _material_library_pattern = /^mtllib /;
// usemtl material_name
const _material_use_pattern = /^usemtl /;
// usemap map_name
const _map_use_pattern = /^usemap /;
const _face_vertex_data_separator_pattern = /\s+/;

const _vA = new Vector3();
const _vB = new Vector3();
const _vC = new Vector3();

const _ab = new Vector3();
const _cb = new Vector3();

const _color = new Color();

function ParserState() {
	const state = {
		objects: [],
		object: {} as any,

		vertices: [],
		normals: [],
		colors: [],
		uvs: [],

		materials: {},
		materialLibraries: [],

		startObject: function (name: string, fromDeclaration: boolean) {
			// If the current object (initial from reset) is not from a g/o declaration in the parsed
			// file. We need to use it for the first parsed g/o to keep things in sync.
			if (this.object && this.object.fromDeclaration === false) {
				this.object.name = name;
				this.object.fromDeclaration = fromDeclaration !== false;
				return;
			}

			const previousMaterial =
				this.object && typeof this.object.currentMaterial === "function"
					? this.object.currentMaterial()
					: undefined;

			if (this.object && typeof this.object._finalize === "function") {
				this.object._finalize(true);
			}

			this.object = {
				name: name || "",
				fromDeclaration: fromDeclaration !== false,

				geometry: {
					vertices: [],
					normals: [],
					colors: [],
					uvs: [],
					hasUVIndices: false,
				},
				materials: [],
				smooth: true,

				startMaterial: function (name: string, libraries: string[]) {
					const previous = this._finalize(false);

					// New usemtl declaration overwrites an inherited material, except if faces were declared
					// after the material, then it must be preserved for proper MultiMaterial continuation.
					if (
						previous &&
						(previous.inherited || previous.groupCount <= 0)
					) {
						this.materials.splice(previous.index, 1);
					}

					const material = {
						index: this.materials.length,
						name: name || "",
						mtllib:
							Array.isArray(libraries) && libraries.length > 0
								? libraries[libraries.length - 1]
								: "",
						smooth:
							previous !== undefined
								? previous.smooth
								: this.smooth,
						groupStart:
							previous !== undefined ? previous.groupEnd : 0,
						groupEnd: -1,
						groupCount: -1,
						inherited: false,

						clone: function (index: number) {
							const cloned = {
								index:
									typeof index === "number"
										? index
										: this.index,
								name: this.name,
								mtllib: this.mtllib,
								smooth: this.smooth,
								groupStart: 0,
								groupEnd: -1,
								groupCount: -1,
								inherited: false,
							} as any;
							cloned.clone = this.clone.bind(cloned);
							return cloned;
						},
					};

					this.materials.push(material);

					return material;
				},

				currentMaterial: function () {
					if (this.materials.length > 0) {
						return this.materials[this.materials.length - 1];
					}

					return undefined;
				},

				_finalize: function (end: any) {
					const lastMultiMaterial = this.currentMaterial();
					if (
						lastMultiMaterial &&
						lastMultiMaterial.groupEnd === -1
					) {
						lastMultiMaterial.groupEnd =
							this.geometry.vertices.length / 3;
						lastMultiMaterial.groupCount =
							lastMultiMaterial.groupEnd -
							lastMultiMaterial.groupStart;
						lastMultiMaterial.inherited = false;
					}

					// Ignore objects tail materials if no face declarations followed them before a new o/g started.
					if (end && this.materials.length > 1) {
						for (
							let mi = this.materials.length - 1;
							mi >= 0;
							mi--
						) {
							if (this.materials[mi].groupCount <= 0) {
								this.materials.splice(mi, 1);
							}
						}
					}

					// Guarantee at least one empty material, this makes the creation later more straight forward.
					if (end && this.materials.length === 0) {
						this.materials.push({
							name: "",
							smooth: this.smooth,
						});
					}

					return lastMultiMaterial;
				},
			};

			// Inherit previous objects material.
			// Spec tells us that a declared material must be set to all objects until a new material is declared.
			// If a usemtl declaration is encountered while this new object is being parsed, it will
			// overwrite the inherited material. Exception being that there was already face declarations
			// to the inherited material, then it will be preserved for proper MultiMaterial continuation.

			if (
				previousMaterial &&
				previousMaterial.name &&
				typeof previousMaterial.clone === "function"
			) {
				const declared = previousMaterial.clone(0);
				declared.inherited = true;
				this.object.materials.push(declared);
			}

			this.objects.push(this.object as never);
		},

		finalize: function () {
			if (this.object && typeof this.object._finalize === "function") {
				this.object._finalize(true);
			}
		},

		parseVertexIndex: function (value: any, len: any) {
			const index = parseInt(value, 10);
			return (index >= 0 ? index - 1 : index + len / 3) * 3;
		},

		parseNormalIndex: function (value: any, len: any) {
			const index = parseInt(value, 10);
			return (index >= 0 ? index - 1 : index + len / 3) * 3;
		},

		parseUVIndex: function (value: any, len: any) {
			const index = parseInt(value, 10);
			return (index >= 0 ? index - 1 : index + len / 2) * 2;
		},

		addVertex: function (a: any, b: any, c: any) {
			const src = this.vertices;
			const dst = this.object.geometry.vertices;

			dst.push(src[a + 0], src[a + 1], src[a + 2]);
			dst.push(src[b + 0], src[b + 1], src[b + 2]);
			dst.push(src[c + 0], src[c + 1], src[c + 2]);
		},

		addVertexPoint: function (a: any) {
			const src = this.vertices;
			const dst = this.object.geometry.vertices;

			dst.push(src[a + 0], src[a + 1], src[a + 2]);
		},

		addVertexLine: function (a: any) {
			const src = this.vertices;
			const dst = this.object.geometry.vertices;

			dst.push(src[a + 0], src[a + 1], src[a + 2]);
		},

		addNormal: function (a: any, b: any, c: any) {
			const src = this.normals;
			const dst = this.object.geometry.normals;

			dst.push(src[a + 0], src[a + 1], src[a + 2]);
			dst.push(src[b + 0], src[b + 1], src[b + 2]);
			dst.push(src[c + 0], src[c + 1], src[c + 2]);
		},

		addFaceNormal: function (a: any, b: any, c: any) {
			const src = this.vertices;
			const dst = this.object.geometry.normals;

			_vA.fromArray(src, a);
			_vB.fromArray(src, b);
			_vC.fromArray(src, c);

			_cb.subVectors(_vC, _vB);
			_ab.subVectors(_vA, _vB);
			_cb.cross(_ab);

			_cb.normalize();

			dst.push(_cb.x, _cb.y, _cb.z);
			dst.push(_cb.x, _cb.y, _cb.z);
			dst.push(_cb.x, _cb.y, _cb.z);
		},

		addColor: function (a: any, b?: any, c?: any) {
			const src = this.colors;
			const dst = this.object.geometry.colors;

			if (src[a] !== undefined)
				dst.push(src[a + 0], src[a + 1], src[a + 2]);
			if (src[b] !== undefined)
				dst.push(src[b + 0], src[b + 1], src[b + 2]);
			if (src[c] !== undefined)
				dst.push(src[c + 0], src[c + 1], src[c + 2]);
		},

		addUV: function (a: any, b: any, c: any) {
			const src = this.uvs;
			const dst = this.object.geometry.uvs;

			dst.push(src[a + 0], src[a + 1]);
			dst.push(src[b + 0], src[b + 1]);
			dst.push(src[c + 0], src[c + 1]);
		},

		addDefaultUV: function () {
			const dst = this.object.geometry.uvs;

			dst.push(0, 0);
			dst.push(0, 0);
			dst.push(0, 0);
		},

		addUVLine: function (a: any) {
			const src = this.uvs;
			const dst = this.object.geometry.uvs;

			dst.push(src[a + 0], src[a + 1]);
		},

		addFace: function (
			a: any,
			b: any,
			c: any,
			ua: any,
			ub: any,
			uc: any,
			na: any,
			nb: any,
			nc: any
		) {
			const vLen = this.vertices.length;

			let ia = this.parseVertexIndex(a, vLen);
			let ib = this.parseVertexIndex(b, vLen);
			let ic = this.parseVertexIndex(c, vLen);

			this.addVertex(ia, ib, ic);
			this.addColor(ia, ib, ic);

			// normals

			if (na !== undefined && na !== "") {
				const nLen = this.normals.length;

				ia = this.parseNormalIndex(na, nLen);
				ib = this.parseNormalIndex(nb, nLen);
				ic = this.parseNormalIndex(nc, nLen);

				this.addNormal(ia, ib, ic);
			} else {
				this.addFaceNormal(ia, ib, ic);
			}

			// uvs

			if (ua !== undefined && ua !== "") {
				const uvLen = this.uvs.length;

				ia = this.parseUVIndex(ua, uvLen);
				ib = this.parseUVIndex(ub, uvLen);
				ic = this.parseUVIndex(uc, uvLen);

				this.addUV(ia, ib, ic);

				this.object.geometry.hasUVIndices = true;
			} else {
				// add placeholder values (for inconsistent face definitions)

				this.addDefaultUV();
			}
		},

		addPointGeometry: function (vertices: any) {
			this.object.geometry.type = "Points";

			const vLen = this.vertices.length;

			for (let vi = 0, l = vertices.length; vi < l; vi++) {
				const index = this.parseVertexIndex(vertices[vi], vLen);

				this.addVertexPoint(index);
				this.addColor(index);
			}
		},

		addLineGeometry: function (vertices: any, uvs: any) {
			this.object.geometry.type = "Line";

			const vLen = this.vertices.length;
			const uvLen = this.uvs.length;

			for (let i = 0; i < vertices.length; i++) {
				this.addVertexLine(this.parseVertexIndex(vertices[i], vLen));
			}

			for (let i = 0; i < uvs.length; i++) {
				this.addUVLine(this.parseUVIndex(uvs[i], uvLen));
			}
		},
	};

	state.startObject("", false);

	return state;
}

/**
 * A clone of the three.js OBJLoader that enables parsing OBJ files larger
 * than {@link MAX_UTF8_FILE_LENGTH}.
 */
class BigFileOBJLoader extends Loader {
	private materials: MTLLoader.MaterialCreator | null;

	constructor(manager?: LoadingManager) {
		super(manager);

		this.materials = null;
	}

	override load(
		url: string,
		onLoad: (group: Group) => void,
		onProgress?: (event: ProgressEvent) => void,
		onError?: (event: unknown) => void
	): void {
		const scope = this;

		const loader = new FileLoader(this.manager);
		loader.setPath(this.path);
		loader.setRequestHeader(this.requestHeader);
		loader.setWithCredentials(this.withCredentials);
		loader.load(
			url,
			function (text) {
				try {
					onLoad(scope.parse(text as string));
				} catch (e) {
					if (onError) {
						onError(e as ErrorEvent);
					} else {
						console.error(e);
					}

					scope.manager.itemError(url);
				}
			},
			onProgress,
			onError
		);
	}

	setMaterials(materials: MTLLoader.MaterialCreator): this {
		this.materials = materials;

		return this;
	}

	parse(text: string): Group {
		if (text.indexOf("\r\n") !== -1) {
			// This is faster than String.split with regex that splits on both
			text = text.replace(/\r\n/g, "\n");
		}

		if (text.indexOf("\\\n") !== -1) {
			// join lines separated by a line continuation character (\)
			text = text.replace(/\\\n/g, "");
		}

		const lines = text.split("\n");

		return this.parseLines(lines);
	}

	parseLines(lines: string[]): Group {
		const state = new (ParserState as any)();

		let result: any[] | null = [];

		for (let i = 0, l = lines.length; i < l; i++) {
			const line = lines[i].trimStart();

			if (line.length === 0) continue;

			const lineFirstChar = line.charAt(0);

			// @todo invoke passed in handler if any
			if (lineFirstChar === "#") continue;

			if (lineFirstChar === "v") {
				const data = line.split(_face_vertex_data_separator_pattern);

				switch (data[0]) {
					case "v":
						state.vertices.push(
							parseFloat(data[1]),
							parseFloat(data[2]),
							parseFloat(data[3])
						);
						if (data.length >= 7) {
							_color
								.setRGB(
									parseFloat(data[4]),
									parseFloat(data[5]),
									parseFloat(data[6])
								)
								.convertSRGBToLinear();

							state.colors.push(_color.r, _color.g, _color.b);
						} else {
							// if no colors are defined, add placeholders so color and vertex indices match

							state.colors.push(undefined, undefined, undefined);
						}

						break;
					case "vn":
						state.normals.push(
							parseFloat(data[1]),
							parseFloat(data[2]),
							parseFloat(data[3])
						);
						break;
					case "vt":
						state.uvs.push(
							parseFloat(data[1]),
							parseFloat(data[2])
						);
						break;
				}
			} else if (lineFirstChar === "f") {
				const lineData = line.slice(1).trim();
				const vertexData = lineData.split(
					_face_vertex_data_separator_pattern
				);
				const faceVertices = [];

				// Parse the face vertex data into an easy to work with format

				for (let j = 0, jl = vertexData.length; j < jl; j++) {
					const vertex = vertexData[j];

					if (vertex.length > 0) {
						const vertexParts = vertex.split("/");
						faceVertices.push(vertexParts);
					}
				}

				// Draw an edge between the first vertex and all subsequent vertices to form a polygon

				const v1 = faceVertices[0];

				for (let j = 1, jl = faceVertices.length - 1; j < jl; j++) {
					const v2 = faceVertices[j];
					const v3 = faceVertices[j + 1];

					state.addFace(
						v1[0],
						v2[0],
						v3[0],
						v1[1],
						v2[1],
						v3[1],
						v1[2],
						v2[2],
						v3[2]
					);
				}
			} else if (lineFirstChar === "l") {
				const lineParts = line.substring(1).trim().split(" ");
				let lineVertices = [];
				const lineUVs = [];

				if (line.indexOf("/") === -1) {
					lineVertices = lineParts;
				} else {
					for (let li = 0; li < lineParts.length; li++) {
						const parts = lineParts[li].split("/");

						if (parts[0] !== "") lineVertices.push(parts[0]);
						if (parts[1] !== "") lineUVs.push(parts[1]);
					}
				}

				state.addLineGeometry(lineVertices, lineUVs);
			} else if (lineFirstChar === "p") {
				const lineData = line.slice(1).trim();
				const pointData = lineData.split(" ");

				state.addPointGeometry(pointData);
			} else if ((result = _object_pattern.exec(line)) !== null) {
				// o object_name
				// or
				// g group_name

				// WORKAROUND: https://bugs.chromium.org/p/v8/issues/detail?id=2869
				// let name = result[ 0 ].slice( 1 ).trim();
				const name = (" " + result[0].slice(1).trim()).slice(1);

				state.startObject(name);
			} else if (_material_use_pattern.test(line)) {
				// material

				state.object.startMaterial(
					line.substring(7).trim(),
					state.materialLibraries
				);
			} else if (_material_library_pattern.test(line)) {
				// mtl file

				state.materialLibraries.push(line.substring(7).trim());
			} else if (_map_use_pattern.test(line)) {
				// the line is parsed but ignored since the loader assumes textures are defined MTL files
				// (according to https://www.okino.com/conv/imp_wave.htm, 'usemap' is the old-style Wavefront texture reference method)

				console.warn(
					'THREE.OBJLoader: Rendering identifier "usemap" not supported. Textures must be defined in MTL files.'
				);
			} else if (lineFirstChar === "s") {
				result = line.split(" ");

				// smooth shading

				// @todo Handle files that have varying smooth values for a set of faces inside one geometry,
				// but does not define a usemtl for each face set.
				// This should be detected and a dummy material created (later MultiMaterial and geometry groups).
				// This requires some care to not create extra material on each smooth value for "normal" obj files.
				// where explicit usemtl defines geometry groups.
				// spell-checker:disable-next-line
				// Example asset: examples/models/obj/cerberus/Cerberus.obj

				/*
				 * http://paulbourke.net/dataformats/obj/
				 *
				 * From chapter "Grouping" Syntax explanation "s group_number":
				 * "group_number is the smoothing group number. To turn off smoothing groups, use a value of 0 or off.
				 * Polygonal elements use group numbers to put elements in different smoothing groups. For free-form
				 * surfaces, smoothing groups are either turned on or off; there is no difference between values greater
				 * than 0."
				 */
				if (result.length > 1) {
					const value = result[1].trim().toLowerCase();
					state.object.smooth = value !== "0" && value !== "off";
				} else {
					// ZBrush can produce "s" lines #11707
					state.object.smooth = true;
				}

				const material = state.object.currentMaterial();
				if (material) material.smooth = state.object.smooth;
			} else {
				// Handle null terminated files without exception
				if (line === "\0") continue;

				console.warn(
					'THREE.OBJLoader: Unexpected line: "' + line + '"'
				);
			}
		}

		state.finalize();

		const container: any = new Group();
		container.materialLibraries = [].concat(state.materialLibraries);

		const hasPrimitives = !(
			state.objects.length === 1 &&
			state.objects[0].geometry.vertices.length === 0
		);

		if (hasPrimitives === true) {
			for (let i = 0, l = state.objects.length; i < l; i++) {
				const object = state.objects[i];
				const geometry = object.geometry;
				const materials = object.materials;
				const isLine = geometry.type === "Line";
				const isPoints = geometry.type === "Points";
				let hasVertexColors = false;

				// Skip o/g line declarations that did not follow with any faces
				if (geometry.vertices.length === 0) continue;

				const bufferGeometry = new BufferGeometry();

				bufferGeometry.setAttribute(
					"position",
					new Float32BufferAttribute(geometry.vertices, 3)
				);

				if (geometry.normals.length > 0) {
					bufferGeometry.setAttribute(
						"normal",
						new Float32BufferAttribute(geometry.normals, 3)
					);
				}

				if (geometry.colors.length > 0) {
					hasVertexColors = true;
					bufferGeometry.setAttribute(
						"color",
						new Float32BufferAttribute(geometry.colors, 3)
					);
				}

				if (geometry.hasUVIndices === true) {
					bufferGeometry.setAttribute(
						"uv",
						new Float32BufferAttribute(geometry.uvs, 2)
					);
				}

				// Create materials

				const createdMaterials = [];

				for (let mi = 0, miLen = materials.length; mi < miLen; mi++) {
					const sourceMaterial = materials[mi];
					const materialHash =
						sourceMaterial.name +
						"_" +
						sourceMaterial.smooth +
						"_" +
						hasVertexColors;
					let material = state.materials[materialHash];

					if (this.materials !== null) {
						material = this.materials.create(sourceMaterial.name);

						// mtl etc. loaders probably can't create line materials correctly, copy properties to a line material.
						if (
							isLine &&
							material &&
							!(material instanceof LineBasicMaterial)
						) {
							const materialLine = new LineBasicMaterial();
							Material.prototype.copy.call(
								materialLine,
								material
							);
							materialLine.color.copy(material.color);
							material = materialLine;
						} else if (
							isPoints &&
							material &&
							!(material instanceof PointsMaterial)
						) {
							const materialPoints = new PointsMaterial({
								size: 10,
								sizeAttenuation: false,
							});
							Material.prototype.copy.call(
								materialPoints,
								material
							);
							materialPoints.color.copy(material.color);
							materialPoints.map = material.map;
							material = materialPoints;
						}
					}

					if (material === undefined) {
						if (isLine) {
							material = new LineBasicMaterial();
						} else if (isPoints) {
							material = new PointsMaterial({
								size: 1,
								sizeAttenuation: false,
							});
						} else {
							material = new MeshPhongMaterial();
						}

						material.name = sourceMaterial.name;
						material.flatShading = sourceMaterial.smooth
							? false
							: true;
						material.vertexColors = hasVertexColors;

						state.materials[materialHash] = material;
					}

					createdMaterials.push(material);
				}

				// Create mesh

				let mesh;

				if (createdMaterials.length > 1) {
					for (
						let mi = 0, miLen = materials.length;
						mi < miLen;
						mi++
					) {
						const sourceMaterial = materials[mi];
						bufferGeometry.addGroup(
							sourceMaterial.groupStart,
							sourceMaterial.groupCount,
							mi
						);
					}

					if (isLine) {
						mesh = new LineSegments(
							bufferGeometry,
							createdMaterials
						);
					} else if (isPoints) {
						mesh = new Points(bufferGeometry, createdMaterials);
					} else {
						mesh = new Mesh(bufferGeometry, createdMaterials);
					}
				} else {
					if (isLine) {
						mesh = new LineSegments(
							bufferGeometry,
							createdMaterials[0]
						);
					} else if (isPoints) {
						mesh = new Points(bufferGeometry, createdMaterials[0]);
					} else {
						mesh = new Mesh(bufferGeometry, createdMaterials[0]);
					}
				}

				mesh.name = object.name;

				container.add(mesh);
			}
		} else {
			// if there is only the default parser state object with no geometry data, interpret data as point cloud

			if (state.vertices.length > 0) {
				const material = new PointsMaterial({
					size: 1,
					sizeAttenuation: false,
				});

				const bufferGeometry = new BufferGeometry();

				bufferGeometry.setAttribute(
					"position",
					new Float32BufferAttribute(state.vertices, 3)
				);

				if (state.colors.length > 0 && state.colors[0] !== undefined) {
					bufferGeometry.setAttribute(
						"color",
						new Float32BufferAttribute(state.colors, 3)
					);
					material.vertexColors = true;
				}

				const points = new Points(bufferGeometry, material);
				container.add(points);
			}
		}

		return container;
	}
}

export { BigFileOBJLoader as MyOBJLoader };
