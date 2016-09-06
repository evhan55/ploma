import { ballpointPenColor, paperColorDark } from './constants';
import Pen from './Pen';

'use strict'; // for strict mode

export class BallpointPen extends Pen {

	getConfiguration() {
		let defaultConfiguration = super.getConfiguration();
		defaultConfiguration.penColor = ballpointPenColor;
		defaultConfiguration.paperColor = paperColorDark;
		return defaultConfiguration;
	}

}