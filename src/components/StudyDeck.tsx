import { useState, useEffect } from 'react';
import { FlashCard } from '../types';

export default function StudyDeck({ cards, updateCard }: { 
  cards: FlashCard[], 
  updateCard: (card: FlashCard) => void 
}) {
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  const dueCards = cards.filter(card => new Date(card.nextReview) <= new Date());
  const currentCard = dueCards[currentCardIndex];

  // Reset study state when cards change
  useEffect(() => {
    setUserAnswer('');
    setFeedback('');
    setCurrentCardIndex(0);
  }, [cards]);

  // Safety check for current card index
  useEffect(() => {
    if (dueCards.length === 0) return;
    if (currentCardIndex >= dueCards.length) {
      setCurrentCardIndex(0);
    }
  }, [dueCards, currentCardIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard || !userAnswer.trim()) return;

    const isCorrect = userAnswer.trim().toLowerCase() === currentCard.back.toLowerCase();
    const updatedCard = { ...currentCard };

    // Update card first before calculating new index
    if (isCorrect) {
      updatedCard.repetitions += 1;
      updatedCard.interval = calculateNewInterval(updatedCard.repetitions, updatedCard.interval);
      updatedCard.nextReview = new Date(
        Date.now() + updatedCard.interval * 86400000
      ).toISOString();
    } else {
      updatedCard.repetitions = 0;
      updatedCard.interval = 1;
      updatedCard.nextReview = new Date(Date.now() + 86400000).toISOString();
    }

    updateCard(updatedCard);
    setFeedback(isCorrect ? 'Correct! 🎉' : `Incorrect. The answer was: ${currentCard.back}`);
    setUserAnswer('');

    // Calculate new index after state updates
    const newDueCards = cards.filter(card => 
      card.id === updatedCard.id ? 
      new Date(updatedCard.nextReview) <= new Date() : 
      new Date(card.nextReview) <= new Date()
    );

    setCurrentCardIndex(prev => {
      const nextIndex = prev + 1;
      return nextIndex >= newDueCards.length ? 0 : nextIndex;
    });
  };

  if (!dueCards.length || !currentCard) {
    return <div className="study-status">No cards due for review. 🎉</div>;
  }

  return (
    <div className="study-deck">
      <h2>Study Deck ({dueCards.length} cards due)</h2>
      <div className="card">
        <div className="card-front">{currentCard.front}</div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer..."
          />
          <button type="submit">Check Answer</button>
        </form>
        {feedback && (
          <div className={`feedback ${feedback.includes('Correct') ? 'correct' : 'incorrect'}`}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for interval calculation
function calculateNewInterval(repetitions: number, currentInterval: number): number {
  if (repetitions === 1) return 1;
  if (repetitions === 2) return 6;
  return Math.round(currentInterval * 2.5);
}