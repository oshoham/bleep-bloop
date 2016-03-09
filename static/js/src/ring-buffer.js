export default class RingBuffer {
  constructor (maxLength) {
    this.array = [];
    this.maxLength = maxLength;
  }

  get (index) {
    if (index >= this.array.length) {
      return null;
    }
    return this.array[index];
  }

  last () {
    if (this.array.length === 0) {
      return null;
    }
    return this.array[this.array.length - 1];
  }

  add (value) {
    this.array.push(value);
    if (this.array.length >= this.maxLength) {
      this.array.splice(0, 1);
    }
  }

  remove (index, length) {
    this.array.splice(index, length);
  }

  length () {
    return this.array.length;
  }

  clear () {
    this.array = [];
  }
}
