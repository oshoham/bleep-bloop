import Coder from './coder';
import { AudioContext } from './utils';

export default class Sender {
  constructor ({ charDuration = 0.2, rampDuration = 0.001, freqMin = 18500, freqMax = 19500, freqError = 50 } = {}) {
    this.charDuration = charDuration;
    this.rampDuration = rampDuration;
    this.coder = new Coder({ freqMin, freqMax, freqError });
    this.audioContext = new AudioContext();
  }

  send (input) {
    if (!input) {
      return;
    }
    var characters = (this.coder.startChar + input + this.coder.endChar).split('');
    var paddedChars = this.padDuplicates(characters);
    paddedChars.forEach((character, i) => {
      var frequency = this.coder.encode(character);
      var time = this.audioContext.currentTime + this.charDuration * i;
      this.scheduleToneAt(frequency, time, this.charDuration);
    });
  }

  padDuplicates (characters) {
    var paddedChars = [];
    var prevChar = null;

    characters.forEach((character) => {
      if (character === prevChar) {
        paddedChars.push(this.coder.separator);
      }
      paddedChars.push(character);
      prevChar = character;
      return paddedChars;
    });
    return paddedChars;
  }

  scheduleToneAt (frequency, startTime, duration) {
    var gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(1, startTime + this.rampDuration);
    gainNode.gain.setValueAtTime(1, startTime + duration - this.rampDuration);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    gainNode.connect(this.audioContext.destination);

    var oscillator = this.audioContext.createOscillator();
    oscillator.connect(gainNode);
    oscillator.frequency.value = frequency;
    oscillator.start(startTime);
  }
}
