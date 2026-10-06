/**
 * Audio conversion and processing utilities for Gemini Live
 * Live API requires 16kHz 16-bit linear PCM little-endian audio for input,
 * and produces 24kHz 16-bit linear PCM little-endian audio for output.
 */

/**
 * Converts Float32Array (from AudioBuffer / ScriptProcessor) to 16-bit PCM Int16Array
 */
export function floatToPCM16(input: Float32Array<any>): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

/**
 * Converts 16-bit PCM Int16Array to Float32Array for Web Audio playback
 */
export function pcm16ToFloat(input: Int16Array): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] / (input[i] < 0 ? 0x8000 : 0x7fff);
  }
  return output;
}

/**
 * Encodes Int16Array buffer to base64 string
 */
export function pcm16ToBase64(pcmData: Int16Array): string {
  const buffer = pcmData.buffer;
  let binary = '';
  const bytes = new Uint8Array(buffer, pcmData.byteOffset, pcmData.byteLength);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes base64 string to Int16Array buffer
 */
export function base64ToPCM16(base64: string): Int16Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

/**
 * Simple linear downsampling / upsampling helper
 */
export function resampleAudioBuffer(
  input: Float32Array<any>,
  fromRate: number,
  toRate: number
): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const newLength = Math.round(input.length / ratio);
  const output = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const position = i * ratio;
    const index = Math.floor(position);
    const fraction = position - index;
    if (index + 1 < input.length) {
      output[i] = input[index] * (1 - fraction) + input[index + 1] * fraction;
    } else {
      output[i] = input[index] || 0;
    }
  }
  return output;
}
