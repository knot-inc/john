'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Button, Box } from '@mui/material';
import { FiberManualRecord as RecordIcon } from '@mui/icons-material';

interface VideoRecorderProps {
  setRecordedVideoURL: React.Dispatch<React.SetStateAction<string | null>>;
  setVideoBlob: React.Dispatch<React.SetStateAction<Blob | null>>;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  setRecordedVideoURL,
  setVideoBlob,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

  useEffect(() => {
    const setupVideoFeed = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    setupVideoFeed();

    return () => {
      // Stop all media tracks when component unmounts
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startRecording = () => {
    if (!streamRef.current) {
      console.error('No media stream available for recording.');
      return;
    }

    setIsRecording(true);

    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, {
          type: 'video/mp4',
        });

        // Check the file size before proceeding
        if (videoBlob.size > MAX_FILE_SIZE) {
          alert('Recording is too large. Please record a shorter video.');
          // Clear recorded chunks if file is too large
          recordedChunksRef.current = [];
          setIsRecording(false);
          return;
        }

        const videoUrl = URL.createObjectURL(videoBlob);
        setRecordedVideoURL(videoUrl);
        setVideoBlob(videoBlob);
        recordedChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
    } catch (error) {
      console.error('Error starting MediaRecorder:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Box textAlign="center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '80%', margin: '20px 0' }}
      />
      <Button
        variant="contained"
        onClick={isRecording ? stopRecording : startRecording}
        startIcon={<RecordIcon />}
        color={isRecording ? 'error' : 'primary'}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Button>
    </Box>
  );
};

export default VideoRecorder;
