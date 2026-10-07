import React from 'react';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';

const Sessions: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Active Sessions"
        description="Monitor and manage active user sessions across the platform"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121214] border border-zinc-800 rounded-xl">
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-2">Session Management</h3>
            <p className="text-gray-400">View active sessions and revoke access if necessary.</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Sessions;
