export interface AvatarPreset {
  id: string;
  label: string;
  emoji: string;
  bgGradient: string;
  textColor: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'grad', label: 'Scholar', emoji: '🎓', bgGradient: 'from-stone-800 to-stone-950', textColor: 'text-white' },
  { id: 'owl', label: 'Wisdom', emoji: '🦉', bgGradient: 'from-zinc-700 to-zinc-900', textColor: 'text-white' },
  { id: 'fox', label: 'Clever', emoji: '🦊', bgGradient: 'from-neutral-800 to-neutral-950', textColor: 'text-white' },
  { id: 'rocket', label: 'Achiever', emoji: '🚀', bgGradient: 'from-stone-700 to-stone-900', textColor: 'text-white' },
  { id: 'bolt', label: 'Dynamic', emoji: '⚡', bgGradient: 'from-zinc-800 to-black', textColor: 'text-white' },
  { id: 'star', label: 'Star', emoji: '🌟', bgGradient: 'from-neutral-700 to-stone-900', textColor: 'text-white' },
  { id: 'palette', label: 'Creative', emoji: '🎨', bgGradient: 'from-stone-600 to-stone-800', textColor: 'text-white' },
  { id: 'tech', label: 'Coder', emoji: '💻', bgGradient: 'from-zinc-600 to-zinc-800', textColor: 'text-white' },
  { id: 'science', label: 'Scientist', emoji: '🔬', bgGradient: 'from-neutral-750 to-neutral-900', textColor: 'text-white' },
  { id: 'leaf', label: 'Growth', emoji: '🌿', bgGradient: 'from-stone-700 to-zinc-900', textColor: 'text-white' },
  { id: 'lion', label: 'Leader', emoji: '🦁', bgGradient: 'from-zinc-800 to-stone-950', textColor: 'text-white' },
  { id: 'dolphin', label: 'Innovator', emoji: '🐬', bgGradient: 'from-neutral-800 to-black', textColor: 'text-white' },
];

export function getAvatarPreset(avatarId?: string): AvatarPreset {
  if (!avatarId) return AVATAR_PRESETS[0];
  const found = AVATAR_PRESETS.find(a => a.id === avatarId);
  return found || AVATAR_PRESETS[0];
}
