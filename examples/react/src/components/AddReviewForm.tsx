import { useState } from 'react';
import {
  TCreateBossReviewInput,
  TDifficulty,
  TRating,
} from '../generated/operations';
import { useGqlMutation, useGqlQuery } from '../graphql';

export function AddReviewForm() {
  const [state, setState] = useState<Partial<TCreateBossReviewInput>>({});
  const input =
    state.bossId && state.difficulty && state.theme
      ? (state as TCreateBossReviewInput)
      : undefined;

  const GetBosses = useGqlQuery('Bosses', undefined);
  const CreateBossReview = useGqlMutation('CreateBossReview');

  return (
    <form className="add-review">
      <h3>Add Boss Review</h3>
      <p>
        <label>
          Boss
          <br />
          <select
            onChange={(e) =>
              setState((input) => ({ ...input, bossId: e.target.value }))
            }
          >
            <option value="">Select...</option>
            {GetBosses.data?.bosses?.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </select>
        </label>
      </p>
      <p>
        <label>
          Difficulty
          <br />
          <select
            onChange={(e) =>
              setState((input) => ({
                ...input,
                difficulty: e.target.value as TDifficulty,
              }))
            }
          >
            <option value="">Select...</option>
            <option value={TDifficulty.OKAYISH}>Okayish</option>
            <option value={TDifficulty.HARD}>Hard</option>
            <option value={TDifficulty.IMPOSSIBLE}>Impossible</option>
          </select>
        </label>
      </p>
      <p>
        <label>
          Theme
          <br />
          <select
            onChange={(e) =>
              setState((input) => ({
                ...input,
                theme: e.target.value as TRating,
              }))
            }
          >
            <option value="">Select...</option>
            <option value={TRating.STELLAR}>Stellar</option>
            <option value={TRating.AMAZING}>Amazing</option>
            <option value={TRating.ALRIGHT}>Alright</option>
            <option value={TRating.MEH}>Meh</option>
            <option value={TRating.TERRIBLE}>Terrible</option>
          </select>
        </label>
      </p>
      <p>
        <button
          type="button"
          disabled={!input}
          onClick={() => input && CreateBossReview.mutate({ input })}
        >
          Submit
        </button>
      </p>
    </form>
  );
}
