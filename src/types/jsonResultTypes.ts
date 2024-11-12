export interface JsonResult {
  accents: Record<string, number>;
  fillers: number;
  transcript: string;
  token_scores: Record<string, number>;
  mean_score: number;
}
