import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FlashCard } from '../types';
import StudyDeck from './StudyDeck';

export default function FlashCardApp() {
  const [cards, setCards] = useState<FlashCard[]>(() => {
    const saved = localStorage.getItem('flashcards');
    return saved ? JSON.parse(saved) : [];
  });
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [operationFeedback, setOperationFeedback] = useState('');

  useEffect(() => {
    localStorage.setItem('flashcards', JSON.stringify(cards));
  }, [cards]);

  const addCard = () => {
    if (!frontText || !backText) return;
    
    const newCard: FlashCard = {
      id: uuidv4(),
      front: frontText,
      back: backText,
      nextReview: new Date().toISOString(),
      interval: 1,
      repetitions: 0
    };

    setCards([...cards, newCard]);
    setFrontText('');
    setBackText('');
  };

  const updateCard = (updatedCard: FlashCard) => {
    setCards(cards.map(card => card.id === updatedCard.id ? updatedCard : card));
  };

  const resetProgress = () => {
    if (!window.confirm('Are you sure you want to reset all learning progress?')) return;
    
    const resetCards = cards.map(card => ({
      ...card,
      nextReview: new Date().toISOString(),
      interval: 1,
      repetitions: 0
    }));
    
    setCards([...resetCards]);  // Create new array reference to trigger state reset
    setOperationFeedback('All learning progress has been reset');
  };

  const exportCards = () => {
    const dataStr = JSON.stringify(cards, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flashcards-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setOperationFeedback('Cards exported successfully');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCards = JSON.parse(e.target?.result as string);
        if (!Array.isArray(importedCards) || !importedCards.every(isValidCard)) {
          throw new Error('Invalid file format');
        }
        
        if (!window.confirm(`Import ${importedCards.length} cards? This will replace current cards.`)) return;
        
        setCards(importedCards);
        setOperationFeedback(`Successfully imported ${importedCards.length} cards`);
      } catch (error) {
        setOperationFeedback('Error importing cards: Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const isValidCard = (card: any): card is FlashCard => {
    return (
      typeof card?.id === 'string' &&
      typeof card?.front === 'string' &&
      typeof card?.back === 'string' &&
      typeof card?.nextReview === 'string' &&
      typeof card?.interval === 'number' &&
      typeof card?.repetitions === 'number'
    );
  };

  const removeAllCards = () => {
    if (!window.confirm('Are you sure you want to remove ALL cards?')) return;
    setCards([]);
    setOperationFeedback('All cards have been removed');
  };

  return (
    <div className="container">
      <h1>Flashcards</h1>
      <div className="management-controls">
        <h2>Card Management</h2>
        <div className="button-group">
          <button onClick={resetProgress} className="warning">
            Reset All Progress
          </button>
          <button onClick={exportCards} className="secondary">
            Export Cards
          </button>
          <label className="file-import secondary">
            Import Cards
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={removeAllCards} className="danger">
            Remove All Cards
          </button>
        </div>
        {operationFeedback && (
          <div className="operation-feedback">{operationFeedback}</div>
        )}
      </div>
      <div className="card-creator">
        <h2>Create New Card</h2>
        <input
          value={frontText}
          onChange={(e) => setFrontText(e.target.value)}
          placeholder="Front of card"
        />
        <input
          value={backText}
          onChange={(e) => setBackText(e.target.value)}
          placeholder="Back of card"
        />
        <button onClick={addCard}>Add Card</button>
      </div>

      <StudyDeck cards={cards} updateCard={updateCard} />
    </div>
  );
}