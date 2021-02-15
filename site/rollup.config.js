import path from "path";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import svelte from "rollup-plugin-svelte";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import config from "sapper/config/rollup";
import pkg from "./package.json";

const { createPreprocessors } = require("./svelte.config.js");

const mode = process.env.NODE_ENV;
const dev = mode === "development";
const sourcemap = dev ? "inline" : false;
const legacy = !!process.env.SAPPER_LEGACY_BUILD;

const preprocess = createPreprocessors({ sourceMap: !!sourcemap });

// Workaround for https://github.com/sveltejs/sapper/issues/1266
const onwarn = (warning, onwarnn) => (warning.code === "MISSING_EXPORT" && /'preload'/.test(warning.message))
	|| (warning.code === "CIRCULAR_DEPENDENCY" && /[/\\]@sapper[/\\]/.test(warning.message))
	|| (warning.code === "CIRCULAR_DEPENDENCY" && /Circular dependency.*d3-interpolate/.test(warning.message))
	|| (warning.code === "THIS_IS_UNDEFINED")
	|| onwarnn(warning);

const aliasEntries = {
	entries: {
		$components: path.resolve(__dirname, "src/components"),
		$utils: path.resolve(__dirname, "src/utils"),
	},
};

export default {
	client: {
		input: config.client.input().replace(/\.js$/, ".ts"),
		output: { ...config.client.output(), sourcemap },
		plugins: [
			alias(aliasEntries),
			replace({
				"process.browser": true,
				"process.env.NODE_ENV": JSON.stringify(mode),
			}),
			svelte({
				compilerOptions: {
					dev,
					hydratable: true,
				},
				emitCss: true,
				preprocess,
			}),
			resolve({
				browser: true,
				dedupe: ["svelte"],
			}),
			commonjs({
				sourceMap: !!sourcemap,
			}),
			typescript({ sourceMap: dev }),

			legacy && babel({
				extensions: [".js", ".mjs", ".html", ".svelte"],
				babelHelpers: "runtime",
				exclude: ["node_modules/@babel/**"],
				presets: [
					["@babel/preset-env", {
						targets: "> 0.25%, not dead",
					}],
				],
				plugins: [
					"@babel/plugin-syntax-dynamic-import",
					["@babel/plugin-transform-runtime", {
						useESModules: true,
					}],
				],
			}),

			!dev && terser({
				module: true,
			}),
		],

		preserveEntrySignatures: false,
		onwarn,
	},

	server: {
		input: { server: config.server.input().server.replace(/\.js$/, ".ts") },
		output: { ...config.server.output(), sourcemap },
		plugins: [
			alias(aliasEntries),
			replace({
				"process.browser": false,
				"process.env.NODE_ENV": JSON.stringify(mode),
			}),
			svelte({
				compilerOptions: {
					dev,
					generate: "ssr",
				},
				preprocess,
			}),
			resolve({
				dedupe: ["svelte"],
			}),
			commonjs({
				sourceMap: !!sourcemap,
			}),
			typescript({ sourceMap: dev }),
		],
		external: Object.keys(pkg.dependencies).concat(
			require("module").builtinModules || Object.keys(process.binding("natives")), // eslint-disable-line global-require
		),

		preserveEntrySignatures: "strict",
		onwarn,
	},

	serviceworker: {
		input: config.serviceworker.input().replace(/\.js$/, ".ts"),
		output: { ...config.serviceworker.output(), sourcemap },
		plugins: [
			alias(aliasEntries),
			resolve(),
			replace({
				"process.browser": true,
				"process.env.NODE_ENV": JSON.stringify(mode),
			}),
			commonjs({
				sourceMap: !!sourcemap,
			}),
			typescript({ sourceMap: dev }),
			!dev && terser(),
		],

		preserveEntrySignatures: false,
		onwarn,
	},
};
