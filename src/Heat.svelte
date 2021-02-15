<!--
- Handle touches for zoom
- Zoom by drag on axes
- Panning
- Fixed aspect ratio option
- Draw colour scale
- Draw Axis labels and title
- For now assume equal separation of data
- Undo stack for zoom levels
-->

<script>
	import { onMount } from "svelte";
	import * as scales from "d3-scale-chromatic";
	import buildColourPalette from "./utils/colourPalette";
	import { getTicks } from "./utils/ticks";

	export let zsmooth = false;
	export let x0 = 1000;
	export let dx = 1;
	export let xTicks = 10;
	export let y0 = 1000;
	export let dy = 1;
	export let yTicks = 10;
	export let zmin = undefined;
	export let zmax = undefined;
	export let data: number[][];
	export let colours: string = "Cividis";
	export let numberOfColours: number = 10;
	export let reverse = false;

	const colourScales = {
		"Viridis": scales.interpolateViridis,
		"Cividis": scales.interpolateCividis,
		"Cool": scales.interpolateCool,
		"Warm": scales.interpolateWarm,
		"YlGnBl": scales.interpolateYlGnBu,
		"Turbo": scales.interpolateTurbo,
		"Greys": scales.interpolateGreys,
	};

	let colourScale = buildColourPalette(numberOfColours, reverse, scales.interpolateYlGnBu);

	$: {
		if (numberOfColours > 1 && colours in colourScales)
		{
			colourScale = buildColourPalette(numberOfColours, reverse, colourScales[colours]);
			if (mounted) {
				updateCvs();
			}
		}
	};

	$: axis = {
		x0: x0 + view.x * dx,
		xw: view.width * dx,
		y0: y0 + view.y * dy,
		yh: view.height * dy,
	};
	$: htick = getTicks(axis.y0, axis.y0 + axis.yh, yTicks);
	$: vtick = getTicks(axis.x0, axis.x0 + axis.xw, xTicks);
	$: xScale = (n: number): number => (n - axis.x0) / axis.xw * 100;
	$: yScale = (n: number): number => (n - axis.y0) / axis.yh * 100;

	// HTML binds
	let canvas: HTMLCanvasElement;
	let mouseDiv: HTMLDivElement;
	let height: number;
	let width: number;

	let mounted = false;

	const dataWidth = data[0].length;
	const dataHeight = data.length;

	const getData = (x: number, y: number) => data[y][x];

	let view = {
		y: 0,
		x: 0,
		height: dataHeight,
		width: dataWidth,
	};

	let tooltip = {
		enabled: false,
		left: 0,
		top: 0,
		text: "",
		rect : {
			left: 0,
			top: 0,
			width: 0,
			height: 0,
		}
	};

	let zoom = {
		enabled: false,
		start: {
			top: 0,
			left: 0,
		},
		rect : {
			left: 0,
			top: 0,
			width: 0,
			height: 0,
		}
	};

	// Find zmin and zmax
	if (zmin === undefined || zmax === undefined) {
		let min = Number.MAX_VALUE;
		let max = Number.MIN_VALUE;
		for (let i = 0; i < data.length; i++) {
			for (let j = 0; j < data[i].length; j++){
				min = Math.min(min, data[i][j]);
				max = Math.max(max, data[i][j]);
			}
		}

		zmin = min;
		zmax = max;
	}

	onMount(() => {
		mounted = true;
		updateCvs();
	});

	const handle_mousemove = (e: MouseEvent) => {
		const bcr = canvas.getBoundingClientRect();
		const cx = e.clientX - bcr.left;
		const cy = e.clientY - bcr.top;

		if (zoom.enabled) {
			e.preventDefault();

			const y = Math.round(cy / height * canvas.height) / canvas.height * height;
			const x = Math.round(cx / width * canvas.width) / canvas.width * width;

			const dx = Math.abs(x - zoom.start.left);
			const dy = Math.abs(y - zoom.start.top);

			if (dy < 10 && dx < 10) {
				zoom.rect.width = 0;
				zoom.rect.height = 0;
			} else {
				if (dx < 10) {
					zoom.rect.left = 0;
					zoom.rect.width = width;
				} else if (x > zoom.start.left) {
					zoom.rect.left = zoom.start.left;
					zoom.rect.width = Math.min(dx, width - zoom.rect.left);
				} else {
					zoom.rect.left = Math.max(x, 0);
					zoom.rect.width = Math.min(dx, zoom.start.left);
				}

				if (dy < 10) {
					zoom.rect.top = 0;
					zoom.rect.height = height;
				} else if (y > zoom.start.top) {
					zoom.rect.top = zoom.start.top;
					zoom.rect.height = Math.min(dy, height - zoom.rect.top);
				} else {
					zoom.rect.top = Math.max(y, 0);
					zoom.rect.height = Math.min(dy, zoom.start.top);
				}
			}
		} else if (cx > 0 && cx < width && cy > 0 && cy < height) {
			tooltip.enabled = true;

			const t = Math.floor(cy / height * canvas.height);
			const l = Math.floor(cx / width * canvas.width);

			const ct = t / canvas.height * height;
			const cl = l / canvas.width *  width;

			tooltip.rect.width = width / canvas.width;
			tooltip.rect.height = height / canvas.height;
			tooltip.rect.left = cl;
			tooltip.rect.top = ct;

			tooltip.left = cl + tooltip.rect.width;
			tooltip.top = ct;
			tooltip.text = getData(view.x + l, view.y + view.height - t - 1).toExponential(2)
		}
	};

	const handle_mousedown = (e: MouseEvent) => {
		if (e.button === 0 && !e.shiftKey) {
			tooltip.enabled = false;

			zoom.enabled = true;
			zoom.start.top = Math.round(e.offsetY / height * canvas.height) / canvas.height * height;
			zoom.start.left = Math.round(e.offsetX / width * canvas.width) / canvas.width * width;
			zoom.rect.width = 0;
			zoom.rect.height = 0;
		} else if (e.button === 1) {
			tooltip.enabled = false;

			view.x = 0;
			view.width = dataWidth;
			view.y = 0;
			view.height = dataHeight;

			updateCvs();
		}
	};

	interface Rectangle {
		width: number;
		height: number;
		top: number;
		left: number;
	}
	const ClientToCanvas = (r: Rectangle): Rectangle => ({
			left: Math.round(r.left / width * canvas.width),
			top: Math.round(r.top / height * canvas.height),
			width: Math.round(r.width / width * canvas.width),
			height: Math.round(r.height / height * canvas.height)
	});

	const handle_mouseup = (e: MouseEvent) => {
		if (e.button === 0) {
			zoom.enabled = false;

			const cr = ClientToCanvas(zoom.rect);
			if (cr.width !== 0 && cr.height !== 0) {
				view.x += cr.left;
				view.width = cr.width;
				view.y += view.height - cr.top - cr.height;
				view.height = cr.height;

				updateCvs();
			}

			zoom.rect.height = 0;
			zoom.rect.width = 0;
		}
	};

	const updateCvs = () => {
		const ctx = canvas.getContext("2d", { alpha: false });
		ctx.canvas.width = view.width;
		ctx.canvas.height = view.height;

		let imageData = ctx.createImageData(view.width, view.height);
		let u32View = new Uint32Array(imageData.data.buffer);

		const zscale = 1 / (zmax - zmin);

		// Data is stored x[0] left and y[0] bottom
		// but canvas draws x[0] left and y[0] top
		for (let i = 0, idx = 0; i < view.height; i++) {
			for (let j = 0; j < view.width; j++, idx++) {
				// u32View[idx] = colourScale((data[view.y + view.height - i - 1][j + view.x] - zmin) * zscale);
				u32View[idx] = colourScale((getData(j + view.x, view.y + view.height - i - 1) - zmin) * zscale);
			}
		}

		ctx.putImageData(imageData, 0, 0);
	};

</script>

<svelte:window on:mousemove={handle_mousemove} on:mouseup={handle_mouseup}></svelte:window>

<div class="outer-chart">
	<div class="chart">
		{#each htick as tick, i}
			<div class="gridh" style="top:{100 - yScale(tick)}%;">
				<div class="horizontal"><span>{tick}</span></div>
			</div>
		{/each}
		{#each vtick as tick, i}
			<div class="gridv" style="left:{xScale(tick)}%;">
				<div class="vertical"><span>{tick}</span></div>
			</div>
		{/each}
		<canvas bind:this={canvas} class:zsmooth={zsmooth} />
		{#if zoom.enabled}
			<div
				class="zoom"
				style="transform:translate({zoom.rect.left}px, {zoom.rect.top}px);width:{zoom.rect.width}px;height:{zoom.rect.height}px"
			/>
		{/if}
		{#if tooltip.enabled}
			<div
				class="tooltip-select"
				style="transform:translate({tooltip.rect.left}px, {tooltip.rect.top}px);width:{tooltip.rect.width}px;height:{tooltip.rect.height}px"
			/>
			<div class="tooltip" style="transform: translate({tooltip.left}px, {tooltip.top}px);">
				{tooltip.text}
			</div>
		{/if}
		<div
			class="mouse"
			bind:this={mouseDiv}
			bind:clientWidth={width}
			bind:clientHeight={height}
			on:mousedown|preventDefault={handle_mousedown}
			on:mouseup|preventDefault={() => {}}
			on:mouseleave={() => tooltip.enabled = false}
			on:touchstart|preventDefault={() => console.log("start")}
			on:touchmove={() => console.log("move")}
		/>
	</div>
</div>

<style>
	.outer-chart {
		width: 100%;
		height: 100%;
		display: block;
		background: var(--gray-50);
		padding-top: 1rem;
		padding-right: 2rem;
		padding-left: 4rem;
		padding-bottom: 2rem;
	}

	.zoom {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(10, 10, 10, 0.1);
		border: 1px solid black;
	}

	.mouse {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		cursor: crosshair;
	}

	.tooltip {
		position: absolute;
		background: black;
		opacity: 0.7;
		color: white;
		top: 0;
		left: 0;
		padding: 0.5rem;
		margin-left: 0.5rem;
		line-height: 1;
	}

	.tooltip-select {
		position: absolute;
		background: black;
		opacity: 0.2;
		top: 0;
		left: 0;
		border: 1px solid black;
	}

	.chart {
		background: var(--gray-100);
		width: 100%;
		height: 100%;
		display: block;
		position: relative;

		--tick-size: 0.5rem;

		& canvas {
			width: 100%;
			height: 100%;
			image-rendering: pixelated;

			&.zsmooth {
				image-rendering: unset;
			}
		}
	}

	.gridh {
		position: absolute;
		width: 100%;
		height: 0;
		left: 0;
		top: 0;

		& .horizontal {
			position: relative;
			display: block;
			border-bottom: 1px solid var(--gray-700);
			width: var(--tick-size);
			left: calc(0px - var(--tick-size));
			bottom: 0.5px;
		}

		& span {
			position: absolute;
			bottom: 0px;
			right: calc(0.3rem + var(--tick-size));
			display: inline-flex;
			align-items: center;
			height: 4rem;
			top: -2rem;
		}
	}

	.gridv {
		position: absolute;
		width: 0;
		height: 100%;
		left: 0;
		top: 0;

		& .vertical {
			position: relative;
			display: block;
			border-left: 1px solid var(--gray-700);
			width: 0;
			height: var(--tick-size);
			left: -0.5px;
			top: 100%;
		}

		& span {
			position: absolute;
			text-align: center;
			width: 4rem;
			left: -2rem;
			position: absolute;
			top: var(--tick-size);
			padding-top: 0;
			margin-top: 0;
		}
	}
</style>
