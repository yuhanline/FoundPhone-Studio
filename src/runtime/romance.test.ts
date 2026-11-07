import { describe, expect, it } from "vitest";
import story from "../../stories/template/story.json";
import { compileStory } from "../story-engine/compiler";
import { initialRuntime } from "../schema";
import { sendRomanceMessage } from "./romance";

const { work } = compileStory(story);
describe("romance chat", () => {
  it("preserves the original runtime and stores the right sender, thread and story time", () => {
    const previous = initialRuntime(work);
    const next = sendRomanceMessage(work, previous, " 今天有点累 ");
    expect(previous.messages).toEqual({});
    expect(next.messages.messages).toHaveLength(2);
    const [sent, reply] = next.messages.messages;
    expect(sent).toMatchObject({
      body: "今天有点累",
      sender: work.phone.owner,
      outgoing: true,
      title: work.variables.boyfriendChat,
    });
    expect(reply).toMatchObject({
      sender: work.variables.boyfriendName,
      outgoing: false,
      title: sent.title,
      time: sent.time,
    });
    expect(reply.body).toContain("辛苦了");
    expect(JSON.parse(JSON.stringify(next)).messages.messages).toEqual(
      next.messages.messages,
    );
  });
  it("ignores empty messages and leaves other stories unchanged", () => {
    const state = initialRuntime(work);
    expect(sendRomanceMessage(work, state, "  ")).toBe(state);
    expect(sendRomanceMessage({ ...work, variables: {} }, state, "你好")).toBe(
      state,
    );
  });
  it("keeps unrecognized input literal, rotates fallback replies and limits input length", () => {
    const first = sendRomanceMessage(
      work,
      initialRuntime(work),
      "<script>alert(1)</script>",
    );
    expect(first.messages.messages[0].body).toBe("<script>alert(1)</script>");
    const second = sendRomanceMessage(work, first, "x".repeat(2000));
    expect(second.messages.messages[2].body).toHaveLength(1000);
    expect(second.messages.messages[3].body).not.toBe(
      first.messages.messages[1].body,
    );
    expect(second.variables.romanceMessages).toBe(2);
  });
});
