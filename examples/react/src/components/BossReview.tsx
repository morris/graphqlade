import { FReviewData } from "../generated/operations";

export function BossReview({
  data,
}: {
  data: FReviewData & { __typename: "BossReview" };
}) {
  const author = data.author ?? "anonymous";

  return (
    <div>
      <h3>
        Boss Review on {data.boss.name} by {author}
      </h3>
      <h6>{data.createdAt}</h6>
      <dl>
        <dt>Difficulty</dt>
        <dd>{data.difficulty}</dd>
        <dt>Music</dt>
        <dd>{data.theme}</dd>
      </dl>
    </div>
  );
}
