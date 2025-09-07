// AudioWorkletProcessor to capture mono 16k float frames and emit Int16 PCM chunks
class MicProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [] }

  constructor(options) {
    super(options)
    this.bufferSize = 1024 // frames per render quantum is 128; we aggregate to 1024
    this.sampleRateTarget = 16000
    this._acc = new Float32Array(0)
    this._downsampleRatio = sampleRate / this.sampleRateTarget
    if (this._downsampleRatio < 1) {
      this._downsampleRatio = 1 // if device sampleRate < 16k, skip downsample
    }
    this.port.onmessage = (e) => {
      if (e?.data === 'flush') this._flush()
    }
  }

  _flush() {
    if (this._acc.length === 0) return
    const pcm16 = new Int16Array(this._acc.length)
    for (let i = 0; i < this._acc.length; i++) {
      const s = Math.max(-1, Math.min(1, this._acc[i]))
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    this.port.postMessage(pcm16.buffer, [pcm16.buffer])
    this._acc = new Float32Array(0)
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    if (!input || input.length === 0) return true
    const ch0 = input[0] // mono capture from first channel
    if (!ch0) return true

    // Optional: simple downsample by picking every Nth sample
    const ratio = this._downsampleRatio
    if (ratio > 1) {
      const outLen = Math.floor(ch0.length / ratio)
      const down = new Float32Array(outLen)
      for (let i = 0; i < outLen; i++) {
        down[i] = ch0[Math.floor(i * ratio)]
      }
      this._append(down)
    } else {
      this._append(ch0)
    }

    return true
  }

  _append(chunk) {
    const merged = new Float32Array(this._acc.length + chunk.length)
    merged.set(this._acc, 0)
    merged.set(chunk, this._acc.length)
    this._acc = merged

    if (this._acc.length >= this.bufferSize) {
      const emit = this._acc.subarray(0, this.bufferSize)
      const rest = this._acc.subarray(this.bufferSize)
      const pcm16 = new Int16Array(emit.length)
      for (let i = 0; i < emit.length; i++) {
        const s = Math.max(-1, Math.min(1, emit[i]))
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
      }
      this.port.postMessage(pcm16.buffer, [pcm16.buffer])
      const copy = new Float32Array(rest.length)
      copy.set(rest, 0)
      this._acc = copy
    }
  }
}

registerProcessor('mic-processor', MicProcessor)