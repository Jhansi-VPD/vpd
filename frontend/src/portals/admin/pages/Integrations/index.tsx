import React from 'react';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';

const Integrations: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Integrations"
        description="Manage third-party integrations and API connections"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121214] border border-zinc-800 rounded-xl">
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-2">Connected Apps</h3>
            <p className="text-gray-400">Configure connections to external services.</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Integrations;
