import Coder from './coder';
import RingBuffer from './ring-buffer';
import {
  AudioContext,
  getUserMedia,
  requestAnimationFrame,
  cancelAnimationFrame
} from './utils';

const IDLE = 0;
const RECEIVING = 1;

export default class Listener {
  constructor ({ peakThreshold = -65, minRunLength = 2, timeout = 300, freqMin = 18500, freqMax = 19500, freqError = 50 } = {}) {
    // params
    this.peakThreshold = peakThreshold;
    this.minRunLength = minRunLength;
    this.timeout = timeout;
    this.coder = new Coder({ freqMin, freqMax, freqError });

    // audio graph
    this.audioContext = new AudioContext();
    this.microphone = null;
    this.bandpassFilter = null;
    this.analyser = null;
    this.frequencies = null;

    // state
    this.loop = null;
    this.isListening = false;
    this.state = IDLE;

    // buffers
    this.peakHistory = new RingBuffer(16);
    this.peakTimes = new RingBuffer(16);
    this.message = '';

    this.callbacks = {
      onMessage: Function.prototype
    };

    // getUserMedia shenanigans
    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {};
    }

    if (!navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia = getUserMedia;
    }
  }

  start () {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.smoothingTimeConstant = 0;
        this.analyser.fftSize = 8192; // higher FFT size improves frequency resolution

        // reference: https://stackoverflow.com/questions/15627013/how-do-i-configure-a-bandpass-filter
        this.bandpassFilter = this.audioContext.createBiquadFilter();
        this.bandpassFilter.type = 'bandpass';
        var freqCenter = (this.coder.freqMin + this.coder.freqMax) / 2;
        this.bandpassFilter.frequency.value = freqCenter;
        this.bandpassFilter.Q.value = 0.1;//freqCenter / (this.coder.freqMax - this.coder.freqMin);

        this.microphone.connect(this.bandpassFilter);
        this.bandpassFilter.connect(this.analyser);

        this.frequencies = new Float32Array(this.analyser.frequencyBinCount);
        this.isListening = true;

        this.loop = requestAnimationFrame(this.listen.bind(this));
      })
      .catch(err => console.log(err));
  }

  stop () {
    cancelAnimationFrame(this.loop);
    this.isListening = false;
    this.microphone = null;
    this.bandpassFilter = null;
    this.analyser = null;
  }

  listen () {
    this.analyser.getFloatFrequencyData(this.frequencies);

    var frequency = this.getPeakFrequency();
    if (frequency) {
      var character = this.coder.decode(frequency);
      this.peakHistory.add(character);
      this.peakTimes.add(new Date());
    } else {
      var lastPeakTime = this.peakTimes.last();
      if (lastPeakTime && new Date() - lastPeakTime > this.timeout) {
        this.state = IDLE;
        this.peakTimes.clear();
      }
    }

    this.updateState();

    if (this.isListening) {
      this.loop = requestAnimationFrame(this.listen.bind(this));
    }
  }

  on (event, callback) {
    if (event === 'message') {
      if (typeof(callback) === 'function') {
        this.callbacks.onMessage = callback;
      } else {
        throw new Error('Callback must be a function');
      }
    }
  }

  getPeakFrequency () {
    var start = this.frequencyToIndex(this.coder.freqMin);
    var max = -Infinity;
    var index = -1;

    for (var i = start; i < this.frequencies.length; i++) {
      let frequency = this.frequencies[i];
      if (frequency > max) {
        max = frequency;
        index = i;
      }
    }

    return max > this.peakThreshold ? this.indexToFrequency(index) : null;
  }

  updateState () {
    var character = this.findAndRemoveRun();
    if (!character) {
      return;
    }

    switch (this.state) {
    case IDLE:
      if (character === this.coder.startChar) {
        this.message = '';
        this.state = RECEIVING;
      }
      break;
    case RECEIVING:
      if (![this.lastChar, this.coder.startChar, this.coder.endChar].includes(character)) {
        if (character !== this.coder.separator) {
          this.message += character;
        }
        this.lastChar = character;
      } else if (character === this.coder.endChar) {
        this.state = IDLE;
        this.callbacks.onMessage(this.message);
        this.message = '';
      }
      break;
    }
  }

  findAndRemoveRun () {
    var lastChar = this.peakHistory.last();
    var runLength = 0;

    for (var i = this.peakHistory.length() - 2; i >= 0; i--) {
      var char = this.peakHistory.get(i);
      if (char === lastChar) {
        runLength += 1;
      } else {
        break;
      }
    }

    if (runLength > this.minRunLength) {
      this.peakHistory.remove(i + 1, runLength + 1);
      return lastChar;
    }

    return null;
  }

  indexToFrequency (index) {
    var nyquist = this.audioContext.sampleRate / 2;
    return Math.round(nyquist / this.frequencies.length * index);
  }

  frequencyToIndex (frequency) {
    var nyquist = this.audioContext.sampleRate / 2;
    return Math.round(frequency / nyquist * this.frequencies.length);
  }
}
