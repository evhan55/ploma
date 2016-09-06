import BallpointPen from './BallpointPen';

'use strict';

export default class BlueBallpointPen extends BallpointPen {

	constructor(canvas) {
		super(canvas, {
			penColor: { r: 0, g: 19, b: 117 }
		});
	}

}