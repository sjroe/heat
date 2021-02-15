<script>
	export let segment;
	if (!!segment) {}
</script>

<slot />

<style global>
	@import "../global.pcss";
	#sapper {
		width: 100%;
	}
</style>
