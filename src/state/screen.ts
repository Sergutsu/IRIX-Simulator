/**
 * Display scaling for the 4Dwm desktop.
 *
 * The desktop is laid out in the workstation's own pixels ("virtual pixels",
 * the framebuffer it would drive) and the whole thing is then scaled to the
 * browser window, the way a real SGI box is displayed on whatever monitor is
 * plugged into it.  That keeps every element in proportion — windows, fonts,
 * the Toolchest, the desktop icons — instead of clipping them off the edge of
 * a small display.
 *
 * Above MIN_SCREEN_W x MIN_SCREEN_H the desktop runs at 1:1 and simply gets
 * more room; below it, everything shrinks together.  The virtual screen is
 * never smaller than MIN_SCREEN_W x MIN_SCREEN_H, so window positions stay
 * valid when the browser is resized.
 */
export const MIN_SCREEN_W = 1024;
export const MIN_SCREEN_H = 700;

export interface ScreenMetrics {
  /** virtual pixels -> CSS pixels */
  scale: number;
  /** framebuffer size the desktop is laid out in */
  width: number;
  height: number;
}

/** Work out the framebuffer size and scale factor for a viewport. */
export function fitScreen(viewportW: number, viewportH: number): ScreenMetrics {
  const w = Math.max(320, viewportW);
  const h = Math.max(240, viewportH);
  const scale = Math.min(1, w / MIN_SCREEN_W, h / MIN_SCREEN_H);
  return { scale, width: Math.round(w / scale), height: Math.round(h / scale) };
}

let metrics: ScreenMetrics = fitScreen(1280, 1024);

/** Current framebuffer metrics (updated by the desktop shell on resize). */
export const screenMetrics = (): ScreenMetrics => metrics;

export function setScreenMetrics(next: ScreenMetrics) {
  metrics = next;
}

/** virtual pixels -> CSS pixels for the current window size. */
export const screenScale = (): number => metrics.scale;

/**
 * Keep a window frame inside the framebuffer, so nothing is ever dragged off
 * the edge of the display.  A window larger than the screen is pinned to the
 * top-left corner instead of being pushed out of reach.
 */
export function clampWindow(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  const m = screenMetrics();
  const maxX = Math.max(0, m.width - Math.min(width, m.width) - 8);
  const maxY = Math.max(0, m.height - Math.min(height, m.height) - 40);
  return {
    x: Math.max(0, Math.min(maxX, x)),
    y: Math.max(0, Math.min(maxY, Math.max(0, y))),
  };
}

/** Default placement for a new window, cascaded like 4Dwm. */
export function placeWindow(width: number, height: number, offset: number): { x: number; y: number } {
  const m = screenMetrics();
  return clampWindow(155 + offset, 28 + offset, width, height);
}
