export default class Point {

	constructor(x, y, p) {
		this.x = x;
		this.y = y;
		this.p = p;
	}

	equals(pt) {
		return pt && this.x === pt.x && this.y === pt.y && this.p === pt.p;
	}

	getMidPt(pt) {
		return new Point(
			(this.x + pt.x) / 2,
			(this.y + pt.y) / 2,
			(this.p + pt.p) / 2
		);
	}

	getMirroredPt(pt) {
		return new Point(
			this.x + 2 * (pt.x - this.x),
			this.y + 2 * (pt.y - this.y),
			this.p + 2 * (pt.p - this.p)
		);
	}

	getDistance(pt) {
		// TODO: use Manhattan distance?
		var dx = this.x - pt.x;
		var dy = this.y - pt.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	asArray() {
		return [this.x, this.y, this.p];
	}

	asObj() {
		return {
			x: this.x,
			y: this.y,
			p: this.p
		};
	}
}