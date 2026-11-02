// Comprime audios largos (prédicas de ~1.5h) en el navegador antes de subirlos.
// Motivos:
//  - Supabase Storage limita el tamaño por archivo (50 MB en plan Free).
//  - OpenAI Whisper acepta como máximo 25 MB por archivo.
// Una prédica a 24 kbps mono 16 kHz pesa ~11 MB/hora, suficiente para transcripción de voz.
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'
const WHISPER_MAX_BYTES = 25 * 1024 * 1024

let ffmpegInstance = null

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance
  const ffmpeg = new FFmpeg()
  await ffmpeg.load({
    coreURL: await toBlobURL(`${CORE_URL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${CORE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
  })
  ffmpegInstance = ffmpeg
  return ffmpeg
}

/**
 * Comprime un archivo de audio a MP3 mono 16 kHz.
 * @param {File} file
 * @param {(progress: number) => void} [onProgress] valor entre 0 y 1
 * @returns {Promise<File>}
 */
export async function compressAudioForTranscription(file, onProgress) {
  // Si ya es pequeño, no hace falta comprimir
  if (file.size <= 20 * 1024 * 1024) return file

  const ffmpeg = await getFFmpeg()
  const progressHandler = ({ progress }) => {
    if (onProgress && progress >= 0 && progress <= 1) onProgress(progress)
  }
  ffmpeg.on('progress', progressHandler)

  const ext = (file.name.split('.').pop() || 'mp3').toLowerCase()
  const inputName = `input.${ext}`
  const outputName = 'output.mp3'

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file))

    // Bitrate adaptado: 24 kbps cubre ~2.4 h dentro de 25 MB; si aun así excede, bajamos a 16 kbps
    for (const bitrate of ['24k', '16k']) {
      await ffmpeg.exec([
        '-i', inputName,
        '-vn', '-ac', '1', '-ar', '16000',
        '-c:a', 'libmp3lame', '-b:a', bitrate,
        '-y', outputName,
      ])
      const data = await ffmpeg.readFile(outputName)
      if (data.byteLength <= WHISPER_MAX_BYTES || bitrate === '16k') {
        if (data.byteLength > WHISPER_MAX_BYTES) {
          throw new Error('El audio es demasiado largo incluso comprimido (máx ~3.5 horas).')
        }
        const baseName = file.name.replace(/\.[^.]+$/, '')
        return new File([data.buffer], `${baseName}_comprimido.mp3`, { type: 'audio/mpeg' })
      }
    }
  } finally {
    ffmpeg.off('progress', progressHandler)
    await ffmpeg.deleteFile(inputName).catch(() => {})
    await ffmpeg.deleteFile(outputName).catch(() => {})
  }
}
