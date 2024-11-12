'use client';
import React, { useState } from 'react';
import { Container, Typography, Card, Box } from '@mui/material';

import VideoRecorder from '@/components/VideoRecorder';
import VideoPreview from '@/components/VideoPreview';
import UploadButton from '@/components/UploadButton';
import ResultDisplay from '@/components/ResultDisplay';

const HomePage: React.FC = () => {
  const [recordedVideoURL, setRecordedVideoURL] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  return (
    <Container maxWidth="md" sx={{ minHeight: '100vh', padding: '20px' }}>
      <Typography variant="h5" gutterBottom textAlign="center">
        Please answer questions with video
      </Typography>
      <Typography
        variant="body1"
        textAlign="center"
        sx={{ marginBottom: '20px' }}
      >
        Q1. Please provide a 5 min intro about yourself.
      </Typography>

      <Card sx={{ padding: '20px', marginBottom: '20px' }}>
        <VideoRecorder
          setRecordedVideoURL={setRecordedVideoURL}
          setVideoBlob={setVideoBlob}
        />
      </Card>

      {recordedVideoURL && (
        <Card sx={{ padding: '20px', marginBottom: '20px' }}>
          <VideoPreview recordedVideoURL={recordedVideoURL} />
          <Box textAlign="center" mt={2}>
            <UploadButton videoBlob={videoBlob} />
          </Box>
        </Card>
      )}
      <ResultDisplay />
    </Container>
  );
};

export default HomePage;
