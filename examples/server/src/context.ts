import { bosses, locations, reviews } from "./data";
import { ReviewData } from "./types";

export class MyContext {
  getBosses() {
    return bosses;
  }

  getBossById(id: number) {
    return bosses.find((it) => it.id === id);
  }

  getBossesByLocationId(locationId: number) {
    return bosses.filter((it) => it.locationId === locationId);
  }

  getLocations() {
    return locations;
  }

  getLocationById(id: number) {
    return locations.find((it) => it.id === id);
  }

  getReviews() {
    return reviews;
  }

  getReviewsBySubjectId(id: number) {
    return reviews.filter((it) => it.subjectId === id);
  }

  saveReview(review: Omit<ReviewData, "id" | "time">) {
    const reviewWithId = { ...review, id: this.uuid(), time: new Date() };
    reviews.push(reviewWithId);

    return reviewWithId;
  }

  search(q: string) {
    return [
      ...locations.filter((it) => it.name.match(q)),
      ...bosses.filter((it) => it.name.match(q)),
    ];
  }

  uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == "x" ? r : (r & 0x3) | 0x8;

        return v.toString(16);
      }
    );
  }
}
