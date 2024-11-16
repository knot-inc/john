import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  Card,
  Box,
  FormControlLabel,
  Switch,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import Markdown from 'react-markdown';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

import { useAppContext } from '@/app/appContext';
import { JsonResult } from '@/types/jsonResultTypes';
//import jsonResult from '@/lib/dummyJsonResult';

const SkillResponseSchema = z.object({
  skills: z.array(
    z.object({
      originalText: z.string(),
      correctedSkill: z.string(),
    })
  ),
});

const GrammarCheckResponseSchema = z.object({
  grammarIssues: z.array(
    z.object({
      text: z.string(),
      explanation: z.string(),
    })
  ),
});

const ResultDisplay: React.FC = () => {
  const { jsonResult } = useAppContext() as { jsonResult: JsonResult };

  const [transcript, setTranscript] = useState<string | null>(null);
  const [modifiedTranscript, setModifiedTranscript] = useState<string | null>(
    null
  );
  const [skills, setSkills] = useState<
    { originalText: string; correctedSkill: string }[]
  >([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [grammarIssues, setGrammarIssues] = useState<
    { text: string; explanation: string }[]
  >([]);

  const [showScores, setShowScores] = useState(false);
  const [highlightText, setHighlightText] = useState<string | null>(null);

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

  const checkGrammar = async (text: string) => {
    try {
      const response = await axios.post('/api/chat', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Identify grammar mistakes in the provided transcript. Return each mistake along with an explanation of the issue. The response should be in JSON format.`,
          },
          {
            role: 'user',
            content: `Transcript: ${text}`,
          },
        ],
        response_format: zodResponseFormat(
          GrammarCheckResponseSchema,
          'grammarIssues'
        ),
      });
      const grammarData = JSON.parse(response.data.reply).grammarIssues || [];
      setGrammarIssues(grammarData);
    } catch (error) {
      console.error('Error performing grammar check:', error);
    }
  };

  const modifyTranscript = async (text: string) => {
    try {
      const response = await axios.post('/api/chat', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Please review and correct the transcript for accuracy. Check for any misheard words, missing words, or punctuation errors. Edit for clarity and readability. Output just the corrected transcript no other messages. \nYou should output html, each line format: start_t-end_t: text <br />`,
          },
          {
            role: 'user',
            content: `Transcript: ${text}`,
          },
        ],
      });
      const modifiedTranscript = response.data.reply;
      setModifiedTranscript(modifiedTranscript);
      return modifiedTranscript;
    } catch (error) {
      console.error('Error correcting transcript:', error);
      return text;
    }
  };

  const extractSkills = async (text: string) => {
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
            content: `Transcript: ${text}`,
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

  const summarizeKeyPoints = async (transcript: string) => {
    try {
      const response = await axios.post('/api/chat', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Summarize the key points from the following transcript. Focus on questions asked, answers provided, and any significant observations. Return the summary as a list of bullet points. Output just the key points markdown with no other messages.`,
          },
          {
            role: 'user',
            content: `Transcript: ${transcript}`,
          },
        ],
      });
      setSummary(response.data.reply);
    } catch (error) {
      console.error('Error summarizing key points:', error);
    }
  };

  const renderHighlighted = (text: string) => {
    if (!text) return '';

    const parts = text.split(new RegExp(`(${highlightText})`, 'gi'));
    let renderText = parts
      .map((part) =>
        part.toLowerCase() === highlightText?.toLowerCase()
          ? `<span style="background-color: rgba(213, 0, 249, 0.2);">${part}</span>`
          : part
      )
      .join('');

    const lines = renderText.split('<br />');
    return lines
      .map((line) => {
        const match = line.match(/^([\d.]+)-([\d.]+):\s(.*)$/);
        if (!match) return line;

        const start_t = parseFloat(match[1]);
        return `
					<span 
						style="cursor: pointer; display: block;" 
						onclick="document.getElementById('recorded-video').currentTime = ${start_t}; document.getElementById('recorded-video').play();"
					>
						${line}
					</span>`;
      })
      .join('');
  };

  useEffect(() => {
    if (jsonResult && jsonResult.transcript) {
      console.log('Calling chat API');
      const tmpTranscript = jsonResult.transcript
        .map((item) => `${item.start_t}-${item.end_t}: ${item.text}`)
        .join('<br />');
      setTranscript(tmpTranscript);
      checkGrammar(tmpTranscript);
      modifyTranscript(tmpTranscript).then((modified) => {
        extractSkills(modified);
        summarizeKeyPoints(modified);
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
            <>
              <Typography
                variant="body1"
                dangerouslySetInnerHTML={{
                  __html: transcript ? renderHighlighted(transcript) : '',
                }}
              />
            </>
          )}
        </Box>
      </Box>

      {/* Grammar Issues Section */}
      {grammarIssues.length > 0 && (
        <Box sx={{ marginBottom: '1.25rem' }}>
          <Typography variant="h6" gutterBottom>
            Grammar Issues
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Mistake</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Explanation</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grammarIssues.map(({ text, explanation }, index) => (
                  <TableRow
                    key={index}
                    onMouseEnter={() => setHighlightText(text)}
                    onMouseLeave={() => setHighlightText(null)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor:
                        highlightText === text
                          ? 'rgba(213, 0, 249, 0.2)'
                          : 'inherit',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <TableCell>{text}</TableCell>
                    <TableCell>{explanation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Modified Transcript Section */}
      {modifiedTranscript && (
        <Box sx={{ marginBottom: '1.25rem' }}>
          <Typography variant="h6" gutterBottom>
            Modified Transcript
          </Typography>
          <Typography
            variant="body1"
            dangerouslySetInnerHTML={{
              __html: renderHighlighted(modifiedTranscript),
            }}
          />
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
                color={highlightText === originalText ? 'secondary' : 'primary'}
                onMouseEnter={() => setHighlightText(originalText)}
                onMouseLeave={() => setHighlightText(null)}
                onClick={() =>
                  window.open(
                    `https://www.google.com/search?q=${correctedSkill}`,
                    '_blank'
                  )
                }
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Key Points Section */}
      {summary && (
        <Box
          sx={{
            marginBottom: '1.25rem',
            maxWidth: '100%',
            overflow: 'hidden',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Key Points
          </Typography>
          <Typography variant="body1" sx={{ paddingLeft: '1.25rem' }}>
            <Markdown>{summary}</Markdown>
          </Typography>
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
