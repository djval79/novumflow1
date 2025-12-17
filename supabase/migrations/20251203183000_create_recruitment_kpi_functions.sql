-- Functions for Recruitment Dashboard KPIs

-- 1. Applicant Volume
CREATE OR REPLACE FUNCTION get_applicant_volume(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  volume INT;
BEGIN
  SELECT COUNT(*)
  INTO volume
  FROM applications
  WHERE created_at BETWEEN p_start_date AND p_end_date;

  RETURN volume;
END;
$$;

-- 2. Time-to-Hire
CREATE OR REPLACE FUNCTION get_time_to_hire()
RETURNS FLOAT
LANGUAGE plpgsql
AS $$
DECLARE
  avg_time_to_hire FLOAT;
BEGIN
  SELECT AVG(EXTRACT(EPOCH FROM (offer_accepted_at - created_at))) / (60*60*24)
  INTO avg_time_to_hire
  FROM applications
  WHERE offer_accepted_at IS NOT NULL;

  RETURN avg_time_to_hire;
END;
$$;

-- 3. Offer Acceptance Rate
CREATE OR REPLACE FUNCTION get_offer_acceptance_rate()
RETURNS FLOAT
LANGUAGE plpgsql
AS $$
DECLARE
  total_offers INT;
  accepted_offers INT;
BEGIN
  SELECT COUNT(*)
  INTO total_offers
  FROM applications
  WHERE offer_sent_at IS NOT NULL;

  SELECT COUNT(*)
  INTO accepted_offers
  FROM applications
  WHERE offer_accepted_at IS NOT NULL;

  IF total_offers = 0 THEN
    RETURN 0;
  END IF;

  RETURN (accepted_offers::FLOAT / total_offers::FLOAT) * 100;
END;
$$;
