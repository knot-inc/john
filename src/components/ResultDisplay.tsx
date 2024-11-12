import React, { useState } from 'react';
import { Typography, Card, Box, FormControlLabel, Switch } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';

import { useAppContext } from '@/app/appContext';
import { JsonResult } from '@/types/jsonResultTypes';
//import jsonResult from '@/lib/dummyJsonResult';

const ResultDisplay: React.FC = () => {
  const { jsonResult } = useAppContext() as { jsonResult: JsonResult };

  const [showScores, setShowScores] = useState(false);

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
            <Typography variant="body1">{jsonResult.transcript}</Typography>
          )}
        </Box>
      </Box>

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
