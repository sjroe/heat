const preset = require("postcss-preset-env");
const atImport = require("postcss-import");
const cssnano = require("cssnano");

const mode = process.env.NODE_ENV;
const dev = mode === "development";

module.exports = {
	plugins: [
		atImport(),
		preset({
			stage: 1,
			importFrom: ["./src/global.pcss"],
		}),

		// Plugins for polyfills and the like (such as postcss-preset-env) should generally go here
		// but a few have to run *before* Tailwind

		!dev && cssnano({
			preset: [
				"default",
				{ discardComments: { removeAll: true } },
			],
		}),
	].filter(Boolean),
};
