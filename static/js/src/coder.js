const ALPHABET = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

export default class Coder {
  constructor ({ freqMin = 18500, freqMax = 19500, freqError = 50, alphabet = ALPHABET } = {}) {
    this.freqMin = freqMin;
    this.freqMax = freqMax;
    this.freqError = freqError;

    // doesn't really matter what these are
    // might as well use the appropriate(?) ASCII control codes
    this.startChar = '\x02'; // start of text
    this.endChar = '\x03'; // end of text
    this.separator = '\x1F'; // unit separator

    this.alphabet = [this.startChar].concat(alphabet.split('')).concat([this.endChar]);
    this.alphabet.splice(Math.round(this.alphabet.length / 2), 0, this.separator);
  }

  encode (character) {
    var index = this.alphabet.indexOf(character);
    if (index === -1) {
      throw new Error(`${character} is not a valid character`);
    }

    var freqRange = this.freqMax - this.freqMin;
    var freqOffset = Math.round(freqRange * (index / this.alphabet.length));
    return this.freqMin + freqOffset;
  }

  decode (frequency) {
    if (frequency > this.freqMax || frequency < this.freqMin) {
      if (this.freqMin - frequency < this.freqError) {
        frequency = this.freqMin;
      } else if (frequency - this.freqMax < this.freqError) {
        frequency = this.freqMax;
      } else {
        throw new Error(`${frequency} is out of range`);
      }
    }

    var freqRange = this.freqMax - this.freqMin;
    var index = Math.round(this.alphabet.length * ((frequency - this.freqMin) / freqRange));
    return this.alphabet[index];
  }
}
