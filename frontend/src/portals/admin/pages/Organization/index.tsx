import React from 'react';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';

const Organization: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Organization"
        description="Manage organizational structure and settings"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121214] border border-zinc-800 rounded-xl">
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-2">Company Details</h3>
            <p className="text-gray-400">View and update company information.</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Organization;
