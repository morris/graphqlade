import { useState } from "react";
import { FReviewData } from "../generated/operations";
import { useGqlQuery, useGqlSubscription } from "../graphql";
import { BossReview } from "./BossReview";
import { LocationReview } from "./LocationReview";

export function ReviewList() {
  const { data } = useGqlQuery("Reviews", undefined, {
    onSuccess() {
      setNewReviews([]);
    },
  });
  const [newReviews, setNewReviews] = useState<FReviewData[]>([]);

  useGqlSubscription(
    "NewReviews",
    {},
    {
      onData(data) {
        setNewReviews((reviews) => [...reviews, data.newReview]);
      },
      onError(err) {
        // eslint-disable-next-line no-console
        console.error(err);
      },
    }
  );

  const reviews = [...(data?.reviews || []), ...newReviews];

  return (
    <div className="reviews">
      {reviews.map((it) =>
        it.__typename === "BossReview" ? (
          <BossReview key={it.id} data={it} />
        ) : (
          <LocationReview key={it.id} data={it} />
        )
      )}
    </div>
  );
}
