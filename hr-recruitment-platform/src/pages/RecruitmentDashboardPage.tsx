import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const RecruitmentDashboardPage = () => {
  const [applicantVolume, setApplicantVolume] = useState(0);
  const [timeToHire, setTimeToHire] = useState(0);
  const [offerAcceptanceRate, setOfferAcceptanceRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));

        const { data: volumeData, error: volumeError } = await supabase.rpc('get_applicant_volume', {
          p_start_date: thirtyDaysAgo.toISOString(),
          p_end_date: today.toISOString(),
        });
        if (volumeError) throw volumeError;
        setApplicantVolume(volumeData);

        const { data: timeToHireData, error: timeToHireError } = await supabase.rpc('get_time_to_hire');
        if (timeToHireError) throw timeToHireError;
        setTimeToHire(timeToHireData);

        const { data: acceptanceRateData, error: acceptanceRateError } = await supabase.rpc('get_offer_acceptance_rate');
        if (acceptanceRateError) throw acceptanceRateError;
        setOfferAcceptanceRate(acceptanceRateData);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Recruitment Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900">Applicant Volume (Last 30 Days)</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{applicantVolume}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900">Average Time-to-Hire</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{timeToHire.toFixed(1)} days</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900">Offer Acceptance Rate</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{offerAcceptanceRate.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
};

export default RecruitmentDashboardPage;
