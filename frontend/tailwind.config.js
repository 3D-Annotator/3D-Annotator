/** @type {import('tailwindcss').Config} */

module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	plugins: [require("daisyui")],

	// daisyUI config (optional)
	daisyui: {
		styled: true,
		themes: [
			{
				winter: {
					...require("daisyui/src/colors/themes")[
						"[data-theme=winter]"
					],
					accent: "#FFCB2E",
				},
				dark: {
					...require("daisyui/src/colors/themes")[
						"[data-theme=dark]"
					],
				},
			},
		],
		base: true,
		utils: true,
		logs: true,
		rtl: false,
		prefix: "",
		darkTheme: "dark",
	},
};
