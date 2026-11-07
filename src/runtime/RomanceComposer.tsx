import { createContext, useContext, useState } from "react";
import { ArrowUp } from "lucide-react";

export const RomanceConversation = createContext<
  ((text: string) => void) | null
>(null);

export function RomanceComposer() {
  const send = useContext(RomanceConversation);
  const [draft, setDraft] = useState("");
  return (
    <form
      className="romance-compose"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.trim() || !send) return;
        send(draft.trim());
        setDraft("");
      }}
    >
      <input
        aria-label="给男友发消息"
        placeholder="想对他说些什么…"
        value={draft}
        maxLength={1000}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.nativeEvent.isComposing)
            e.preventDefault();
        }}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button type="submit" aria-label="发送消息" disabled={!draft.trim()}>
        <ArrowUp size={18} />
      </button>
    </form>
  );
}
