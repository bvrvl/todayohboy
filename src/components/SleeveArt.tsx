import type { ArtStyle } from '../data/songs';

const colors: Record<ArtStyle, [string, string, string]> = {
  pepper: ['#174d4a', '#f4c256', '#ed7950'],
  strawberry: ['#d5658f', '#f3c45f', '#2a6960'],
  sun: ['#f0b449', '#e77142', '#f7e9bc'],
  road: ['#4b8176', '#e8cf88', '#173d3d'],
  rubber: ['#bd7845', '#d5b967', '#5c653c'],
  revolver: ['#6f638b', '#e9cba8', '#bb6a60'],
};

function Flower({ x, y, color, size = 1 }: { x: number; y: number; color: string; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    {Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx="0" cy="-12" rx="6" ry="12" fill={color} transform={`rotate(${i * 45})`} />)}
    <circle r="7" fill="#f4c256" /><circle r="3" fill="#183d3b" />
  </g>;
}

export function SleeveArt({ art, mini = false }: { art: ArtStyle; mini?: boolean }) {
  const [bg, gold, accent] = colors[art];
  return <svg className={`sleeve-art ${mini ? 'mini' : ''}`} viewBox="0 0 300 300" aria-hidden="true">
    <rect width="300" height="300" fill={bg} />
    {art === 'pepper' ? <>
      <rect x="11" y="11" width="278" height="278" rx="135" fill="none" stroke={gold} strokeWidth="1.5" />
      {Array.from({ length: 20 }, (_, i) => <path key={i} d="M150 150 L134 12 L166 12 Z" fill={i % 2 ? accent : gold} opacity=".3" transform={`rotate(${i * 18} 150 150)`} />)}
      <path d="M36 253 Q21 178 74 110 M267 250 Q288 166 232 100" fill="none" stroke={gold} strokeWidth="4" />
      {[52, 93, 137, 192, 243].map((y, i) => <Flower key={y} x={i % 2 ? 259 : 45} y={y} size={i % 2 ? .85 : 1} color={i % 2 ? '#f1a9b7' : accent} />)}
      <Flower x={250} y={67} color={gold} /><Flower x={56} y={229} color="#ea94ad" />
      <circle cx="150" cy="158" r="84" fill={bg} stroke={gold} strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx="150" cy="119" rx="15" ry="38" fill={i % 2 ? '#efbb89' : '#e68a78'} stroke={gold} strokeWidth="1" transform={`rotate(${i * 30} 150 158)`} />)}
      <circle cx="150" cy="158" r="29" fill={gold} />
      <circle cx="150" cy="158" r="20" fill={bg} />
      <path d="M137 158 Q150 145 163 158 M140 168 Q150 174 160 168" fill="none" stroke={gold} strokeWidth="2" strokeLinecap="round" />
      <Flower x={150} y={43} size={.75} color={accent} /><Flower x={150} y={265} color={accent} size={.65} />
    </> : art === 'strawberry' ? <>
      {Array.from({ length: 8 }, (_, i) => <circle key={i} cx="150" cy="150" r={140 - i * 16} fill="none" stroke={i % 2 ? gold : '#e9a4b2'} strokeWidth="8" />)}
      <path d="M0 268 Q72 206 150 247 T300 256 V300 H0Z" fill={accent} />
      <path d="M0 284 Q95 246 168 284 T300 270 V300 H0Z" fill="#183f3f" />
      <path d="M150 251 Q105 196 111 124 M153 243 Q197 193 210 100" fill="none" stroke={accent} strokeWidth="6" />
      <path d="M139 108 C90 79 57 130 93 175 C114 205 130 220 144 214 C165 187 193 138 171 114 C162 105 149 104 139 108Z" fill="#c84646" stroke="#f4d786" strokeWidth="2" />
      <path d="M109 108 L118 86 L134 106 L145 81 L148 109 L174 95 L164 122 L143 117Z" fill={accent} />
      {[ [114,137], [139,137], [158,144], [120,160], [144,163], [130,184] ].map(([x,y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2" ry="4" fill={gold} transform={`rotate(-20 ${x} ${y})`} />)}
      <Flower x={214} y={95} color="#f4dfaa" size={1.15} /><Flower x={72} y={227} color={gold} size={.6} />
      <circle cx="58" cy="58" r="13" fill={gold} /><path d="M230 212 q-18-28-37-12 q11 29 37 12" fill="#93ad68" />
    </> : art === 'sun' ? <>
      {Array.from({ length: 16 }, (_, i) => <path key={i} d="M150 144 L128 -30 L172 -30Z" transform={`rotate(${i * 22.5} 150 144)`} fill={i % 2 ? accent : gold} />)}
      <circle cx="150" cy="144" r="66" fill={gold} stroke="#9a442c" strokeWidth="2" />
      <path d="M120 142 Q131 133 141 142 M159 142 Q169 133 180 142 M130 161 Q150 180 170 161" fill="none" stroke="#9a442c" strokeWidth="3" strokeLinecap="round" />
      <path d="M0 239 Q80 205 150 245 T300 230 V300 H0Z" fill="#396d57" /><path d="M0 270 Q95 235 174 278 T300 252 V300 H0Z" fill="#183f3d" />
    </> : art === 'road' ? <>
      <circle cx="230" cy="57" r="30" fill={gold} />
      {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${i * 55 - 20} 0 Q${i * 55 + 55} 100 ${i * 55 - 20} 210`} fill="none" stroke={accent} strokeWidth="23" />)}
      <path d="M0 210 Q80 172 160 215 T300 190 V300 H0Z" fill="#173d3d" />
      <path d="M0 268 Q60 225 126 258 T300 225" fill="none" stroke={gold} strokeWidth="8" />
      <path d="M0 288 Q64 245 130 278 T300 245" fill="none" stroke="#80a8a2" strokeWidth="5" />
      <Flower x={71} y={208} color={gold} />
    </> : <>
      {Array.from({ length: 11 }, (_, i) => <ellipse key={i} cx="150" cy="150" rx={138 - i * 11} ry={120 - i * 8} fill="none" stroke={i % 2 ? accent : gold} strokeWidth="6" transform={`rotate(${i * 16} 150 150)`} />)}
      <Flower x={150} y={150} size={2} color={gold} />
    </>}
    <rect x="5" y="5" width="290" height="290" fill="none" stroke="#fff6d5" strokeOpacity=".4" />
  </svg>;
}
