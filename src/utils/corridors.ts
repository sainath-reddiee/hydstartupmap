import corridorsData from "@/data/corridors.json";
import type { AreaName, CorridorPulse, RoadBillboard } from "@/types";
import { AREA_CENTERS } from "@/utils/distance";

const catalog = corridorsData.corridors as Array<{
  id: string;
  name: AreaName;
  area: AreaName;
  label: string;
  tagline: string;
  weeklyPrice: string;
}>;

export function listCorridors(): CorridorPulse[] {
  return catalog.map((item) => ({
    ...item,
    coordinates: AREA_CENTERS[item.area] ?? AREA_CENTERS["HITEC City"],
  }));
}

export function resolveCorridorSlots(billboards: RoadBillboard[]): CorridorPulse[] {
  return listCorridors().map((corridor) => {
    const campaign = billboards.find((board) => (
      board.isLive
      && (
        board.corridorId === corridor.id
        || board.junctionName.toLowerCase().includes(corridor.name.toLowerCase())
        || board.junctionName.toLowerCase().includes(corridor.label.toLowerCase())
      )
    ));
    return { ...corridor, campaign };
  });
}
