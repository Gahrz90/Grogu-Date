/**
 * The date ideas, shared by the picker and the Server Action: the action
 * validates the incoming id against this list instead of trusting the client.
 */
export const ACTIVITIES = [
  { id: "sushi", label: "Sushi", icon: "🍣" },
  { id: "pizza", label: "Pizza", icon: "🍕" },
  { id: "movie", label: "Cinema", icon: "🎬" },
  { id: "thai", label: "Thai", icon: "🍜" },
  { id: "bowling", label: "Bowling", icon: "🎳" },
  { id: "steak", label: "Steak", icon: "🥩" },
  { id: "fish", label: "Pesce", icon: "🐟" },
] as const;

export type Activity = (typeof ACTIVITIES)[number];
export type ActivityId = Activity["id"];

export function findActivity(id: string | null | undefined): Activity | null {
  return ACTIVITIES.find((activity) => activity.id === id) ?? null;
}
