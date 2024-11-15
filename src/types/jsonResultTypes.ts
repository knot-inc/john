export interface JsonResult {
  accents: Record<string, number>;
  fillers: number;
  transcript: TranscriptEntry[];
  token_scores: Record<string, number>;
  mean_score: number;
}

export interface TranscriptEntry {
  start_t: string;
  end_t: string;
  text: string;
}
