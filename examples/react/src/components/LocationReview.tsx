import { FReviewData } from "../generated/operations";

export function LocationReview({
  data,
}: {
  data: FReviewData & { __typename: "LocationReview" };
}) {
  const author = data.author ?? "anonymous";

  return (
    <div>
      <h3>
        Location Review on {data.location.name} by {author}
      </h3>
      <h6>{data.createdAt}</h6>
      <dl>
        <dt>Difficulty</dt>
        <dd>{data.difficulty}</dd>
        <dt>Design</dt>
        <dd>{data.design}</dd>
      </dl>
    </div>
  );
}
