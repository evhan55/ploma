// Remove points that reside on a line between two other points on the path
		// Remove points that are too close to their neighbors
		static private const dotProd:Number = 0.985;
		private var beforeLastSavePt:Point;
		private var lastSavePt:Point;
		private var lastSaveC2:Point;
		private var lastSaveDir:Point;
		private var lastSaveDev:Point;
		private var lastMousePt:Point;
		private function processMousePos(mousePos:Point, final:Boolean = false):void {
			var maxDev:Number = Math.min(smoothness, strokeWidth * 0.4);
			var maxDevDiff:Number = Math.min(smoothness, strokeWidth);
			var maxDot:Number = (smoothness < 1 ? Math.pow(dotProd, smoothness) : dotProd);
//			var maxDist:Number = Math.max(1, strokeWidth * 10);
			if(lastSavePt && mousePos.subtract(lastSavePt).length < strokeWidth && !final)
				return;

			if(!lastSaveDir) {
				if(!lastMousePt) {
					lastSaveC2 = mousePos;
					lastMousePt = mousePos;
					lastSavePt = mousePos;
					newElement.path.push(['M', mousePos.x, mousePos.y]);

					previewShape.graphics.clear();
					previewShape.graphics.moveTo(mousePos.x, mousePos.y);
					setLineStyle(previewShape.graphics);
					return;
				}

				lastSaveDir = mousePos.subtract(lastMousePt);
				lastMousePt = mousePos;
				previewShape.graphics.lineTo(mousePos.x, mousePos.y);
				//lastSaveDir.normalize(1);
				return;
			}

			var curDir:Point = mousePos.subtract(lastMousePt);
			lastMousePt = mousePos;
//			var div:Number = curDir.length*lastSaveDir.length;
//			if (div == 0) div = 0.01;
//			var factor:Number = (curDir.x * lastSaveDir.x + curDir.y * lastSaveDir.y) / div;
			//trace('dot product = '+factor);
			var distFromLastSaved:Number = mousePos.subtract(lastSavePt).length;
			var np:Point = lastSaveDir.clone();
			np.normalize(distFromLastSaved);
			var proj:Point = np.add(lastSavePt);
			var dev:Point = mousePos.subtract(proj);
			if(lastSaveDev) {
/*
previewShape.graphics.clear();
previewShape.graphics.lineStyle(3, 0xFF0000);
previewShape.graphics.drawCircle(lastSavePt.x, lastSavePt.y, 8);
previewShape.graphics.moveTo(lastSavePt.x, lastSavePt.y);
previewShape.graphics.lineTo(proj.x, proj.y);
*/
				var div:Number = dev.length*lastSaveDev.length;
				if (div == 0) div = 0.01;
				var factor:Number = (dev.x * lastSaveDev.x + dev.y * lastSaveDev.y) / div;
				//trace(factor);
			}
//			if(factor < dotProd && distFromLastSaved > maxDist || dev > maxDev || final) {
//trace('distFromLastSaved='+distFromLastSaved+'   '+dev+' > '+maxDev);
//trace('np=('+np.x+', '+np.y+')');
			var devDiff:Number = lastSaveDev ? Math.abs(dev.length - lastSaveDev.length) : 0;
//trace('('+dev.length+' > '+maxDev+' && (!'+(!!lastSaveDev)+' || '+factor+' < '+dotProd+' || '+devDiff+' > '+strokeWidth+')');
			//if((dev.length > maxDev && (!lastSaveDev || factor < dotProd || devDiff > strokeWidth)) || final) {
			if(((dev.length > maxDev && !lastSaveDev) || factor < maxDot || devDiff > maxDevDiff) || final) {
				var before:Point = beforeLastSavePt || lastSavePt;
				var here:Point = lastSavePt;
				var after:Point = mousePos;
				var cPts:Array = SVGPath.getControlPointsAdjacentAnchor(before, here, after);
				var c1:Point = cPts[0];
				var c2:Point = cPts[1];
				
				SVGPath.drawCubicBezier(gfx, before, lastSaveC2, c1, here, null, null);
				newElement.path.push(['C', lastSaveC2.x, lastSaveC2.y, c1.x, c1.y, here.x, here.y]);
				lastSaveC2 = c2;
				previewShape.graphics.clear();
				previewShape.graphics.moveTo(here.x, here.y);

				beforeLastSavePt = lastSavePt;
				lastSavePt = mousePos;
				lastSaveDir = curDir;
				lastSaveDev = dev;
				//lastSaveDir.normalize(1);

				setLineStyle(previewShape.graphics);
				SVGPath.drawCubicBezier(previewShape.graphics, here, c2, after, after, null, null);

				if(final) {
					// Append the final path command
					SVGPath.drawCubicBezier(gfx, before, c2, after, after, null, null);
					newElement.path.push(['C', c2.x, c2.y, after.x, after.y, after.x, after.y]);
				}
			}
			else {
				//trace(factor+' < '+dotProd+' && '+distFromLastSaved+' > '+maxDist+' || '+dev+' > '+maxDev);
				previewShape.graphics.lineTo(mousePos.x, mousePos.y);
			}
		}