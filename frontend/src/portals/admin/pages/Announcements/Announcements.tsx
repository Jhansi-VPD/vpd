import React, { useState } from 'react';
import Button from '../../../../shared/components/Button';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import Input from '../../../../shared/components/Input';

export const Announcements: React.FC = () => {
  const [items, setItems] = useState([
    { id: '1', title: 'Q4 2026 Townhall & Strategy Briefing', date: 'Oct 15, 2026', author: 'Leadership Office' },
    { id: '2', title: 'Upgraded VPN and SSO Protocols Active', date: 'Oct 01, 2026', author: 'InfoSec Team' },
  ]);
  const [title, setTitle] = useState('');

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setItems([{ id: String(Date.now()), title, date: 'Today', author: 'Admin' }, ...items]);
    setTitle('');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Broadcast Announcements"
        description="Publish organization-wide notices across all employee portals"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Broadcast Announcements' }]}
        
      />

      <form onSubmit={handlePost} className="p-5 bg-[#121214] border border-zinc-800 rounded-xl space-y-3">
        <Input label="New Announcement Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual Holiday Schedule" required />
        <div className="flex justify-end">
          <Button variant="primary" size="sm" type="submit">Broadcast Notice</Button>
        </div>
      </form>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-[#121214] border border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-100">{item.title}</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Posted by {item.author} • {item.date}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">Active</span>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
export default Announcements;
