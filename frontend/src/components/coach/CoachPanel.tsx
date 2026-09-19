import { useState } from "react";
import { ArrowUp, Sparkles, X, Loader2 } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { coachSuggestions } from "@/lib/mock-data";
import { api, ApiError } from "@/services/api";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "coach";
  text: string;
  actionItems?: string[];
  relatedSkills?: string[];
}

export function CoachConversation({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "coach",
      text: "Hi! I'm your AI Career Coach. I've reviewed your career profile. Ask me about what to learn next, your resume, interview preparation, skill gaps, or your target role.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    const value = text.trim();

    if (!value || loading) {
      return;
    }

    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: value,
      },
    ]);

    setLoading(true);

    try {
      const response = await api.askCoach(value);

      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          text: response.answer,
          actionItems: response.action_items,
          relatedSkills: response.related_skills,
        },
      ]);
    } catch (error) {
      let errorMessage =
        "I couldn't connect to the AI Coach right now. Please try again.";

      if (error instanceof ApiError) {
        errorMessage = error.message;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          text: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div
        className={cn(
          "flex-1 space-y-4 overflow-y-auto p-5",
          compact && "p-4",
        )}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-3",
              message.role === "user" && "justify-end",
            )}
          >
            {message.role === "coach" && (
              <LogoMark className="mt-0.5 h-7 w-7 shrink-0" />
            )}

            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                message.role === "coach"
                  ? "border border-border bg-muted/60"
                  : "bg-primary text-primary-foreground",
              )}
            >
              <p>{message.text}</p>

              {/* Action items */}
              {message.actionItems &&
                message.actionItems.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Recommended actions
                    </p>

                    <ul className="space-y-2">
                      {message.actionItems.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex gap-2 text-sm"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Related skills */}
              {message.relatedSkills &&
                message.relatedSkills.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Related skills
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {message.relatedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3">
            <LogoMark className="mt-0.5 h-7 w-7 shrink-0" />

            <div className="rounded-xl border border-border bg-muted/60 px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Career Copilot is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5">
          {coachSuggestions
            .slice(0, compact ? 3 : 6)
            .map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={loading}
                onClick={() => send(suggestion)}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
        </div>

        {/* Input form */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
          className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:border-primary/50"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />

          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={loading}
            placeholder="Ask Career Copilot..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-primary p-1.5 text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export function CoachDock() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[min(560px,75vh)] w-[min(400px,calc(100vw-2.5rem))] animate-rise flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-float">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Logo />

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Close coach"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <CoachConversation compact />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-3 text-sm font-semibold text-primary-foreground shadow-float transition-transform hover:-translate-y-0.5"
      >
        <Sparkles className="h-4 w-4" />
        Ask Career Copilot
      </button>
    </>
  );
}