import { makeItem, type Runtime, type Work } from "../schema";

// Scripted, offline responses. All dialogue and keyword rules belong to the story.
export function sendRomanceMessage(
  work: Work,
  previous: Runtime,
  text: string,
): Runtime {
  const body = text.trim().slice(0, 1000);
  if (work.variables.experience !== "romance" || !body) return previous;
  const app = String(work.variables.chatApp);
  const title = String(work.variables.boyfriendChat);
  const templates = (work.data[app] ?? []).filter(
    (i) => i.meta.romanceReply === "true",
  );
  const specific = templates.find((i) =>
    i.meta.keywords?.split("|").some((key) => key && body.includes(key)),
  );
  const fallback = templates.filter((i) => !i.meta.keywords);
  const count = Number(previous.variables.romanceMessages ?? 0);
  const reply = specific ?? fallback[count % Math.max(1, fallback.length)];
  if (!reply) return previous;
  const next = structuredClone(previous);
  const time = `${previous.date ?? work.phone.date} ${previous.time}`;
  next.messages[app] = [
    ...(next.messages[app] ?? []),
    makeItem({ title, body, sender: work.phone.owner, outgoing: true, time }),
    makeItem({
      title,
      body: reply.body,
      sender: String(work.variables.boyfriendName),
      avatar: reply.avatar,
      time,
      meta: { conversationId: "chat-boyfriend" },
    }),
  ];
  next.variables.romanceMessages = count + 1;
  return next;
}
