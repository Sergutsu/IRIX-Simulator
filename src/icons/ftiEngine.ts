// SGI IRIX IconSmith (.fti) Vector Engine
// Parses, renders, and serializes authentic SGI .fti (File Type Icon) IRIS GL vector scripts.

export type IconVisualState = 'normal' | 'selected' | 'opened' | 'located' | 'disabled';

export interface FtiVertex {
  x: number; // 0..100 (left to right)
  y: number; // 0..100 (bottom to top in IRIS GL coordinates!)
}

export type FtiColorRef = number | 'iconcolor' | 'outlinecolor' | 'shadowcolor';

export type FtiPrimitiveType =
  | 'polygon'
  | 'outlinepolygon'
  | 'line'
  | 'closedline'
  | 'point';

export interface FtiPath {
  id: string;
  type: FtiPrimitiveType;
  fillColor: FtiColorRef;
  strokeColor?: FtiColorRef;
  vertices: FtiVertex[];
}

// Authentic SGI IconSmith 256-color table (0..15 base + -16..-255 extended interpolated colors)
export const SGI_FTI_COLOR_MAP: Record<string, [number, number, number]> = {
  "0": [0, 0, 0],
  "1": [255, 0, 0],
  "2": [0, 255, 0],
  "3": [255, 255, 0],
  "4": [0, 0, 255],
  "5": [255, 0, 255],
  "6": [0, 255, 255],
  "7": [255, 255, 255],
  "8": [85, 85, 85],
  "9": [198, 113, 113],
  "10": [113, 198, 113],
  "11": [142, 142, 56],
  "12": [113, 113, 198],
  "13": [142, 56, 142],
  "14": [56, 142, 142],
  "15": [170, 170, 170],
  "-16": [127, 0, 0],
  "-17": [255, 0, 0],
  "-32": [0, 127, 0],
  "-33": [127, 127, 0],
  "-34": [0, 255, 0],
  "-48": [127, 127, 0],
  "-49": [255, 127, 0],
  "-50": [127, 255, 0],
  "-51": [255, 255, 0],
  "-64": [0, 0, 127],
  "-65": [127, 0, 127],
  "-66": [0, 127, 127],
  "-67": [127, 127, 127],
  "-68": [0, 0, 255],
  "-80": [127, 0, 127],
  "-81": [255, 0, 127],
  "-82": [127, 127, 127],
  "-83": [255, 127, 127],
  "-84": [127, 0, 255],
  "-85": [255, 0, 255],
  "-96": [0, 127, 127],
  "-97": [127, 127, 127],
  "-98": [0, 255, 127],
  "-99": [127, 255, 127],
  "-100": [0, 127, 255],
  "-101": [127, 127, 255],
  "-102": [0, 255, 255],
  "-112": [127, 127, 127],
  "-113": [255, 127, 127],
  "-114": [127, 255, 127],
  "-115": [255, 255, 127],
  "-116": [127, 127, 255],
  "-117": [255, 127, 255],
  "-118": [127, 255, 255],
  "-119": [255, 255, 255],
  "-128": [42, 42, 42],
  "-129": [170, 42, 42],
  "-130": [42, 170, 42],
  "-131": [170, 170, 42],
  "-132": [42, 42, 170],
  "-133": [170, 42, 170],
  "-134": [42, 170, 170],
  "-135": [170, 170, 170],
  "-136": [85, 85, 85],
  "-144": [99, 56, 56],
  "-145": [226, 56, 56],
  "-146": [99, 184, 56],
  "-147": [226, 184, 56],
  "-148": [99, 56, 184],
  "-149": [226, 56, 184],
  "-150": [99, 184, 184],
  "-151": [226, 184, 184],
  "-152": [141, 99, 99],
  "-153": [198, 113, 113],
  "-160": [56, 99, 56],
  "-161": [184, 99, 56],
  "-162": [56, 226, 56],
  "-163": [184, 226, 56],
  "-164": [56, 99, 184],
  "-165": [184, 99, 184],
  "-166": [56, 226, 184],
  "-167": [184, 226, 184],
  "-168": [99, 141, 99],
  "-169": [155, 155, 113],
  "-170": [113, 198, 113],
  "-176": [71, 71, 28],
  "-177": [198, 71, 28],
  "-178": [71, 198, 28],
  "-179": [198, 198, 28],
  "-180": [71, 71, 155],
  "-181": [198, 71, 155],
  "-182": [71, 198, 155],
  "-183": [198, 198, 155],
  "-184": [113, 113, 70],
  "-185": [170, 127, 84],
  "-186": [127, 170, 84],
  "-187": [142, 142, 56],
  "-192": [56, 56, 99],
  "-193": [184, 56, 99],
  "-194": [56, 184, 99],
  "-195": [184, 184, 99],
  "-196": [56, 56, 226],
  "-197": [184, 56, 226],
  "-198": [56, 184, 226],
  "-199": [184, 184, 226],
  "-200": [99, 99, 141],
  "-201": [155, 113, 155],
  "-202": [113, 155, 155],
  "-203": [127, 127, 127],
  "-204": [113, 113, 198],
  "-208": [71, 28, 71],
  "-209": [198, 28, 71],
  "-210": [71, 155, 71],
  "-211": [198, 155, 71],
  "-212": [71, 28, 198],
  "-213": [198, 28, 198],
  "-214": [71, 155, 198],
  "-215": [198, 155, 198],
  "-216": [113, 70, 113],
  "-217": [170, 84, 127],
  "-218": [127, 127, 127],
  "-219": [142, 99, 99],
  "-220": [127, 84, 170],
  "-221": [142, 56, 142],
  "-224": [28, 71, 71],
  "-225": [155, 71, 71],
  "-226": [28, 198, 71],
  "-227": [155, 198, 71],
  "-228": [28, 71, 198],
  "-229": [155, 71, 198],
  "-230": [28, 198, 198],
  "-231": [155, 198, 198],
  "-232": [70, 113, 113],
  "-233": [127, 127, 127],
  "-234": [84, 170, 127],
  "-235": [99, 142, 99],
  "-236": [84, 127, 170],
  "-237": [99, 99, 142],
  "-238": [56, 142, 142],
  "-240": [85, 85, 85],
  "-241": [212, 85, 85],
  "-242": [85, 212, 85],
  "-243": [212, 212, 85],
  "-244": [85, 85, 212],
  "-245": [212, 85, 212],
  "-246": [85, 212, 212],
  "-247": [212, 212, 212],
  "-248": [127, 127, 127],
  "-249": [184, 141, 141],
  "-250": [141, 184, 141],
  "-251": [156, 156, 113],
  "-252": [141, 141, 184],
  "-253": [156, 113, 156],
  "-254": [113, 156, 156],
  "-255": [170, 170, 170],
};

export function resolveFtiColor(
  color: FtiColorRef | undefined,
  state: IconVisualState = 'normal'
): string {
  if (color === undefined) return '#000000';
  if (color === 'iconcolor') {
    switch (state) {
      case 'selected':
        return '#ffe84a'; // SGI Iconic Yellow selection state
      case 'opened':
        return '#94d2ff'; // SGI Active / Opened electric blue-white
      case 'located':
        return '#ffd060'; // Drop target / located highlight
      case 'disabled':
        return '#999999';
      case 'normal':
      default:
        return '#e2e2e6'; // SGI default neutral light silver
    }
  }
  if (color === 'outlinecolor') {
    return state === 'disabled' ? '#555555' : '#111116';
  }
  if (color === 'shadowcolor') {
    return 'rgba(20, 30, 44, 0.58)';
  }

  const key = String(color);
  const rgb = SGI_FTI_COLOR_MAP[key];
  if (rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }
  return '#cccccc';
}

function parseColorToken(token: string): FtiColorRef {
  const clean = token.trim();
  if (clean === 'iconcolor' || clean === 'outlinecolor' || clean === 'shadowcolor') {
    return clean;
  }
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Parses an authentic SGI .fti script into FtiPath[] primitives
 */
export function parseFtiScript(script: string): FtiPath[] {
  const paths: FtiPath[] = [];
  let currentColor: FtiColorRef = 'iconcolor';
  let activeType: FtiPrimitiveType | null = null;
  let activeVertices: FtiVertex[] = [];
  let pathCounter = 0;

  // Strip comments (# ...)
  const cleanedLines = script
    .split('\n')
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter(Boolean)
    .join(' ');

  // Match function calls like cmd(args);
  const statementRegex = /([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*;/g;
  let match: RegExpExecArray | null;

  while ((match = statementRegex.exec(cleanedLines)) !== null) {
    const fn = match[1].toLowerCase();
    const argsRaw = match[2].trim();

    switch (fn) {
      case 'color': {
        currentColor = parseColorToken(argsRaw);
        break;
      }
      case 'bgnpolygon': {
        activeType = 'polygon';
        activeVertices = [];
        break;
      }
      case 'bgnoutlinepolygon': {
        activeType = 'outlinepolygon';
        activeVertices = [];
        break;
      }
      case 'bgnline': {
        activeType = 'line';
        activeVertices = [];
        break;
      }
      case 'bgnclosedline': {
        activeType = 'closedline';
        activeVertices = [];
        break;
      }
      case 'bgnpoint': {
        activeType = 'point';
        activeVertices = [];
        break;
      }
      case 'pmv': {
        activeType = 'polygon';
        activeVertices = [];
        const parts = argsRaw.split(',').map((s) => parseFloat(s.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          activeVertices.push({ x: parts[0], y: parts[1] });
        }
        break;
      }
      case 'pdr':
      case 'draw':
      case 'vertex': {
        const parts = argsRaw.split(',').map((s) => parseFloat(s.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          activeVertices.push({ x: parts[0], y: parts[1] });
        }
        break;
      }
      case 'endpolygon':
      case 'pclos': {
        if (activeVertices.length > 0) {
          paths.push({
            id: `path_${pathCounter++}`,
            type: 'polygon',
            fillColor: currentColor,
            vertices: [...activeVertices],
          });
        }
        activeType = null;
        activeVertices = [];
        break;
      }
      case 'endoutlinepolygon': {
        const strokeColor = argsRaw ? parseColorToken(argsRaw) : 'outlinecolor';
        if (activeVertices.length > 0) {
          paths.push({
            id: `path_${pathCounter++}`,
            type: 'outlinepolygon',
            fillColor: currentColor,
            strokeColor,
            vertices: [...activeVertices],
          });
        }
        activeType = null;
        activeVertices = [];
        break;
      }
      case 'endline': {
        if (activeVertices.length > 0) {
          paths.push({
            id: `path_${pathCounter++}`,
            type: 'line',
            fillColor: currentColor,
            strokeColor: currentColor,
            vertices: [...activeVertices],
          });
        }
        activeType = null;
        activeVertices = [];
        break;
      }
      case 'endclosedline': {
        if (activeVertices.length > 0) {
          paths.push({
            id: `path_${pathCounter++}`,
            type: 'closedline',
            fillColor: currentColor,
            strokeColor: currentColor,
            vertices: [...activeVertices],
          });
        }
        activeType = null;
        activeVertices = [];
        break;
      }
      case 'endpoint': {
        if (activeVertices.length > 0) {
          paths.push({
            id: `path_${pathCounter++}`,
            type: 'point',
            fillColor: currentColor,
            strokeColor: currentColor,
            vertices: [...activeVertices],
          });
        }
        activeType = null;
        activeVertices = [];
        break;
      }
    }
  }

  return paths;
}

/**
 * Serializes FtiPath[] back into authentic SGI IconSmith .fti format
 */
export function serializeFtiPaths(paths: FtiPath[], title = 'IconSmith FTI'): string {
  const lines: string[] = [`# SGI IRIX IconSmith Vector File (.fti) — ${title}`];
  paths.forEach((p, idx) => {
    lines.push(`\n#\tPath_${idx}`);
    lines.push(`\t\tcolor(${p.fillColor});`);
    if (p.type === 'polygon') {
      lines.push(`\t\tbgnpolygon();`);
      p.vertices.forEach((v) =>
        lines.push(`\t\t\tvertex(${v.x.toFixed(2)}, ${v.y.toFixed(2)});`)
      );
      lines.push(`\t\tendpolygon();`);
    } else if (p.type === 'outlinepolygon') {
      lines.push(`\t\tbgnoutlinepolygon();`);
      p.vertices.forEach((v) =>
        lines.push(`\t\t\tvertex(${v.x.toFixed(2)}, ${v.y.toFixed(2)});`)
      );
      lines.push(`\t\tendoutlinepolygon(${p.strokeColor ?? 'outlinecolor'});`);
    } else if (p.type === 'line') {
      lines.push(`\t\tbgnline();`);
      p.vertices.forEach((v) =>
        lines.push(`\t\t\tvertex(${v.x.toFixed(2)}, ${v.y.toFixed(2)});`)
      );
      lines.push(`\t\tendline();`);
    } else if (p.type === 'closedline') {
      lines.push(`\t\tbgnclosedline();`);
      p.vertices.forEach((v) =>
        lines.push(`\t\t\tvertex(${v.x.toFixed(2)}, ${v.y.toFixed(2)});`)
      );
      lines.push(`\t\tendclosedline();`);
    }
  });
  return lines.join('\n') + '\n';
}

/**
 * Exports FtiPath[] to standalone SVG markup
 */
export function exportFtiToSvg(
  paths: FtiPath[],
  state: IconVisualState = 'normal'
): string {
  const elements = paths.map((p) => {
    const pts = p.vertices
      .map((v) => `${v.x.toFixed(2)},${(100 - v.y).toFixed(2)}`)
      .join(' ');
    const fill = resolveFtiColor(p.fillColor, state);
    const stroke = resolveFtiColor(p.strokeColor ?? 'outlinecolor', state);

    if (p.type === 'polygon') {
      return `  <polygon points="${pts}" fill="${fill}" stroke="none" />`;
    }
    if (p.type === 'outlinepolygon') {
      return `  <polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="1.35" stroke-linejoin="round" />`;
    }
    if (p.type === 'closedline') {
      return `  <polygon points="${pts}" fill="none" stroke="${fill}" stroke-width="1.5" stroke-linejoin="round" />`;
    }
    return `  <polyline points="${pts}" fill="none" stroke="${fill}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="128" height="128">\n${elements.join('\n')}\n</svg>`;
}

/**
 * SGI Generic Executable Base Plate: generic.exec.closed.fti ("The Magic Carpet")
 * Isometric diamond sheet of paper with curled front-left corner & drop shadow.
 * Painted with `iconcolor` so it turns SGI Yellow when selected!
 */
export const GENERIC_EXEC_CLOSED_FTI = `
# SGI /usr/lib/filetype/iconlib/generic.exec.closed.fti (Magic Carpet Base)
# Drop shadow on desktop
color(shadowcolor);
bgnpolygon();
  vertex(10.00, 22.00);
  vertex(49.00, 4.00);
  vertex(88.00, 22.00);
  vertex(49.00, 40.00);
endpolygon();

# Main isometric diamond carpet sheet (uses iconcolor -> turns yellow on select!)
color(iconcolor);
bgnoutlinepolygon();
  vertex(8.00, 25.00);
  vertex(20.00, 22.00);
  vertex(48.00, 7.00);
  vertex(86.00, 25.00);
  vertex(48.00, 43.00);
endoutlinepolygon(outlinecolor);

# Curled up front-left corner of the Magic Carpet
color(7);
bgnoutlinepolygon();
  vertex(8.00, 25.00);
  vertex(18.00, 31.00);
  vertex(26.00, 25.00);
  vertex(20.00, 22.00);
endoutlinepolygon(outlinecolor);
`;

/**
 * SGI Generic Executable Opened Base Plate: generic.exec.open.fti
 * When an executable is launched/opened, the magic carpet curls up at the back with energy lines.
 */
export const GENERIC_EXEC_OPEN_FTI = `
# SGI /usr/lib/filetype/iconlib/generic.exec.open.fti (Active/Opened Magic Carpet)
color(shadowcolor);
bgnpolygon();
  vertex(10.00, 20.00);
  vertex(50.00, 3.00);
  vertex(90.00, 20.00);
  vertex(50.00, 38.00);
endpolygon();

color(iconcolor);
bgnoutlinepolygon();
  vertex(8.00, 26.00);
  vertex(48.00, 7.00);
  vertex(88.00, 26.00);
  vertex(52.00, 46.00);
endoutlinepolygon(outlinecolor);

# Raised back flap
color(-118);
bgnoutlinepolygon();
  vertex(14.00, 30.00);
  vertex(48.00, 14.00);
  vertex(82.00, 30.00);
  vertex(48.00, 44.00);
endoutlinepolygon(outlinecolor);
`;
