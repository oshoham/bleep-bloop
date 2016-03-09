const AudioContext = window.AudioContext || window.webkitAudioContext;


var promisifiedOldGUM = function (constraints) {
  var getUserMedia = (navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia);

  if (!getUserMedia) {
    return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
  }

  return new Promise(function (resolve, reject) {
    getUserMedia.call(navigator, constraints, resolve, reject);
  });
};

const getUserMedia = navigator.mediaDevices.getUserMedia || promisifiedOldGUM;


var raf = window.requestAnimationFrame;
var caf = window.cancelAnimationFrame;
var lastTime = 0;
var vendors = ['webkit', 'moz'];
for (var x = 0; x < vendors.length && !raf; ++x) {
  raf = window[vendors[x]+'RequestAnimationFrame'];
  caf = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
}

if (!raf) {
  raf = function (callback) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = window.setTimeout(function () { callback(currTime + timeToCall); },
      timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
}

if (!caf) {
  caf = function (id) {
    clearTimeout(id);
  };
}

const requestAnimationFrame = raf;
const cancelAnimationFrame = caf;


export {
  AudioContext,
  getUserMedia,
  requestAnimationFrame,
  cancelAnimationFrame
};
