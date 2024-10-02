const NAMING_CONVENTION = [
	{
		selector: "default",
		format: ["camelCase", "PascalCase", "UPPER_CASE"],
		leadingUnderscore: "allow",
		trailingUnderscore: "allow",
	},
	{
		selector: "typeLike",
		format: ["PascalCase"],
	},
	{
		selector: "enumMember",
		format: ["UPPER_CASE"],
	},
	{
		selector: ["classProperty", "classMethod"],
		modifiers: ["static", "readonly"],
		format: ["UPPER_CASE"],
	},
	{
		selector: "variable",
		modifiers: ["const", "global"],
		format: ["UPPER_CASE", "camelCase"],
		filter: {
			regex: "LL",
			match: false,
		},
	},
	{
		selector: "variable",
		format: ["camelCase"],
		filter: {
			regex: "LL",
			match: false,
		},
	},
	{
		selector: "objectLiteralProperty",
		format: null,
	},
];

module.exports = {
	ignorePatterns: [".eslintrc.cjs", "build", "coverage"],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-type-checked",
		"plugin:@typescript-eslint/strict",
		"plugin:@typescript-eslint/strict-type-checked",
		"plugin:@typescript-eslint/stylistic",
		"plugin:@typescript-eslint/stylistic-type-checked",
		"plugin:react/recommended",
		"plugin:react/jsx-runtime",
		"prettier",
	],
	plugins: [
		"@typescript-eslint",
		"react",
		"prettier",
		"import",
		"consistently-named-imports",
	],
	rules: {
		/*
		 * DEACTIVATED
		 */

		"@typescript-eslint/no-empty-interface": "off",
		// Non-null-assertions are the cleaner option in many situations.
		"@typescript-eslint/no-non-null-assertion": "off",
		// In ui code or when relying on not perfectly typed library code, those conditions are often necessary.
		"@typescript-eslint/no-unnecessary-condition": "off",
		// TODO: Revisit. As of now there is no clean solution.
		"@typescript-eslint/no-invalid-void-type": "off",

		/*
		 * CONFIGS
		 */

		"prettier/prettier": "warn",
		"no-constant-condition": ["error", { checkLoops: false }],
		"@typescript-eslint/no-misused-promises": [
			"error",
			{ checksVoidReturn: { attributes: false } },
		],
		"@typescript-eslint/consistent-type-imports": [
			"error",
			{
				fixStyle: "inline-type-imports",
			},
		],
		"@typescript-eslint/consistent-type-exports": "error",
		"@typescript-eslint/naming-convention": ["error", ...NAMING_CONVENTION],
		"import/newline-after-import": "error",
		"import/no-default-export": "error",
		"import/no-namespace": "error",
		"consistently-named-imports/consistently-named-imports": [
			"error",
			{
				importNames: [
					{ name: "Color", desiredName: "ThreeColor" },
					{ name: "Scene", desiredName: "ThreeScene" },
					{ name: "Mesh", desiredName: "ThreeMesh" },
					{ name: "PointCloud", desiredName: "ThreePointCloud" },
					{ name: "Loader", desiredName: "ThreeLoader" },
					{
						name: "TextureLoader",
						desiredName: "ThreeTextureLoader",
					},
					{
						name: "Sphere",
						desiredName: "ThreeSphere",
					},
					{
						name: "MathUtils",
						desiredName: "ThreeMathUtils",
					},
				],
				sources: ["three", "three/**"],
			},
		],
		"padding-line-between-statements": [
			"error",
			{ blankLine: "always", prev: "*", next: "function" },
			{ blankLine: "always", prev: "*", next: "class" },
		],
	},
	overrides: [
		{
			// TODO: Consider turning this back on after react code is refactored properly
			files: ["*.tsx"],
			rules: {
				"@typescript-eslint/no-floating-promises": "off",
			},
		},
		{
			files: ["*.test.ts", "*.test.tsx"],
			rules: {
				"@typescript-eslint/no-floating-promises": "off",
				"@typescript-eslint/consistent-type-imports": [
					"warn",
					{
						fixStyle: "inline-type-imports",
						disallowTypeAnnotations: false,
					},
				],
			},
		},
		{
			files: ["*.tsx"],
			rules: {
				"@typescript-eslint/naming-convention": [
					"warn",
					...NAMING_CONVENTION,
					{
						selector: "function",
						format: ["camelCase", "PascalCase"],
					},
				],
			},
		},
	],
	settings: {
		react: {
			version: "detect",
		},
	},
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: true,
		tsConfigRootDir: __dirname,
		ecmaFeatures: {
			jsx: true,
		},
	},
	root: true,
};
