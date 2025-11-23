-- Update application_documents table to support expanded categories
ALTER TABLE application_documents 
DROP CONSTRAINT IF EXISTS application_documents_category_check;

ALTER TABLE application_documents
ADD CONSTRAINT application_documents_category_check 
CHECK (category IN (
  'cv_resume',
  'cover_letter',
  'identity',
  'right_to_work',
  'qualification',
  'reference',
  'dbs_certificate',
  'proof_of_address',
  'training_certificate',
  'professional_license',
  'medical_certificate',
  'ni_document',
  'other'
));

-- Verification
SELECT 'SUCCESS! Document categories expanded to 13 types.' as status;
