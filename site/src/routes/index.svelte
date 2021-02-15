<script>
	import Heat from "@sjroe/heat/dist";

	let zsmooth = false;
	let x0 = 0;
	let dx = 1;
	let y0 = 0;
	let dy = 1;
	let numberOfColours = 100;
	let reverse = false;
	const dataHeight = 30;
	const dataWidth = 30;
	const data = [...Array(dataHeight)].map((_y, i) =>
		[...Array(dataWidth)].map(
			(_y, j) => (j / (dataWidth - 1) + i / (dataHeight + 1)) / 2
		)
	);

	let colours = [
		{ id: "Viridis", text: `Viridis` },
		{ id: "Cividis", text: `Cividis` },
		{ id: "Cool", text: `Cool` },
		{ id: "Warm", text: "Warm" },
		{ id: "YlGnBl", text: "Yellow, Green & Blue" },
		{ id: "Turbo", text: "Turbo" },
		{ id: "Greys", text: "Greys" },
	];
	let selected = colours[0];
</script>

<div class="main">
	<h1>Performant Heatmap for Svelte</h1>
	<p>
		Use the left mouse button to draw a zoom rectangle. Middle click to reset the zoom. Panning and touch are not currently supported.
	</p>

	<div class="chart">
		<Heat {...{ zsmooth, x0, dx, y0, dy, data, colours: selected.id, numberOfColours, reverse, xTicks: 5 }} />
	</div>

	<h2>Options</h2>
	<div class="options">
		<label>Smooth<input type="checkbox" bind:checked={zsmooth} /></label>
		<label>x₀<input type="number" bind:value={x0} /></label>
		<label>dx<input type="number" bind:value={dx} /></label>
		<label>y₀<input type="number" bind:value={y0} /></label>
		<label>dy<input type="number" bind:value={dy} /></label>
		<label>Number of colours<input type="number" bind:value={numberOfColours} /></label>
		<label>
			Palette<select bind:value={selected}>
				{#each colours as colour}
					<option value={colour}>
						{colour.text}
					</option>
				{/each}
			</select>
		</label>
		<label>Reverse<input type="checkbox" bind:checked={reverse} /></label>
	</div>
</div>

<style>
	.chart {
		min-height: 30rem;
		height: 60vh;
		width: 100%;
		margin-bottom: 2rem;
	}

	.main {
		margin: 2rem;
	}

	.options {
		display: flex;
		flex-wrap: wrap;

		& input, & select {
			margin-right: 2rem;
			margin-left: 1rem;
		}

		& input[type="number"] {
			width: 4rem;
		}
	}
</style>
