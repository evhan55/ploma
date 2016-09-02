export function map(value, valueMin, valueMax, from, to) {
	let ratio = (value - valueMin) / (valueMax - valueMin);
	return from + ratio * (to - from);
}