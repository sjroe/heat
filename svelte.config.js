const sveltePreprocess = require("svelte-preprocess");

const createPreprocessors = ({ sourceMap }) => [
	sveltePreprocess({
		sourceMap,
		defaults: {
			style: "postcss",
			script: "typescript",
		},
		postcss: true,
	}),
];

module.exports = {
	createPreprocessors,
	preprocess: createPreprocessors({ sourceMap: true }),
};
