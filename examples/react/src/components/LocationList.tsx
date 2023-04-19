import { useGqlQuery } from "../graphql";

export function LocationList() {
  const { data } = useGqlQuery("Locations", {});

  return (
    <ul className="locations">
      {data?.locations?.map((it) => (
        <li key={it.id}>{it.name}</li>
      ))}
    </ul>
  );
}
