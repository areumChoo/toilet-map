const VOTE_KEY = "voted_passwords";
const REVIEW_KEY = "reviewed_toilets";

function getSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addToSet(key: string, id: string): void {
  if (typeof window === "undefined") return;
  try {
    const set = getSet(key);
    set.add(id);
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // localStorage 사용 불가 시 무시
  }
}

export function hasVotedPassword(id: string): boolean {
  return getSet(VOTE_KEY).has(id);
}

export function markPasswordVoted(id: string): void {
  addToSet(VOTE_KEY, id);
}

export function hasReviewedToilet(id: string): boolean {
  return getSet(REVIEW_KEY).has(id);
}

export function markToiletReviewed(id: string): void {
  addToSet(REVIEW_KEY, id);
}
