const { preprocess } = require("svelte/compiler");
const { readdirSync, readFileSync, writeFileSync } = require("fs");
const { join, extname } = require("path");

const { createPreprocessors } = require("../svelte.config");

const inputdir = "src";
const outputdir = "dist";
const preprocessors = createPreprocessors({ sourceMap: true });

readdirSync(inputdir).map(async (file) => {
	if (extname(file) !== ".svelte") {
		return;
	}

	const fullPath = join(inputdir, file);
	const source = readFileSync(fullPath, "utf-8");
	const processed = await preprocess(source, preprocessors, { filename: fullPath });
	writeFileSync(join(outputdir, file), processed.code);

	if (process.map) {
		writeFileSync(join(outputdir, `${file}.map`), processed.map);
	}
});
