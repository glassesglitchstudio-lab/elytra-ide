import React, { useState } from 'react';
import { Layers, Sliders, Shield, Keyboard, Save } from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

export const CustomizationsView: React.FC = () => {
  const { settings, updateSettings } = useElythraStore();
  const [rules, setRules] = useState(settings.systemInstructions);
  const [fontSize, setFontSize] = useState(settings.fontSize);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await updateSettings({
      systemInstructions: rules,
      fontSize: Number(fontSize),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const SHORTCUTS = [
    { key: 'Ctrl + B', desc: 'Toggle Sidebar' },
    { key: 'Ctrl + `', desc: 'Toggle Integrated Terminal' },
    { key: 'Ctrl + L', desc: 'Toggle Right AI Assistant Panel' },
    { key: 'Ctrl + S', desc: 'Save Active Tab' },
    { key: 'Ctrl + Shift + P', desc: 'Command Palette' },
    { key: 'Ctrl + P', desc: 'Quick Open Files' },
  ];

  return (
    <div className="flex-1 h-[calc(100vh-44px)] bg-[#111111] overflow-y-auto p-8 select-none">
      <div className="max-w-[800px] mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#e5e5e5] flex items-center gap-2">
            <Layers size={20} /> Customizations & Rules
          </h2>
          <p className="text-[13px] text-[#8a8a8a] mt-1">
            Configure IDE behavior, pair programming rules, and custom keybindings.
          </p>
        </div>

        {/* Kurallar Editörü */}
        <div className="p-4 bg-[#161616] border border-[#262626] rounded-btn space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#e5e5e5] flex items-center gap-2">
              <Shield size={15} /> System Instructions (Rules for Elythra)
            </span>
            {saved && <span className="text-[11px] text-green-400">Saved successfully!</span>}
          </div>
          <p className="text-[11px] text-[#8a8a8a]">
            These custom instructions will be prepended as high-priority behavioral guidelines into every AI request.
          </p>
          <textarea
            rows={6}
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            className="w-full bg-[#111111] border border-[#262626] rounded-btn p-3 text-[12px] text-[#e5e5e5] font-mono leading-relaxed focus:outline-none"
          />
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-[#e5e5e5] text-[#111111] hover:bg-white rounded-btn text-[12px] font-medium flex items-center gap-1.5"
          >
            <Save size={13} /> Save Rules
          </button>
        </div>

        {/* Kısayollar Tablosu */}
        <div className="p-4 bg-[#161616] border border-[#262626] rounded-btn space-y-3">
          <span className="text-[13px] font-semibold text-[#e5e5e5] flex items-center gap-2">
            <Keyboard size={15} /> Keybindings & Shortcuts
          </span>
          <div className="divide-y divide-[#1f1f1f] text-[12px]">
            {SHORTCUTS.map((s, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <span className="text-[#8a8a8a]">{s.desc}</span>
                <kbd className="px-2 py-0.5 bg-[#111111] border border-[#262626] rounded text-[#e5e5e5] font-mono text-[11px]">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
