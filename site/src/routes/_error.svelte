<script>
	export let status: number;
	export let error: Error;

	const mode = process.env.NODE_ENV;
	const dev = mode === "development";
</script>

<h1>{error.message}</h1>
<h2>{status}</h2>

{#if dev && error.stack}
	<pre>{error.stack}</pre>
{/if}
