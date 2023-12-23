import { AddReviewForm } from './AddReviewForm';
import { BossList } from './BossList';
import { LocationList } from './LocationList';
import { ReviewList } from './ReviewList';

export function App() {
  return (
    <div>
      <h1>Dark Souls App</h1>
      <h2>Bosses</h2>
      <BossList />
      <h2>Locations</h2>
      <LocationList />
      <h2>Reviews</h2>
      <AddReviewForm />
      <ReviewList />
    </div>
  );
}
