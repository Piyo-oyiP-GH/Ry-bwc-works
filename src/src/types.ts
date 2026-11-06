// 共有の型。AI 担当と画面担当の両方が使う。変えるときは CONTRACT.md も直す。

// ---- 列の値 ----
export type ItemStatus = "queued" | "reading" | "done" | "failed";
export type Pile = "keep" | "drop" | "unsure"; // いる／いらない／迷う
export type Level = "high" | "mid" | "low"; // はっきり／一部あやしい／読みにくい
export type PersonSubtype = "owner" | "relative" | "friend" | "vague";
export type ClaimSource = "photo" | "family" | "claude";
export type Strength = "weak" | "mid" | "strong"; // 弱／中／強め

// ---- 写真 ----
// 実測の結果は CONTRACT.md の「写真の大きさ」を見る
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const photoKey = (pid: string, iid: string) => `p/${pid}/items/${iid}/photo.jpg`;
export const thumbKey = (pid: string, iid: string) => `p/${pid}/items/${iid}/thumb.jpg`;

// ---- キュー ----
export type ReadItemJob = { type: "read_item"; pid: string; iid: string; r2_key: string };
export type UpdatePersonsJob = { type: "update_persons"; pid: string };
export type JobOutcome = "done" | "failed" | "retry";

// ---- 読み取りの結果（items.reading_json）----
export type TextType = "name" | "date" | "number" | "other";

export type ReadLine = {
  text: string; // 読めない所は〔不明〕
  type: TextType;
  handwritten: boolean;
  where: string;
  certainty: Level;
};

export type ReadResult = { lines: ReadLine[] }; // 呼び出し A と A2 の出力

export type Observation = {
  // 呼び出し B の出力
  kind: string;
  synonyms: string[];
  evidence: string[];
  signals: string[];
  inferences: string[];
  proper_nouns?: string[]; // B が申告した固有名詞。画面には出さず、録画モードで隠す語に使う
  moved?: string[]; // inferences のうち、文字の裏付けが無く下げた文。検索の語に入れない
};

export type ItemReading = {
  a: ReadResult | null;
  a2: ReadResult | null;
  b: Observation | null;
};

// items.search_terms。語を一致元ごとに分けて持つ
export type SearchTerms = {
  text: string[]; // 文字
  name: string[]; // 物名
  synonym: string[]; // 類義語
  inference: string[]; // 見立て
};

// items.ai_meta_json。計測だけ。読んだ文字を入れない
export type AiCallMeta = {
  call: "A" | "A2" | "B";
  model: string; // 実際に答えたモデル
  effort: string;
  seconds: number;
  stop_reason: string | null;
  input_tokens: number;
  output_tokens: number;
  fallback_used: boolean;
};

export type AiRunMeta = {
  photo_bytes: number; // R2 から読んで送ったバイト数
  photo_sha256: string; // 送ったバイト列の SHA-256
  base64_chars: number;
  encode_ms: number; // base64 にかかった時間
  calls: AiCallMeta[];
  total_seconds: number;
  error_status?: number;
  error_message?: string; // API の失敗の文。読んだ文字は含まない
};

// ---- API の JSON ----
export type UserView = { id: string; display_name: string; is_guest: boolean };

export type MeResponse = {
  user: UserView | null;
  projects: { id: string; title: string; is_sample: boolean; role: "owner" | "member" }[];
};

export type GuestResponse = { project_id: string; user: UserView };

export type ItemCard = {
  id: string;
  seq: number;
  status: ItemStatus;
  pile: Pile;
  title: string | null;
  confidence: Level | null;
  rank_score: number | null;
  rank_reason: string | null;
  needs_retake: boolean;
  error_code: string | null;
  wait_count: number;
  waited_by_me: boolean;
  photo_url: string;
  thumb_url: string;
  updated_at: number;
};

export type ItemListResponse = { items: ItemCard[] };

export type WaitView = {
  user: { id: string; display_name: string };
  note: string | null;
  created_at: number;
};

export type ClaimView = {
  id: string;
  person_id: string;
  person_label: string;
  source: ClaimSource; // 実線 photo／吹き出し family／点線 claude
  text: string;
  strength: Strength | null;
  author: { id: string; display_name: string } | null;
  item_ids: string[];
};

export type ItemDetailResponse = {
  item: ItemCard;
  reading: ItemReading | null;
  meta: AiRunMeta | null;
  claims: ClaimView[];
  waits: WaitView[];
};

export type UploadResponse = { item: ItemCard };

export type WaitResponse = { wait_count: number; waited_by_me: boolean; waits: WaitView[] };

export type SearchSource = keyof SearchTerms;
export type SearchResponse = {
  hits: { item: ItemCard; matched: { source: SearchSource; term: string }[] }[];
};

export type ParticipantView = { user_id: string; display_name: string; role: "owner" | "member" };
export type PersonView = {
  id: string;
  subtype: PersonSubtype;
  label: string;
  linked_user_id: string | null;
  claims: ClaimView[];
};
export type PersonsResponse = { participants: ParticipantView[]; persons: PersonView[] };

export type InviteResponse = { id: string; display_name: string; url: string };

export type ApiError = { error: string };
