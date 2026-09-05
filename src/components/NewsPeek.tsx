"use client";

import { ChevronDown, Newspaper } from "lucide-react";
import type { NewsItem } from "@/types";
import { relativeTime } from "@/utils/distance";

type Props = {
  news: NewsItem[];
  open: boolean;
  onToggle: () => void;
};

export default function NewsPeek({ news, open, onToggle }: Props) {
  const items = news.slice(0, 5);
  if (items.length === 0) return null;

  return (
    <aside className={`news-peek ${open ? "open" : ""}`}>
      <button type="button" className="news-peek-toggle" onClick={onToggle}>
        <Newspaper size={13} />
        <span>Hyd Brief</span>
        <small>{items.length}</small>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="news-peek-list">
          {items.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
              <small>{item.source} · {relativeTime(item.publishedAt)}</small>
              <strong>{item.title}</strong>
            </a>
          ))}
        </div>
      )}
    </aside>
  );
}
