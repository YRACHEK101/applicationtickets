import React from 'react';
import { useParams } from 'react-router-dom';

export default function CompanyDetail() {
  const { id } = useParams();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Company Detail</h1>
      <p>Showing details for company ID: {id}</p>
    </div>
  );
}