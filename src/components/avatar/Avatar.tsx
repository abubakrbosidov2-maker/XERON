"use client";
import { useId } from "react";
import { BODY_GEOM, shade, type AppearanceData, type EquippedVisual, type Geom } from "@/lib/avatar-config";

type V = EquippedVisual | undefined;

const SLEEVE_LEN: Record<string, number> = { tee: 40, hoodie: 82, jacket: 84, cloak: 86, armor: 46, aegis: 52 };
const BASE_GLOW: Record<string, string> = { volt: "#2f8cff", arcane: "#8b5cf6", ember: "#f97316" };
const SPARKS: [number, number][] = [[34, 70], [166, 90], [26, 160], [174, 176], [50, 240], [152, 252], [100, 14], [18, 236], [184, 44]];

const torsoD = (g: Geom, hem = 190) =>
  `M${100 - g.s} 106 Q100 97 ${100 + g.s} 106 L${100 + g.w} 160 L${100 + g.h} ${hem} L${100 - g.h} ${hem} L${100 - g.w} 160 Z`;

function pickSleeve(top: V, jacket: V) {
  const cands = [top, jacket].filter((v): v is EquippedVisual => !!v && !!SLEEVE_LEN[v.visualKey]);
  if (cands.length === 0) return null;
  const best = cands.reduce((a, b) => (SLEEVE_LEN[b.visualKey] > SLEEVE_LEN[a.visualKey] ? b : a));
  return { len: SLEEVE_LEN[best.visualKey], c1: best.c1, c2: best.c2 };
}

function Aura({ fx, uid }: { fx: EquippedVisual; uid: string }) {
  const k = fx.visualKey;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-fx`} cx="50%" cy="55%" r="50%">
          <stop offset="0" stopColor={fx.c1} stopOpacity="0" />
          <stop offset="0.7" stopColor={fx.c1} stopOpacity="0.18" />
          <stop offset="1" stopColor={fx.c2} stopOpacity="0.45" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="170" rx="96" ry="152" fill={`url(#${uid}-fx)`} />
      {SPARKS.map(([x, y], i) => {
        const d = { animationDelay: `${(i * 0.27).toFixed(2)}s` };
        if (k === "aura_snow") return <circle key={i} className="xeron-twinkle" style={d} cx={x} cy={y} r={2.5 + (i % 3)} fill="#ffffff" />;
        if (k === "aura_ember") return <circle key={i} className="xeron-twinkle" style={d} cx={x} cy={y + 20} r={2 + (i % 3)} fill={i % 2 ? fx.c1 : fx.c2} />;
        return <rect key={i} className="xeron-twinkle" style={d} x={x - 3} y={y - 3} width="6" height="6" transform={`rotate(45 ${x} ${y})`} fill={i % 2 ? fx.c1 : fx.c2} />;
      })}
      {(k === "aura_volt" || k === "aura_mythic") && (
        <g fill="none" stroke={fx.c2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
          <polyline points="28,80 42,108 33,112 48,148" />
          <polyline points="172,90 158,118 167,122 152,158" />
        </g>
      )}
    </g>
  );
}

function BackItem({ item, g, uid }: { item: EquippedVisual; g: Geom; uid: string }) {
  const { visualKey: k, c1, c2 } = item;
  if (k === "wings") {
    const wing = "M72 112 C 40 62, 8 70, 2 28 C 4 84, 14 132, 60 172 C 44 142, 58 130, 72 152 Z";
    return (
      <g>
        <defs>
          <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c1} />
            <stop offset="1" stopColor={c2} />
          </linearGradient>
        </defs>
        <path d={wing} fill={`url(#${uid}-wing)`} opacity="0.92" />
        <g transform="translate(200 0) scale(-1 1)"><path d={wing} fill={`url(#${uid}-wing)`} opacity="0.92" /></g>
      </g>
    );
  }
  if (k === "cape") {
    return (
      <g>
        <path d={`M${100 - g.s} 104 L${100 + g.s} 104 L${100 + g.s + 24} 252 Q100 266 ${100 - g.s - 24} 252 Z`} fill={c1} />
        <path d={`M${100 - g.s + 8} 110 L${100 + g.s - 8} 110 L${100 + g.s + 6} 250 Q100 258 ${100 - g.s - 6} 250 Z`} fill={c2} opacity="0.7" />
      </g>
    );
  }
  if (k === "backpack") {
    return (
      <g>
        <rect x={100 - g.s - 9} y={108} width={2 * g.s + 18} height={72} rx={14} fill={c1} />
        <rect x={100 - g.s - 3} y={150} width={2 * g.s + 6} height={22} rx={8} fill={c2} />
      </g>
    );
  }
  return null;
}

function HairBack({ style, color }: { style: string; color: string }) {
  if (style === "long") return <path d="M70 52 Q64 112 78 138 L122 138 Q136 112 130 52 Z" fill={shade(color, -0.1)} />;
  return null;
}

function HairFront({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "short":
      return <path d="M72 58 Q70 30 100 30 Q130 30 128 58 Q122 44 100 43 Q78 44 72 58 Z" fill={color} />;
    case "long":
      return <path d="M72 64 Q66 28 100 28 Q134 28 128 64 Q124 44 108 40 Q90 46 78 52 Q74 56 72 64 Z" fill={color} />;
    case "spiky":
      return <path d="M72 58 L68 30 L84 42 L90 20 L100 40 L110 20 L116 42 L132 30 L128 58 Q118 46 100 46 Q82 46 72 58 Z" fill={color} />;
    case "bun":
      return (
        <g>
          <circle cx="100" cy="22" r="11" fill={color} />
          <path d="M72 58 Q70 30 100 30 Q130 30 128 58 Q122 44 100 43 Q78 44 72 58 Z" fill={color} />
        </g>
      );
    case "mohawk":
      return (
        <g>
          <path d="M74 56 Q78 44 90 44 L90 50 Q80 50 74 60 Z" fill={color} opacity="0.35" />
          <path d="M126 56 Q122 44 110 44 L110 50 Q120 50 126 60 Z" fill={color} opacity="0.35" />
          <path d="M90 46 L94 10 L106 10 L110 46 Z" fill={color} />
        </g>
      );
    default:
      return null;
  }
}

function Face({ face, eye }: { face: string; eye: string }) {
  const brow = "#1f1720";
  const eyes = [89, 111].map((x) => (
    <g key={x}>
      <ellipse cx={x} cy="62" rx="6" ry="5.2" fill="#ffffff" />
      <circle cx={x} cy="62.4" r="3.7" fill={eye} />
      <circle cx={x} cy="62.4" r="1.7" fill="#0b0b14" />
      <circle cx={x + 1.2} cy="61" r="0.9" fill="#ffffff" />
    </g>
  ));
  let brows: React.ReactNode;
  let mouth: React.ReactNode;
  switch (face) {
    case "happy":
      brows = <g stroke={brow} strokeWidth="2.2" fill="none" strokeLinecap="round"><path d="M82 52 Q89 48 96 52" /><path d="M104 52 Q111 48 118 52" /></g>;
      mouth = <g><path d="M92 74 Q100 84 108 74 Z" fill="#7f1d1d" /><circle cx="80" cy="70" r="4" fill="#f87171" opacity="0.3" /><circle cx="120" cy="70" r="4" fill="#f87171" opacity="0.3" /></g>;
      break;
    case "fierce":
      brows = <g stroke={brow} strokeWidth="2.8" fill="none" strokeLinecap="round"><path d="M81 51 L96 57" /><path d="M119 51 L104 57" /></g>;
      mouth = <path d="M93 78 L107 78" stroke="#4a1d1d" strokeWidth="2.4" strokeLinecap="round" />;
      break;
    case "cool":
      brows = <g stroke={brow} strokeWidth="2.4" fill="none" strokeLinecap="round"><path d="M82 54 L96 54" /><path d="M104 50 Q112 47 118 52" /></g>;
      mouth = <path d="M94 77 Q102 79 109 73" stroke="#4a1d1d" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
      break;
    default:
      brows = <g stroke={brow} strokeWidth="2.2" fill="none" strokeLinecap="round"><path d="M82 53 L96 53" /><path d="M104 53 L118 53" /></g>;
      mouth = <path d="M94 76 Q100 79 106 76" stroke="#4a1d1d" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
  }
  return (
    <g>
      {eyes}
      {brows}
      <path d="M100 66 Q97 71 100 72" stroke="rgba(0,0,0,.25)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {mouth}
    </g>
  );
}

function TopItem({ item, g, uid }: { item: EquippedVisual; g: Geom; uid: string }) {
  const { visualKey: k, c1, c2 } = item;
  const clip = `url(#${uid}-t)`;
  switch (k) {
    case "hoodie":
      return (
        <g>
          <path d={torsoD(g)} fill={c1} />
          <g clipPath={clip}><rect x="60" y="160" width="80" height="22" rx="6" fill={shade(c1, -0.12)} /></g>
          <path d="M84 104 Q100 126 116 104 Q112 95 100 95 Q88 95 84 104 Z" fill={c2} />
          <path d="M96 112 V130 M104 112 V130" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    case "vest":
      return (
        <g>
          <path d={torsoD(g)} fill={c1} />
          <path d="M91 104 L100 152 L109 104 Z" fill={c2} opacity="0.9" />
          {[124, 140, 156].map((y) => <circle key={y} cx="100" cy={y} r="2.2" fill="#fff" opacity="0.8" />)}
        </g>
      );
    case "dress":
      return (
        <g>
          <path d={`M${100 - g.w - 1} 150 L${100 - g.h - 20} 258 Q100 272 ${100 + g.h + 20} 258 L${100 + g.w + 1} 150 Z`} fill={c1} />
          <path d={`M${100 - g.h - 20} 258 Q100 272 ${100 + g.h + 20} 258 L${100 + g.h + 18} 250 Q100 264 ${100 - g.h - 18} 250 Z`} fill={c2} opacity="0.8" />
          <path d={torsoD(g, 160)} fill={c1} />
          <rect x={100 - g.w - 1} y="146" width={2 * g.w + 2} height="7" fill={c2} />
        </g>
      );
    default:
      return (
        <g>
          <path d={torsoD(g)} fill={c1} />
          <g clipPath={clip}><rect x="60" y="150" width="80" height="6" fill={c2} opacity="0.7" /></g>
          <path d="M90 104 Q100 116 110 104 Z" fill={c2} opacity="0.5" />
        </g>
      );
  }
}

function JacketItem({ item, g, uid }: { item: EquippedVisual; g: Geom; uid: string }) {
  const { visualKey: k, c1, c2 } = item;
  const clip = `url(#${uid}-t)`;
  if (k === "cloak") {
    return (
      <g>
        <path d={`M${100 - g.s - 4} 106 Q100 96 ${100 + g.s + 4} 106 L${100 + g.h + 20} 242 Q100 254 ${100 - g.h - 20} 242 Z`} fill={c1} />
        <path d="M100 112 V246" stroke={c2} strokeWidth="3" />
        <path d="M84 104 Q100 128 116 104 Q110 94 100 94 Q90 94 84 104 Z" fill={c2} opacity="0.9" />
      </g>
    );
  }
  if (k === "armor" || k === "aegis") {
    return (
      <g>
        <path d={torsoD(g)} fill={shade(c1, -0.08)} />
        <path d={`M${100 - g.s + 6} 112 Q100 104 ${100 + g.s - 6} 112 L${100 + g.w - 4} 160 Q100 174 ${100 - g.w + 4} 160 Z`} fill={shade(c1, 0.1)} stroke={c2} strokeWidth="2" />
        <rect x={100 - g.h} y="172" width={2 * g.h} height="10" rx="3" fill={c2} />
        <circle cx={100 - g.s} cy="108" r="13" fill={c1} stroke={c2} strokeWidth="2" />
        <circle cx={100 + g.s} cy="108" r="13" fill={c1} stroke={c2} strokeWidth="2" />
        {k === "aegis" && <circle cx="100" cy="136" r="8" fill={c2} className="xeron-twinkle" />}
      </g>
    );
  }
  return (
    <g>
      <path d={torsoD(g)} fill={c1} />
      <g clipPath={clip}><path d="M100 106 V192" stroke={c2} strokeWidth="2.5" /><rect x="60" y="176" width="80" height="6" fill={c2} opacity="0.7" /></g>
      <path d="M86 104 L100 118 L114 104 L118 97 L100 107 L82 97 Z" fill={c2} />
    </g>
  );
}

interface AvatarProps {
  appearance: AppearanceData;
  equipped: EquippedVisual[];
  size?: number;
  pose?: AppearanceData["pose"];
  flip?: boolean;
  animated?: boolean;
  className?: string;
}

export function Avatar({ appearance: a, equipped, size = 240, pose, flip = false, animated = false, className = "" }: AvatarProps) {
  const uid = useId().replace(/:/g, "");
  const g = BODY_GEOM[a.body] ?? BODY_GEOM.neutral;
  const at = (slot: string): V => equipped.find((e) => e.slot === slot);
  const P = pose ?? a.pose;

  const skinItem = at("SKIN");
  const skin = skinItem ? skinItem.c1 : a.skinTone;
  const skinDark = shade(skin, -0.14);
  const eyeCol = skinItem ? skinItem.c2 : a.eyeColor;

  const top = at("TOP"), jacket = at("JACKET"), bottom = at("BOTTOM"), shoes = at("SHOES");
  const gloves = at("GLOVES"), mask = at("MASK"), glasses = at("GLASSES"), head = at("HEAD"), back = at("BACK"), fx = at("EFFECT");
  const sleeve = pickSleeve(top, jacket);

  const armAngle = (side: "L" | "R") => (P === "hero" ? (side === "L" ? 24 : -24) : side === "L" ? 4 : -4);

  const arm = (side: "L" | "R") => {
    const ax = side === "L" ? 100 - g.s - 3 : 100 + g.s + 3;
    const inner = (
      <>
        <rect x={ax - 7} y={104} width={14} height={78} rx={7} fill={skin} />
        <circle cx={ax} cy={182} r={8} fill={skin} />
        {sleeve && (
          <>
            <rect x={ax - 8} y={103} width={16} height={sleeve.len} rx={7} fill={sleeve.c1} />
            <rect x={ax - 8} y={103 + sleeve.len - 5} width={16} height={5} rx={2} fill={sleeve.c2} />
          </>
        )}
        {gloves && (
          <>
            <rect x={ax - 8.5} y={154} width={17} height={36} rx={8} fill={gloves.c1} />
            <rect x={ax - 8.5} y={157} width={17} height={4} fill={gloves.c2} />
            {gloves.visualKey === "gauntlets" && <circle cx={ax} cy={184} r={4} fill={gloves.c2} className="xeron-twinkle" />}
          </>
        )}
      </>
    );
    if (P === "wave" && side === "R") {
      return <g key={side} className="xeron-wave" style={{ transformOrigin: `${ax}px 108px` }}>{inner}</g>;
    }
    return <g key={side} transform={`rotate(${armAngle(side)} ${ax} 108)`}>{inner}</g>;
  };

  const shoeEl = (x: number) => {
    const k = shoes?.visualKey;
    if (!shoes) return <rect key={x} x={x} y={282} width={g.h} height={16} rx={8} fill={skin} />;
    const tall = k === "boots";
    const low = k === "hover";
    return (
      <g key={x}>
        <rect x={x} y={tall ? 262 : low ? 284 : 279} width={g.h} height={tall ? 37 : low ? 13 : 20} rx={9} fill={shoes.c1} />
        <rect x={x} y={low ? 291 : 292} width={g.h} height={low ? 6 : 7} rx={3} fill={shoes.c2} />
      </g>
    );
  };

  const glow = a.aura !== "none" ? BASE_GLOW[a.aura] : null;

  const inner = (
    <>
      {fx && <Aura fx={fx} uid={uid} />}
      <ellipse cx="100" cy="302" rx="62" ry="8" fill="#000" opacity="0.35" />
      {glow && <ellipse cx="100" cy="302" rx="74" ry="10" fill="none" stroke={glow} strokeWidth="3" opacity="0.9" style={{ filter: `drop-shadow(0 0 8px ${glow})` }} />}

      {back && <BackItem item={back} g={g} uid={uid} />}

      <rect x={100 - g.h + 1} y={186} width={g.h - 3} height={100} rx={10} fill={skin} />
      <rect x={102} y={186} width={g.h - 3} height={100} rx={10} fill={skin} />
      {shoeEl(100 - g.h - 1)}
      {shoeEl(101)}
      {shoes?.visualKey === "hover" && <ellipse cx="100" cy="300" rx="52" ry="5" fill={shoes.c2} opacity="0.6" />}

      {bottom && (bottom.visualKey === "skirt" ? (
        <g>
          <path d={`M${100 - g.w - 1} 168 L${100 - g.h - 16} 236 Q100 248 ${100 + g.h + 16} 236 L${100 + g.w + 1} 168 Z`} fill={bottom.c1} />
          <path d={`M${100 - g.h - 16} 236 Q100 248 ${100 + g.h + 16} 236 L${100 + g.h + 15} 230 Q100 242 ${100 - g.h - 15} 230 Z`} fill={bottom.c2} />
        </g>
      ) : (
        <g>
          <rect x={100 - g.h} y={184} width={g.h - 1} height={100} rx={10} fill={bottom.c1} />
          <rect x={101} y={184} width={g.h - 1} height={100} rx={10} fill={bottom.c1} />
          <rect x={100 - g.h} y={182} width={2 * g.h} height={14} rx={4} fill={bottom.c2} />
          {bottom.visualKey === "cargo" && (
            <>
              <rect x={100 - g.h + 3} y={222} width={g.h - 8} height={16} rx={3} fill={bottom.c2} opacity="0.8" />
              <rect x={106} y={222} width={g.h - 8} height={16} rx={3} fill={bottom.c2} opacity="0.8" />
            </>
          )}
        </g>
      ))}

      <path d={torsoD(g)} fill={skin} />
      {skinItem && <path d="M100 108 V190 M72 150 H128" stroke={skinItem.c2} strokeWidth="1.5" opacity="0.7" fill="none" />}
      {top && <TopItem item={top} g={g} uid={uid} />}
      {jacket && <JacketItem item={jacket} g={g} uid={uid} />}

      {arm("L")}
      {arm("R")}

      <rect x="91" y="86" width="18" height="20" rx="6" fill={skinDark} />
      {head?.visualKey === "scarf" && (
        <g>
          <path d="M80 94 Q100 108 120 94 L122 106 Q100 120 78 106 Z" fill={head.c1} />
          <path d="M108 104 L120 146 L106 144 Z" fill={head.c2} />
        </g>
      )}

      <HairBack style={a.hairStyle} color={a.hairColor} />
      <circle cx="73" cy="64" r="5.5" fill={skin} />
      <circle cx="127" cy="64" r="5.5" fill={skin} />
      <ellipse cx="100" cy="62" rx="27" ry="29" fill={skin} />
      <Face face={a.face} eye={eyeCol} />
      <HairFront style={a.hairStyle} color={a.hairColor} />

      {mask && (
        <g>
          <path d="M74 64 Q100 60 126 64 L124 82 Q100 98 76 82 Z" fill={mask.c1} stroke={mask.c2} strokeWidth="1.5" />
          <path d="M88 76 H112 M90 82 H110" stroke={mask.c2} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {glasses && (glasses.visualKey === "visor" ? (
        <g>
          <rect x="72" y="55" width="56" height="14" rx="7" fill={glasses.c1} opacity="0.7" stroke={glasses.c2} strokeWidth="2" />
          <path d="M78 62 H122" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
        </g>
      ) : (
        <g fill="none" stroke={glasses.c1} strokeWidth="2.4">
          <circle cx="89" cy="62" r="9" /><circle cx="111" cy="62" r="9" /><path d="M98 62 H102" />
        </g>
      ))}

      {head && head.visualKey === "cap" && (
        <g>
          <path d="M71 54 Q72 26 100 26 Q128 26 129 54 Z" fill={head.c1} />
          <path d="M68 55 Q100 66 136 54 L134 60 Q100 71 68 61 Z" fill={head.c2} />
        </g>
      )}
      {head && head.visualKey === "crown" && (
        <g>
          <path d="M74 38 L78 16 L90 30 L100 10 L110 30 L122 16 L126 38 Z" fill={head.c1} stroke={head.c2} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="100" cy="26" r="3.5" fill={head.c2} />
        </g>
      )}
      {head && head.visualKey === "halo" && (
        <ellipse cx="100" cy="16" rx="26" ry="6" fill="none" stroke={head.c1} strokeWidth="4" style={{ filter: `drop-shadow(0 0 6px ${head.c2})` }} />
      )}
    </>
  );

  return (
    <svg viewBox="0 0 200 320" width={size} height={size * 1.6} className={`${animated ? "animate-float" : ""} ${className}`} role="img" aria-label="Qahramon">
      <defs>
        <clipPath id={`${uid}-t`}><path d={torsoD(g)} /></clipPath>
      </defs>
      {flip ? <g transform="translate(200 0) scale(-1 1)">{inner}</g> : inner}
    </svg>
  );
}