"use client";

import type { RoadBillboard } from "@/types";

export default function BottomAdStrip({
  billboards = [],
  onSelectBillboard,
}: {
  billboards?: RoadBillboard[];
  onSelectBillboard?: (billboard: RoadBillboard) => void;
}) {
  const liveBoards = billboards.filter((item) => item.isLive);
  if (liveBoards.length === 0) return null;

  return (
    <div className="bottom-ads">
      <div className="bottom-ads-kicker">
        <span>Live boards</span>
        <small>{liveBoards.length}</small>
      </div>
      <div className="bottom-ads-track">
        {liveBoards.map((board) => (
          <button
            key={board.id}
            type="button"
            className="promo-slot live board-promo"
            onClick={() => onSelectBillboard?.(board)}
          >
            <span className="promo-badge">LIVE</span>
            <div className="promo-logo">{board.sponsorName.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{board.sponsorName}</strong>
              <small>{board.junctionName}</small>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
