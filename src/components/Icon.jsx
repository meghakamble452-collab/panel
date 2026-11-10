const P = {
  dash: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  add: 'M12 5v14M5 12h14',
  crown: 'M3 17l2-9 5 4 2-6 2 6 5-4 2 9z',
  users: 'M4 20v-2a5 5 0 015-5h2a5 5 0 015 5v2M9 7a3 3 0 106 0 3 3 0 00-6 0',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  rupee: 'M7 4h9M7 9h9M15 4c0 4-3 5-6 5h6l-6 10',
  check: 'M4 13l5 5L20 6',
  power: 'M12 3v9M7.5 6a8 8 0 1015 0',
  reset: 'M4 10a8 8 0 1114 5M4 5v5h5',
  key: 'M15 7a4 4 0 11-4 4L4 18v3h3l1-1v-2h2v-2h2l1-1a4 4 0 013-5z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  shield: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z',
  down: 'M12 4v11m0 0l-4-4m4 4l4-4M4 20h16',
  out: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h9',
  search: 'M11 4a7 7 0 105 11l4 4M11 4a7 7 0 015 11',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6',
  lock: 'M6 11h12v9H6zM9 11V8a3 3 0 016 0v3',
  bolt: 'M13 2L4 14h6l-1 8 9-12h-6z',
};
export default function Icon({ n, s = 15 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={P[n] || P.dash} />
    </svg>
  );
}