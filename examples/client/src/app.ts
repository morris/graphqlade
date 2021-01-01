import { MyClient } from "./client";
import {
  DBosses,
  DLocations,
  DReviews,
  Maybe,
  certain,
} from "./generated/operations";

export interface AppState {
  bossData?: Maybe<DBosses>;
  locationData?: Maybe<DLocations>;
  reviewData?: Maybe<DReviews>;
}

export function App(el: Element) {
  const state: AppState = {};

  el.innerHTML = `
    <h1>Dark Souls App</h1>
    <h2>Bosses</h2>
    <div class="bosses"></div>
    <h2>Locations</h2>
    <div class="locations"></div>
    <h2>Reviews</h2>
    <div class="reviews"></div>
  `;

  const client = new MyClient();

  client.queryBosses().then((x) => update({ bossData: x.data }));
  client.queryLocations().then((x) => update({ locationData: x.data }));
  client.queryReviews().then((x) => update({ reviewData: x.data }));

  setTimeout(async () => {
    try {
      for await (const review of client.subscribeNewReviews({})) {
        if (review.data?.newReview) {
          state.reviewData?.reviews?.push(review.data?.newReview);
          update({});
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, 100);

  function update(next: Partial<AppState>) {
    Object.assign(state, next);

    el.querySelectorAll<HTMLElement>(".bosses").forEach((el) => {
      el.innerHTML =
        state.bossData?.bosses?.map(renderBoss).join("") ?? "Loading...";
    });

    el.querySelectorAll<HTMLElement>(".locations").forEach((el) => {
      el.innerHTML =
        state.locationData?.locations?.map(renderLocation).join("") ??
        "Loading...";
    });

    el.querySelectorAll<HTMLElement>(".reviews").forEach((el) => {
      el.innerHTML =
        state.reviewData?.reviews?.map(renderReview).join("") ?? "Loading...";
    });
  }

  // we'd like to have the types of nested data objects of operations
  // typescript does not allow "typeof" with optional chaining
  // therefore we create some variables with the "certain" helper
  const Boss = certain(state.bossData?.bosses?.[0]);
  const Location = certain(state.locationData?.locations?.[0]);
  const Review = certain(state.reviewData?.reviews?.[0]);

  function renderBoss(data: typeof Boss) {
    return `<p>${data.name} (${data.location.name})</p>`;
  }

  function renderLocation(data: typeof Location) {
    return `<p>${data.name}</p>`;
  }

  function renderReview(data: typeof Review) {
    const author = data.author ?? "<em>anonymous</em>";

    switch (data.__typename) {
      case "BossReview":
        return `<div>
          <h3>Boss Review on ${data.boss.name} by ${author}</h3>
          <h6>${data.createdAt}</h6>
          <dl>
            <dt>Difficulty</dt>
            <dd>${data.difficulty}</dd>
            <dt>Music</dt>
            <dd>${data.theme}</dd>
          </ul>
        </div>`;
      case "LocationReview":
        return `<div>
          <h3>Location Review on ${data.location.name} by ${author}</h3>
          <h6>${data.createdAt}</h6>
          <dl>
            <dt>Difficulty</dt>
            <dd>${data.difficulty}</dd>
            <dt>Design</dt>
            <dd>${data.design}</dd>
          </ul>
        </div>`;
    }
  }
}
