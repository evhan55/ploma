import { defaultSample, inkTextureBase64, ballpointPenColor } from './constants';
import Pen from './Pen';

'use strict'; // for strict mode

export class BallpointPen extends Pen {

	getSampleRate() {
		return defaultSample;
	}

	getTextureBase() {
		return inkTextureBase64;
	}

	getPenColor() {
		return ballpointPenColor;
	}

}