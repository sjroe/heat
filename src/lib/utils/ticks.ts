// adapted from https://github.com/d3/d3-array/blob/master/src/ticks.js
// further from https://github.com/Rich-Harris/pancake/blob/master/utils/ticks.mjs
// MIT License https://github.com/d3/d3-array/blob/master/LICENSE

const e10 = Math.sqrt(50);
const e5 = Math.sqrt(10);
const e2 = Math.sqrt(2);

function increment(start: number, stop: number, count: number): number {
	const step = (stop - start) / Math.max(0, count);
	const power = Math.floor(Math.log(step) / Math.LN10);
	const error = step / 10 ** power;

	let base = 1;
	if (error >= e10) {
		base = 10;
	} else if (error >= e5) {
		base = 5;
	} else if (error >= e2) {
		base = 2;
	}

	return power >= 0 ? base * 10 ** power : -(10 ** -power) / base;
}

export function getTicks(start: number, stop: number, count = 5): number[] {
	if (start === stop && count > 0) {
		return [start];
	}

	let strt = start;
	let stp = stop;
	const reverse = stp < strt;
	if (reverse) {
		[strt, stp] = [stp, strt];
	}

	const step = increment(strt, stp, count);
	if (step === 0 || !Number.isFinite(step)) {
		return [];
	}

	let ticks: number[];

	if (step > 0) {
		strt = Math.ceil(strt / step);
		stp = Math.floor(stp / step);
		const n = Math.ceil(stp - strt + 1);
		ticks = new Array(n);
		for (let i = 0; i < n; i += 1) {
			ticks[i] = (strt + i) * step;
		}
	} else {
		strt = Math.floor(strt * step);
		stp = Math.ceil(stp * step);

		const n = Math.ceil(strt - stp + 1);
		ticks = new Array(n);
		for (let i = 0; i < n; i += 1) {
			ticks[i] = (strt - i) / step;
		}
	}

	return reverse ? ticks.reverse() : ticks;
}
