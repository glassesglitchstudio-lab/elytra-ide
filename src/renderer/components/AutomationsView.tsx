import React, { useState } from 'react';
import { Clock, Plus, Play, Trash2, Power, Terminal, AlertCircle } from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';
import type { AutomationRule } from '../../types/elythra';

export const AutomationsView: React.FC = () => {
  const { automations, updateAutomations, activeProject } = useElythraStore();

  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCmd, setNewRuleCmd] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState<'on-save' | 'on-build' | 'scheduled'>('on-save');
  const [runningId, setRunningId] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    const updated = automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    await updateAutomations(updated);
  };

  const handleDelete = async (id: string) => {
    const updated = automations.filter((a) => a.id !== id);
    await updateAutomations(updated);
  };

  const handleCreate = async () => {
    if (!newRuleName.trim() || !newRuleCmd.trim()) return;
    const newRule: AutomationRule = {
      id: `auto-${Date.now()}`,
      name: newRuleName,
      trigger: newRuleTrigger,
      command: newRuleCmd,
      enabled: true,
    };
    await updateAutomations([...automations, newRule]);
    setNewRuleName('');
    setNewRuleCmd('');
  };

  const handleRunNow = async (rule: AutomationRule) => {
    if (!window.elythraAPI) return;
    setRunningId(rule.id);
    const termId = `auto-run-${Date.now()}`;
    await window.elythraAPI.terminalCreate(termId, activeProject?.path);
    await window.elythraAPI.terminalWrite(termId, rule.command + '\n');
    setTimeout(() => setRunningId(null), 1500);
  };

  return (
    <div className="flex-1 h-[calc(100vh-44px)] bg-[#111111] overflow-y-auto p-8 select-none">
      <div className="max-w-[800px] mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#e5e5e5] flex items-center gap-2">
            <Clock size={20} /> Project Automations
          </h2>
          <p className="text-[13px] text-[#8a8a8a] mt-1">
            Define automated tasks that trigger on file save, build events, or scheduled intervals.
          </p>
        </div>

        {/* Yeni Kural Ekleme Kartı */}
        <div className="p-4 bg-[#161616] border border-[#262626] rounded-btn space-y-3">
          <span className="text-[13px] font-semibold text-[#e5e5e5]">Create New Automation</span>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Rule Name (e.g. Run Linter)"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              className="bg-[#111111] border border-[#262626] rounded-btn px-3 py-1.5 text-[12px] text-[#e5e5e5] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Command (e.g. npm test)"
              value={newRuleCmd}
              onChange={(e) => setNewRuleCmd(e.target.value)}
              className="bg-[#111111] border border-[#262626] rounded-btn px-3 py-1.5 text-[12px] text-[#e5e5e5] focus:outline-none"
            />
            <select
              value={newRuleTrigger}
              onChange={(e) => setNewRuleTrigger(e.target.value as any)}
              className="bg-[#111111] border border-[#262626] rounded-btn px-3 py-1.5 text-[12px] text-[#e5e5e5] focus:outline-none"
            >
              <option value="on-save">Trigger: On Save</option>
              <option value="on-build">Trigger: On Build</option>
              <option value="scheduled">Trigger: Scheduled</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 bg-[#e5e5e5] text-[#111111] hover:bg-white rounded-btn text-[12px] font-medium flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Automation
          </button>
        </div>

        {/* Aktif Kurallar Listesi */}
        <div className="space-y-2">
          {automations.map((rule) => (
            <div
              key={rule.id}
              className="p-3.5 bg-[#161616] border border-[#262626] rounded-btn flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(rule.id)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    rule.enabled
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-[#222222] text-[#666666]'
                  }`}
                  title={rule.enabled ? 'Enabled' : 'Disabled'}
                >
                  <Power size={14} />
                </button>
                <div>
                  <div className="text-[13px] font-medium text-[#e5e5e5] flex items-center gap-2">
                    <span>{rule.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#222222] text-[#8a8a8a] rounded">
                      {rule.trigger}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#8a8a8a] mt-0.5">
                    {rule.command}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunNow(rule)}
                  disabled={runningId === rule.id}
                  className="px-2.5 py-1 text-[11px] bg-[#222222] hover:bg-[#2a2a2a] text-[#e5e5e5] rounded flex items-center gap-1 transition-colors"
                >
                  <Play size={11} /> {runningId === rule.id ? 'Running...' : 'Run Now'}
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-1 text-[#8a8a8a] hover:text-red-400 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
