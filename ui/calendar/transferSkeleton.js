import { createSkeletonRegion, createSkeletonTable } from "../workflow/skeleton.js";

export function createCalendarTransferSkeletonController(
  statusElement,
  { isLoaded = () => false } = {},
) {
  let skeleton = null;
  return {
    show(label = "Loading calendar output tools") {
      if (isLoaded() || !statusElement?.parentElement) return;
      this.clear();
      skeleton = createSkeletonRegion({
        label,
        className: "calendar-transfer-skeleton",
        children: [createSkeletonTable({ columns: 3, rows: 2 })],
      });
      statusElement.parentElement.insertBefore(skeleton, statusElement);
    },
    clear() {
      skeleton?.remove?.();
      skeleton = null;
    },
  };
}
