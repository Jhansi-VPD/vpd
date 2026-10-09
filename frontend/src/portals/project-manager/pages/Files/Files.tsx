import React from 'react';
import { Documents as AdminDocs } from '../../../admin/pages/Documents/Documents';

export const Files: React.FC = () => (
  <AdminDocs
    portalTitle="Project Files & Enterprise Assets Vault"
    portalDescription="Project specifications, architecture blueprints, signed SOWs, and delivery assets"
    breadcrumbs={[{ label: 'Delivery Hub' }, { label: 'Files & Assets' }]}
  />
);

export default Files;
