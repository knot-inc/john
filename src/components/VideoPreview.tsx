'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';

interface VideoPreviewProps {
  recordedVideoURL: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ recordedVideoURL }) => (
  <Box textAlign="center">
    <Typography variant="h6" gutterBottom>
      Recorded Video Preview
    </Typography>
    <video src={recordedVideoURL} controls style={{ width: '80%' }} />
  </Box>
);

export default VideoPreview;
