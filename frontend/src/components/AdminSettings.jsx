import React, { useState } from 'react';
import { Save, ShieldAlert, BadgeInfo } from 'lucide-react';
import { AdminFormInput } from './AdminComponents';

export default function AdminSettings({ globalSettings = {}, onSaveSettings }) {
  const [cbPercent, setCbPercent] = useState((globalSettings.cashbackPercent || 8.0).toString());
  const [holdPeriod, setHoldPeriod] = useState((globalSettings.holdDays || 30).toString());
  const [minWithdraw, setMinWithdraw] = useState((globalSettings.min_withdrawal || globalSettings.minimumWithdrawal || 500).toString());
  const [sharedCbPercent, setSharedCbPercent] = useState((globalSettings.sharedCommissionPercent || 5.0).toString());
  const [sharedHoldPeriod, setSharedHoldPeriod] = useState((globalSettings.sharedCommissionHoldDays || 30).toString());

  React.useEffect(() => {
    if (globalSettings) {
      if (globalSettings.cashbackPercent != null) setCbPercent(globalSettings.cashbackPercent.toString());
      if (globalSettings.holdDays != null) setHoldPeriod(globalSettings.holdDays.toString());
      const minVal = globalSettings.min_withdrawal ?? globalSettings.minimumWithdrawal;
      if (minVal != null) setMinWithdraw(minVal.toString());
      if (globalSettings.sharedCommissionPercent != null) setSharedCbPercent(globalSettings.sharedCommissionPercent.toString());
      if (globalSettings.sharedCommissionHoldDays != null) setSharedHoldPeriod(globalSettings.sharedCommissionHoldDays.toString());
    }
  }, [globalSettings]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!cbPercent || !holdPeriod || !minWithdraw || !sharedCbPercent || !sharedHoldPeriod) {
      return;
    }

    onSaveSettings({
      cashbackPercent: parseFloat(cbPercent),
      holdDays: parseInt(holdPeriod, 10),
      minimumWithdrawal: parseFloat(minWithdraw),
      min_withdrawal: minWithdraw.toString(),
      sharedCommissionPercent: parseFloat(sharedCbPercent),
      sharedCommissionHoldDays: parseInt(sharedHoldPeriod, 10),
    });
  };

  return (
    <div className="admin-settings-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Platform Settings</h2>
          <p>Configure app-wide rules, percentages, payout triggers, and security hold periods</p>
        </div>
      </div>

      <div className="admin-table-card animate-fade" style={{ padding: '32px', maxWidth: '650px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: 'rgba(var(--primary-rgb), 0.04)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <BadgeInfo size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <p style={{ fontSize: '12px', color: 'var(--text)' }}>
              These settings govern default tracking parameters. Modifying them affects all new incoming clicks and user transactions.
            </p>
          </div>

          <AdminFormInput
            label="Default Cashback Percentage (%)"
            id="settings-cb"
            type="number"
            step="0.1"
            placeholder="8.0"
            value={cbPercent}
            onChange={(e) => setCbPercent(e.target.value)}
          />

          <AdminFormInput
            label="Cashback Hold Period (Days)"
            id="settings-hold"
            type="number"
            placeholder="30"
            value={holdPeriod}
            onChange={(e) => setHoldPeriod(e.target.value)}
          />

          <AdminFormInput
            label="Minimum Withdrawal Threshold (₹)"
            id="settings-min"
            type="number"
            step="0.01"
            placeholder="10.00"
            value={minWithdraw}
            onChange={(e) => setMinWithdraw(e.target.value)}
          />

          <AdminFormInput
            label="Default User Shared Commission Rate (%)"
            id="settings-shared-cb"
            type="number"
            step="0.1"
            placeholder="5.0"
            value={sharedCbPercent}
            onChange={(e) => setSharedCbPercent(e.target.value)}
          />

          <AdminFormInput
            label="Shared Commission Hold Period (Days)"
            id="settings-shared-hold"
            type="number"
            placeholder="30"
            value={sharedHoldPeriod}
            onChange={(e) => setSharedHoldPeriod(e.target.value)}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '11px', fontWeight: '500', marginTop: '6px' }}>
            <ShieldAlert size={14} />
            <span>Changing these values requires system-level admin credentials (simulated).</span>
          </div>

          <button type="submit" className="admin-btn admin-btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
            <Save size={16} />
            Save Platform Settings
          </button>
        </form>
      </div>
    </div>
  );
}
