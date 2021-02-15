export default (n: number, reverse: boolean, f: (_t: number) => string)
	: ((_t: number) => number) => {
	const diff = 1 / (n - 1);
	const palette = [];
	const reRgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/;

	for (let i = 0; i < n; i += 1) {
		let colour = reverse ? f(diff * (n - i - 1)) : f(diff * i);
		if (colour[0] === "#") {
			colour = `ff${colour.substr(5, 2)}${colour.substr(3, 2)}${colour.substr(1, 2)}`;
			palette.push(parseInt(colour, 16));
		} else {
			palette.push(reRgb
				.exec(colour)
				.slice(1)
				.map((x) => parseInt(x, 10))
				.reduceRight((p, x) => (p * 256) + x) + 0xff000000);
		}
	}

	return (t) => palette[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
};
