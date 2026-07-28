# Vocabulary Practice Order Design

## Goal

Ensure that the vocabulary test does not present words in the same positions as the preceding flashcard review.

## Scope

This change affects the “Ôn nghĩa” flow in `client/app/flashcard/page.tsx` and replaces literal UI emoji in the vocabulary practice and voice-picker interfaces with Lucide icons. Emoji required by AI-generated lesson formats remain unchanged.

## Data flow

1. `studyBatch(size)` continues selecting a priority-ordered batch: due words first, then the soonest future reviews.
2. `StudyCards` receives that batch unchanged, so users review the selected cards in the batch order.
3. When the user selects “Kiểm tra”, the page creates a shuffled copy of the batch and passes it to `VocabPractice`.
4. `VocabPractice` records results by word, not by position, so shuffled presentation does not affect spaced-repetition data, scoring, or mastery.

## Design choice

Use the existing Fisher–Yates randomization pattern. The shuffle returns a new array and never mutates the original batch. This preserves the flashcard order while making the test order independent.

## Error handling

An empty or one-word batch is returned unchanged. The existing start guard continues to prevent empty practice sessions.

## Verification

Add a focused test for the new pure shuffle helper: it must preserve every word, return a new array, and use a supplied deterministic random source to demonstrate a changed order. Then run the focused test and the production build.
