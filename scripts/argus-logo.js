// Argus Logo: codepen.io/blzaugg/pen/vNKaza
// Based off: cdpn.io/CBwhg

(function(){
  "use strict";

	var argusLogo = {};

	argusLogo.container = function(node) {
		var api = {
			node: node,
			offsetX: parseFloat(node.offset().left),
			offsetY: parseFloat(node.offset().top)
		};

		var self = {};

		(function lifecycle() {
			init();
			
			render();

			bind();
		})();

		function init() {
			api.offsetX = parseFloat(api.node.offset().left);
			api.offsetY = parseFloat(api.node.offset().top);
		}

		function render() {
			api.node.css(
				{ position: 'relative' }
			);
		}

		function bind() {
			$(window).resize(windowResize);
		}

		function windowResize(event){
			clearTimeout(self.windowResizeTimer);

			self.windowResizeTimer = setTimeout(function() {
				api.offsetX = parseFloat(api.node.offset().left);
				api.offsetY = parseFloat(api.node.offset().top);
			}, 500);
		}

		return api;
	}; // argusLogo.container

	argusLogo.eye = function(config) {
		var api = {
			container: config.container,
			node: null,
			render: render,
			rendered: false,
			pupilDirection: pupilDirection
		};

		var self = {};

		(function lifecycle() {
			init();

			if (self.config.render) {
				render();
			}
		})();

		function init() {
			self.config = {
				animate: (config.animate === false) ? false : true,
				animateInterval: parseInt(config.animateInterval, 10) || 50,
				color: {
					gloss: config.color && config.color.gloss ? config.color.gloss : 'rgba(255, 255, 255, 0.7)',
					liner: config.color && config.color.liner ? config.color.liner : 'black',
					pupil: config.color && config.color.pupil ? config.color.pupil : 'black',
					sclera: config.color && config.color.sclera ? config.color.sclera : 'pink'
				}, 
				constraint: parseFloat(config.constraint) || 0.5,
				container: config.container || null,
				dampinFactor: parseInt(config.dampinFactor, 10) || 3,
				dampinFactorX: config.dampinFactor ? parseInt(config.dampinFactor, 10) : parseInt(config.dampinFactorX, 10) || 3,
				dampinFactorY: config.dampinFactor ? parseInt(config.dampinFactor, 10) : parseInt(config.dampinFactorY, 10) || 5,
				diameter: parseInt(config.diameter, 10) || 16,
				event: config.event || 'mousemove',
				gloss: (config.gloss === false) ? false : true,
				liner: (config.liner === false) ? false : true, 
				posX: parseInt(config.posX, 10) || 0,
				posY: parseInt(config.posY, 10) || 0,
				pupilDirection: config.pupilDirection || 'center', // See: pupilDirectionMap
				render: config.render || false,
				size: {
					gloss: config.size && config.size.gloss ? parseFloat(config.size.gloss) : 0.35,
					liner: config.size && config.size.liner && (config.liner !== false) ? 
						parseFloat(config.size.liner) : (config.liner === false) ? 0 : 0.13,
					pupil: config.size && config.size.pupil ? parseFloat(config.size.pupil) : 0.7
				}
			};

			self.containerNode = config.container.node;

			self.size = {
				gloss: parseFloat(self.config.diameter * self.config.size.gloss),
				liner: parseFloat(self.config.diameter * self.config.size.liner),
				pupil: parseFloat(self.config.diameter * self.config.size.pupil)
			};

			self.css = {
				eye: {
					background: self.config.color.sclera,
					'border-color': self.config.color.liner,
					'border-radius': '50%',
					'border-style': 'solid',
					'border-width': self.size.liner.toFixed(2) + 'px',
					'font-size': self.config.diameter + 'px',
					height: (self.config.diameter) + 'px', // TODO: diameter.x & diameter.y
					left: self.config.posX + 'px',
					overflow: 'hidden',
					position: 'absolute',
					top: self.config.posY + 'px',
					width: self.config.diameter + 'px'
				},
				gloss: {
					background: self.config.color.gloss,
					'border-radius': '50%',
					height: self.size.gloss.toFixed(2) + 'px',
					left: '15%',
					position: 'absolute',
					top: '15%',
					width: self.size.gloss.toFixed(2) + 'px'
				},
				pupil: {
					background: self.config.color.pupil,
					'border-radius': '50%',
					height: self.size.pupil.toFixed(2) + 'px', 
					position: 'absolute',
					width: self.size.pupil.toFixed(2) + 'px'
				}
			};

			self.domTemplate = {
				// TODO: Use SVGs instead of border-radius
				eye: '<div class="eye"><div class="pupil"></div></div>',
				gloss: '<div class="gloss"></div>'
			};
			
			// TODO: refactor to accept "top left", "left top", etc.
			self.pupilDirectionMap = {
				center: 			{ x:  0, 	y:  0 },
				top: 					{ x:  0, 	y: -1 },
				rightTop: 		{ x:  1, 	y: -1 },
				right: 				{ x:  1, 	y:  0 },
				rightBottom: 	{ x:  1, 	y:  1 },
				bottom: 			{ x:  0, 	y:  1 },
				leftBottom: 	{ x: -1, 	y:  1 },
				left: 				{ x: -1, 	y:  0 },
				leftTop: 			{ x: -1, 	y: -1 }
			};
		}

		function render() {
			if (!api.rendered) {
				self.eyeNode = $(self.domTemplate.eye);
				self.pupilNode = self.eyeNode.find('.pupil:first');

				self.eyeNode.css(self.css.eye);
				self.pupilNode.css(self.css.pupil);

				if (self.config.gloss) {
					var glossNode = $(self.domTemplate.gloss);

					glossNode.css(self.css.gloss);

					self.eyeNode.append(glossNode);
				}

				staticGeometryCalc();

				pupilDirection(self.config.pupilDirection, false);

				self.containerNode.append(self.eyeNode);

				api.rendered = true;

				bind();

				api.node = self.eyeNode;
			}

			return api.node;
		}

		function bind() {
			if (self.config.animate && api.rendered) {
				$(window).on(self.config.event, mouseEvent);
			}
		}

		function mouseEvent(event) {
			var wholeEyeOffset = {
				x: api.container.offsetX + self.config.posX + self.size.liner + self.pupilRadius,
				y: api.container.offsetY + self.config.posY + self.size.liner + self.pupilRadius
			};

			var pupilNew = {
				x: event.pageX - wholeEyeOffset.x,
				y: event.pageY - wholeEyeOffset.y
			}; 

			pupilNew = truncateToDistanceThreshold(pupilNew);

			animatePupil(pupilNew.x, pupilNew.y);
		}
		
		function truncateToDistanceThreshold(pupilNew) {
			var pupilNewOffset = {
				x: pupilNew.x - self.eyeCenterPupilOffset.x,
				y: pupilNew.y - self.eyeCenterPupilOffset.y
			};
			
			var distance = Math.sqrt(pupilNewOffset.x * pupilNewOffset.x + pupilNewOffset.y * pupilNewOffset.y);
			
			if (distance > self.distanceThreshold) {
				pupilNew.x = pupilNewOffset.x / distance * self.distanceThreshold + self.eyeCenterPupilOffset.x;
				pupilNew.y = pupilNewOffset.y / distance * self.distanceThreshold + self.eyeCenterPupilOffset.y;
			}
			
			return pupilNew;
		}

		function staticGeometryCalc() {
			self.pupilRadius = self.pupilNode.width() / 2;

			self.eyeNodeWidth = self.eyeNode.width();
			self.eyeNodeHeight = self.eyeNode.height();

			self.eyeCenterPupilOffset = {
				x: self.eyeNodeWidth / 2 - self.pupilRadius,
				y: self.eyeNodeHeight / 2 - self.pupilRadius
			};

			self.distanceThreshold = self.eyeNodeWidth / 2 * self.config.constraint;
		}

		function pupilDirection(directionKey, animate) {
			animate = (animate === false) ? false : true;

			// TODO: refactor to accept "top left", "left top", etc.
			var directionValue = self.pupilDirectionMap[directionKey];
			
			// TODO: 
			var pupilNew = {
				x: self.eyeCenterPupilOffset.x + self.eyeNodeWidth / 2 * directionValue.x,
				y: self.eyeCenterPupilOffset.y + self.eyeNodeWidth / 2 * directionValue.y
			};
			
			pupilNew = truncateToDistanceThreshold(pupilNew);
			
			if (animate && self.pupilX && self.pupilY) {
				animatePupil(pupilNew.x, pupilNew.y);
			}
			else {
				pupilXYCSS(pupilNew.x, pupilNew.y);
			}
		}

		function pupilXYCSS(pupilX, pupilY) {
			self.pupilX = parseFloat(pupilX.toFixed(2));
			self.pupilY = parseFloat(pupilY.toFixed(2));

			self.pupilNode.css({
				left: self.pupilX + 'px',
				top: self.pupilY + 'px'
			});
		}

		function animatePupil(pupilNewX, pupilNewY) {
			self.pupilNewX = pupilNewX;
			self.pupilNewY = pupilNewY;

			if (!self.animateInterval) {
				self.animateInterval = setInterval(function(){
					var pupilX = self.pupilX;
					var pupilY = self.pupilY;

					var adjustByX = adjustOpt(self.pupilNewX - pupilX);
					var adjustByY = adjustOpt(self.pupilNewY - pupilY);

					if (adjustByX || adjustByY) {
						pupilX += adjustByX / self.config.dampinFactorX;
						pupilY += adjustByY / self.config.dampinFactorY;

						pupilXYCSS(pupilX, pupilY);
					}
					else {
						clearTimeout(self.animateInterval);

						self.animateInterval = null;
					}
				}, self.config.animateInterval);
			}
		}

		function adjustOpt(val) {
			// Optimize animation by dropping unessesary adjustments
			if (!(val > 1 || val < -1)) {
				val = 0;
			}

			return val;
		}

		return api;
	}; // argusLogo.eye

	window.argusLogo = argusLogo;
})();
