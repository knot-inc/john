import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  Card,
  Box,
  FormControlLabel,
  Switch,
  Chip,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

//import { useAppContext } from '@/app/appContext';
//import { JsonResult } from '@/types/jsonResultTypes';
import jsonResult from '@/lib/dummyJsonResult';

const SkillResponseSchema = z.object({
  skills: z.array(
    z.object({
      originalText: z.string(),
      correctedSkill: z.string(),
    })
  ),
});

const ResultDisplay: React.FC = () => {
  //const { jsonResult } = useAppContext() as { jsonResult: JsonResult };

  const [modifiedTranscript, setModifiedTranscript] = useState<string | null>(
    null
  );
  const [skills, setSkills] = useState<
    { originalText: string; correctedSkill: string }[]
  >([]);
  const [showScores, setShowScores] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  const calculateTopAccents = (accents: Record<string, number>) => {
    return Object.entries(accents)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value], index) => ({
        id: index,
        value: value,
        label: `${label}: ${(value * 100).toFixed(2)}%`,
      }));
  };

  const filteredTokens = (token_scores: Record<string, number>) => {
    return Object.entries(token_scores).filter(
      ([token]) => !/^<\|.*\|>$/.test(token)
    );
  };

  const modifyTranscript = async (transcript: string) => {
    try {
      const response = await axios.post('/api/chat', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Please review and correct the transcript for accuracy. Check for any misheard words, missing words, or punctuation errors. Edit for clarity and readability. Output just the corrected transcript no other messages.`,
          },
          {
            role: 'user',
            content: `Transcript: ${transcript}`,
          },
        ],
      });
      const modifiedTranscript = response.data.reply;
      setModifiedTranscript(modifiedTranscript);
      return modifiedTranscript;
    } catch (error) {
      console.error('Error correcting transcript:', error);
      return transcript;
    }
  };

  const extractSkills = async (transcript: string) => {
    try {
      const response = await axios.post('/api/chat', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract technology skills from the following transcript. Return each identified skill term with its original mention in the transcript, and provide the standardized skill term, if different. Use standardized terminology similar to those found in Wikipedia technology skill entries.`,
          },
          {
            role: 'user',
            content: `Transcript: ${transcript}`,
          },
        ],
        response_format: zodResponseFormat(SkillResponseSchema, 'skills'),
      });
      const extractedSkills = JSON.parse(response.data.reply).skills || [];
      setSkills(extractedSkills);
    } catch (error) {
      console.error('Error extracting skills:', error);
    }
  };

  const renderHighlightedTranscript = (transcript: string) => {
    if (!transcript) return null;

    const parts = transcript.split(new RegExp(`(${hoveredSkill})`, 'gi'));
    return parts.map((part, index) => (
      <span
        key={index}
        style={{
          backgroundColor:
            part.toLowerCase() === hoveredSkill?.toLowerCase()
              ? 'rgba(213, 0, 249, 0.2)'
              : 'transparent',
        }}
      >
        {part}
      </span>
    ));
  };

  useEffect(() => {
    if (jsonResult && jsonResult.transcript) {
      console.log('Calling chat API');
      modifyTranscript(jsonResult.transcript).then((modified) => {
        extractSkills(modified);
      });
    }
  }, [jsonResult]);

  return jsonResult === null ? null : (
    <Card sx={{ padding: '1.25rem', marginTop: '1.25rem' }}>
      <Typography variant="h5" gutterBottom>
        Analysis Result
      </Typography>

      {/* Top 5 Accents Pie Chart */}
      <Box sx={{ marginBottom: '1.25rem' }}>
        <Typography variant="h6" gutterBottom>
          Top 5 Accents
        </Typography>
        <PieChart
          series={[
            {
              data: calculateTopAccents(jsonResult.accents),
              arcLabel: (item) => `${(item.value * 100).toFixed(2)}%`,
              arcLabelRadius: '70%',
              arcLabelMinAngle: 30,
            },
          ]}
          width={700}
          height={300}
          sx={{ marginTop: '0.625rem' }}
        />
      </Box>

      {/* Transcript Section */}
      <Box sx={{ marginBottom: '1.25rem' }}>
        <Typography variant="h6" gutterBottom>
          Transcript
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={showScores}
              onChange={() => setShowScores(!showScores)}
            />
          }
          label="With score"
        />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', marginTop: '0.625rem' }}>
          {showScores ? (
            filteredTokens(jsonResult.token_scores).map(
              ([token, score], index) => (
                <Box
                  key={index}
                  sx={{
                    marginRight: '0.5rem',
                    marginBottom: '0.75rem',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" display="block">
                    {score.toFixed(2)}
                  </Typography>
                  <Typography variant="body1">{token}</Typography>
                </Box>
              )
            )
          ) : (
            <Typography variant="body1">
              {renderHighlightedTranscript(jsonResult.transcript)}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Modified Transcript Section */}
      {modifiedTranscript && (
        <Box sx={{ marginBottom: '1.25rem' }}>
          <Typography variant="h6" gutterBottom>
            Modified Transcript
          </Typography>
          <Typography variant="body1">
            {renderHighlightedTranscript(modifiedTranscript)}
          </Typography>
        </Box>
      )}

      {/* Skills Section */}
      {skills.length > 0 && (
        <Box sx={{ marginBottom: '1.25rem' }}>
          <Typography variant="h6" gutterBottom>
            Skills
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {skills.map(({ originalText, correctedSkill }, index) => (
              <Chip
                key={index}
                label={correctedSkill}
                variant="outlined"
                color={hoveredSkill === originalText ? 'secondary' : 'primary'}
                onMouseEnter={() => setHoveredSkill(originalText)}
                onMouseLeave={() => setHoveredSkill(null)}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Mean Score */}
      <Box sx={{ marginBottom: '1.25rem' }}>
        <Typography variant="h6" gutterBottom>
          Mean Score
        </Typography>
        <Typography variant="body1">
          {jsonResult.mean_score.toFixed(2)}
        </Typography>
      </Box>

      {/* Full JSON Result */}
      <Typography variant="h6" gutterBottom>
        Full JSON Data
      </Typography>
      <Box
        sx={{
          overflow: 'auto',
          maxHeight: '18.75rem',
          whiteSpace: 'pre-wrap',
          backgroundColor: '#f4f4f4',
          padding: '0.625rem',
          borderRadius: '0.25rem',
        }}
      >
        <Typography variant="body2" component="pre">
          {JSON.stringify(jsonResult, null, 2)}
        </Typography>
      </Box>
    </Card>
  );
};

export default ResultDisplay;
