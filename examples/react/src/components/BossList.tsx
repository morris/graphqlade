import { useGqlQuery } from "../graphql";

export function BossList() {
  const { data } = useGqlQuery("Bosses", undefined);

  return (
    <ul className="bosses">
      {data?.bosses?.map((it) => (
        <li key={it.id}>
          {it.name} ({it.location.name})
        </li>
      ))}
    </ul>
  );
}
