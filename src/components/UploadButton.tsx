'use client';
import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';

import { useAppContext } from '@/app/appContext';

interface UploadButtonProps {
  videoBlob: Blob | null;
}

const UploadButton: React.FC<UploadButtonProps> = ({ videoBlob }) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [pooling, setPolling] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const { setJsonResult } = useAppContext();

  const uploadVideo = async () => {
    if (!videoBlob) return;
    if (pooling) return;

    setUploading(true);
    const timestamp = Date.now();
    const videoFileName = `video_${timestamp}.mp4`;
    const audioFileName = `audio_${timestamp}.wav`;
    const jsonFileName = `audio_${timestamp}.json`;

    try {
      // Upload video
      await uploadFile(videoBlob, videoFileName, 'video/mp4');

      // Extract audio and upload as .wav
      const audioBlob = await extractAudioFromVideo(videoBlob);
      if (audioBlob) {
        await uploadFile(audioBlob, audioFileName, 'audio/wav');
      }

      // Start polling for the JSON result
      await pollForResult(jsonFileName);

      setSnackbarSeverity('success');
      setSnackbarMessage('Upload successful! Starting processing...');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Upload failed:', error);
      setSnackbarSeverity('error');
      setSnackbarMessage('Failed to upload the video or audio.');
    } finally {
      setUploading(false);
    }
  };

  const pollForResult = async (jsonFileName: string) => {
    setPolling(true);
    const maxAttempts = 20;
    const interval = 5000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(`/api/get-result`, {
          params: { jsonFileName },
        });

        if (response.status === 200 && response.data) {
          setJsonResult(response.data);
          console.log(response.data);
          setSnackbarSeverity('success');
          setSnackbarMessage('Processing complete!');
          setSnackbarOpen(true);
          break;
        }
      } catch (error) {
        if (attempt === maxAttempts) {
          console.error('Polling failed:', error);
          setSnackbarSeverity('error');
          setSnackbarMessage(
            'Failed to retrieve the result. Please try again later.'
          );
          setSnackbarOpen(true);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, interval)); // Wait before next poll
    }

    setPolling(false);
  };

  const uploadFile = async (
    blob: Blob,
    fileName: string,
    contentType: string
  ) => {
    const { data } = await axios.post('/api/s3-presigned-url', {
      fileName,
    });
    const { uploadUrl } = data;

    await axios.put(uploadUrl, blob, {
      headers: { 'Content-Type': contentType },
    });
  };

  const extractAudioFromVideo = async (
    videoBlob: Blob
  ): Promise<Blob | null> => {
    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoBlob);

      await video.play();

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(video);
      const dest = audioContext.createMediaStreamDestination();
      source.connect(dest);

      const recorder = new MediaRecorder(dest.stream);
      const chunks: Blob[] = [];

      return new Promise((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          try {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            const wavBlob = await convertWebMToWav(audioBlob);
            resolve(wavBlob);
          } catch (error) {
            reject(error);
          }
        };

        recorder.onerror = (event: Event) => {
          const errorEvent = event as ErrorEvent;
          console.error('Recorder error:', errorEvent.error);
          reject(errorEvent.error);
        };

        recorder.start();
        video.onended = () => {
          recorder.stop();
          audioContext.close();
        };
      });
    } catch (error) {
      console.error('Error extracting audio:', error);
      return null;
    }
  };

  const convertWebMToWav = async (webmBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioContext = new window.AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wavArray = audioBufferToWav(audioBuffer);
    return new Blob([wavArray], { type: 'audio/wav' });
  };

  // Corrected Function to convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): Uint8Array => {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;
    const wavBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(wavBuffer);

    writeString(view, 0, 'RIFF'); // RIFF identifier
    view.setUint32(4, 36 + dataLength, true); // file length
    writeString(view, 8, 'WAVE'); // RIFF type: "WAVE"
    writeString(view, 12, 'fmt '); // Format chunk identifier: "fmt "
    view.setUint32(16, 16, true); // Format chunk length: 16
    view.setUint16(20, 1, true); // Sample format (1 = raw)
    view.setUint16(22, numberOfChannels, true); // Channel count
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, byteRate, true); // Byte rate
    view.setUint16(32, blockAlign, true); // Block align
    view.setUint16(34, bitsPerSample, true); // Bits per sample
    writeString(view, 36, 'data'); // Data chunk identifier: "data"
    view.setUint32(40, dataLength, true); // Data chunk length

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        let sample = buffer.getChannelData(channel)[i];
        sample = Math.max(-1, Math.min(1, sample));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return new Uint8Array(wavBuffer);
  };

  // Helper function to write strings to the DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={uploadVideo}
        startIcon={<UploadIcon />}
        disabled={uploading}
        color="secondary"
      >
        {uploading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Upload Video'
        )}
      </Button>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          variant="filled"
          severity={snackbarSeverity}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleCloseSnackbar}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UploadButton;
