export interface FlashCard {
    id: string;
    front: string;
    back: string;
    nextReview: string;
    interval: number;
    repetitions: number;
  }