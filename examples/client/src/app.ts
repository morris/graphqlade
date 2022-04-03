import { MyClient } from "./client";
import {
  DBosses,
  DLocations,
  DReviews,
  Maybe,
  TDifficulty,
  TRating,
  typeRef,
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
    <form class="add-review">
      <h3>Add Boss Review</h3>
      <p>
        <label>
          Boss<br>
          <select name="bossId"></select>
        </label>
      </p>
      <p>
        <label>
          Difficulty<br>
          <select name="difficulty">
            <option value="${TDifficulty.OKAYISH}">Okayish</option>
            <option value="${TDifficulty.HARD}">Hard</option>
            <option value="${TDifficulty.IMPOSSIBLE}">Impossible</option>
          </select>
        </label>
      </p>
      <p>
        <label>
          Theme<br>
          <select name="theme">
            <option value="${TRating.STELLAR}">Stellar</option>
            <option value="${TRating.AMAZING}">Amazing</option>
            <option value="${TRating.ALRIGHT}">Alright</option>
            <option value="${TRating.MEH}">Meh</option>
            <option value="${TRating.TERRIBLE}">Terrible</option>
          </select>
        </label>
      </p>
      <p>
        <button type="submit">Submit</button>
      </p>
    </form>
    <div class="reviews"></div>
  `;

  const client = new MyClient();

  client.query("Bosses", undefined).then((x) => update({ bossData: x.data }));
  client.query("Locations", {}).then((x) => update({ locationData: x.data }));
  client
    .query("Reviews", undefined)
    .then((x) => update({ reviewData: x.data }));

  setTimeout(async () => {
    try {
      for await (const review of client.subscribe("NewReviews", {})) {
        if (review.data?.newReview) {
          state.reviewData?.reviews?.push(review.data?.newReview);
          update({});
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }, 100);

  el.querySelector<HTMLFormElement>(".add-review")?.addEventListener(
    "submit",
    (e) => {
      e.preventDefault();

      client.mutate("CreateBossReview", {
        input: {
          bossId: el.querySelector<HTMLSelectElement>("[name=bossId]")
            ?.value as string,
          difficulty: el.querySelector<HTMLSelectElement>("[name=difficulty]")
            ?.value as TDifficulty,
          theme: el.querySelector<HTMLSelectElement>("[name=theme]")
            ?.value as TRating,
        },
      });
    }
  );

  function update(next: Partial<AppState>) {
    Object.assign(state, next);

    el.querySelectorAll<HTMLElement>("[name=bossId]").forEach((el) => {
      el.innerHTML =
        state.bossData?.bosses?.map(renderBossOption).join("") ?? "";
    });

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
  const Boss = typeRef(state.bossData?.bosses?.[0]);
  const Location = typeRef(state.locationData?.locations?.[0]);
  const Review = typeRef(state.reviewData?.reviews?.[0]);

  function renderBossOption(data: typeof Boss) {
    return `<option value="${data.id}">${data.name}</p>`;
  }

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
