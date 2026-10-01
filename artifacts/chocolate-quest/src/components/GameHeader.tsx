import { Sparkles, Volume2, VolumeX } from 'lucide-react';

export function GameHeader({ soundOn, onToggleSound }: { soundOn: boolean; onToggleSound: () => void }) {
  return (
    <header className="site-header">
      <div className="brand-lockup" aria-label="Chocolate Quest">
        <span className="brand-monogram">C<span>Q</span></span>
        <span className="brand-name">CHOCOLATE<br />QUEST</span>
      </div>
      <div className="header-center"><Sparkles size={12} /> THE KNOWLEDGE ARCADE <Sparkles size={12} /></div>
      <button type="button" data-testid="button-toggle-sound" aria-pressed={soundOn} onClick={onToggleSound} className="sound-toggle">
        {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        <span>SOUND {soundOn ? 'ON' : 'OFF'}</span>
      </button>
    </header>
  );
}