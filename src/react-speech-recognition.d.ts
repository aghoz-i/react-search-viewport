declare module 'react-speech-recognition' {
  export type SpeechRecognitionOptions = {
    continuous?: boolean
    language?: string
    interimResults?: boolean
    maxAlternatives?: number
  }

  export type SpeechRecognitionHook = {
    transcript: string
    interimTranscript: string
    finalTranscript: string
    listening: boolean
    resetTranscript: () => void
    browserSupportsSpeechRecognition: boolean
  }

  export default class SpeechRecognition {
    static startListening(options?: SpeechRecognitionOptions): Promise<void>
    static stopListening(): Promise<void>
    static abortListening(): Promise<void>
    static browserSupportsSpeechRecognition(): boolean
  }

  export function useSpeechRecognition(): SpeechRecognitionHook
}
