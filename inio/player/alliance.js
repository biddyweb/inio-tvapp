/**
 * Smart TV Alliance Inio Player
 *
 * @author Mautilus s.r.o.
 * @class Inio_Player_Alliance
 * @extends Inio_Player
 */
function Inio_Player_Alliance() {
	Inio_Player.apply(this, arguments);
};

Inio_Player_Alliance.prototype.__proto__ = Inio_Player.prototype;

/**
 * @inheritdoc Inio_Player#initNative
 */
Inio_Player_Alliance.prototype.initNative = function() {
	var scope = this;

	this.type = 'video/mp4';

	this.el = document.createElement('object');

	this.el.className = 'Inio-player';
	this.el.type = this.type;
	this.el.data = '';
	this.el.style.position = 'absolute';
	this.el.style.visibility = 'hidden';
	this.el.style.zIndex = 1;

	document.body.appendChild(this.el);

	this.el.onPlayStateChange = function() {
		scope.onNativePlayStateChange();
	};

	this.el.ondrmmessageresult = this.onNativeDrmMessageResult;

	this.ticker = setInterval(function() {
		scope.tick();
	}, 500);
};
/**
 * @inheritdoc Inio_Player#deinitNative
 */
Inio_Player_Alliance.prototype.deinitNative = function() {
	if (this.el && this.el.parentNode) {
		//this.el.stop();
		this.el.parentNode.removeChild(this.el);
	}
};
/**
 * @private
 */
Inio_Player_Alliance.prototype.setType = function(type) {
	if (this.el) {
		this.el.data = '';
		this.el.type = type;
		this.type = type || null;
	}
};
/**
 * @private
 */
Inio_Player_Alliance.prototype.tick = function() {
	var pos = 0;

	if (this.url && this.el && typeof this.el.playTime !== 'undefined') {
		if (!this.duration && this.el.playTime && this.el.playTime < 4294967295000) {
			this._onDurationChange(parseInt(this.el.playTime));
		}

		pos = Math.round(this.el.playPosition >> 0);

		if (pos && pos !== this.currentTime) {
			this._onTimeUpdate(pos);
		}
	}
};
/**
 * @inheritdoc Inio_Player#native
 */
Inio_Player_Alliance.prototype.native = function(cmd, attrs) {
	var url;

	if (cmd === 'play') {
		if (attrs && attrs.url) {
			url = this.url;

			console.network('PLAYER', this.url);

			this.el.data = url;
		}

		this.el.play(1);

		if (attrs && attrs.position) {
			this._seekOnPlay = attrs.position;
		}

	} else if (cmd === 'pause') {
		return this.el.play(0);

	} else if (cmd === 'stop') {
		return this.el.stop();

	} else if (cmd === 'seek') {
		if (this.currentState === this.STATE_BUFFERING) {
			this._seekOnPlay = attrs.position;

		} else {
			this.el.seek(attrs.position);
		}

		return true;

	} else if (cmd === 'playbackSpeed') {
		return this.el.play(attrs.speed);

	} else if (cmd === 'show') {
		this.width = attrs.width || this.width;
		this.height = attrs.height || this.height;
		this.top = (typeof attrs.top !== 'undefined' ? attrs.top : this.top);
		this.left = (typeof attrs.left !== 'undefined' ? attrs.left : this.left);

		this.el.style.visibility = 'visible';
		this.el.style.width = this.width + 'px';
		this.el.style.height = this.height + 'px';
		this.el.style.top = this.top + 'px';
		this.el.style.left = this.left + 'px';

	} else if (cmd === 'hide') {
		this.el.style.visibility = 'hidden';

	} else if (cmd === 'setVideoDimensions') {
		// @todo: implement setVideoDimensions

	} else if (cmd === 'audioTrack') {
		// @todo: check if audioLanguage is implemented
		if (attrs.language) {
			this.el.audioLanguage = attrs.language;
		}
	}
};
/**
 * @private
 */
Inio_Player_Alliance.prototype.getESN = function() {
	return Inio.device.getUID() + '|60';
};
/**
 * @private
 */
Inio_Player_Alliance.prototype.onNativePlayStateChange = function() {
	var state = this.el.playState;

	if (this._prevState === state) {
		return;
	}

	this._prevState = state;

	if (state === 0) {
		// stopped

	} else if (state === 1) {
		// playing
		if (!this.duration && this.el.playTime && this.el.playTime < 4294967295000) {
			this._onDurationChange(parseInt(this.el.playTime));
		}

		this.state(this.STATE_PLAYING);

		if (this._seekOnPlay) {
			this.el.seek(this._seekOnPlay);
			this._seekOnPlay = 0;
		}

	} else if (state === 2) {
		// paused
		this.state(this.STATE_PAUSED);

	} else if (state === 3 || state === 4) {
		// connecting || buffering
		if (this.currentState !== this.STATE_BUFFERING) {
			this.state(this.STATE_BUFFERING);
		}

	} else if (state === 5) {
		// finished
		this._onEnd();

	} else if (state === 6) {
		// error
		this.onNativeError();
	}
};
/**
 * @private
 */
Inio_Player_Alliance.prototype.onNativeDrmMessageResult = function(msgId, resultMsg, resultCode) {
	if (resultCode > 0) {
		this._onError(4, 'drm', null);
	}
};
/**
 * @private
 */
Inio_Player_Alliance.prototype.onNativeError = function() {
	var code = this.el.error,
		msg = 'Unknown Error';
	this._onError(code, msg);
};