INSERT INTO public.email_templates (template_name, display_name, subject, body_html, is_active)
VALUES (
    'interview_reminder', 
    'Interview Reminder',
    'Reminder: Interview for {{job_title}}', 
    'Hello {{applicant_name}},<br><br>This is a reminder for your upcoming interview for the <strong>{{job_title}}</strong> position.<br><br><strong>Time:</strong> {{interview_time}}<br><br>We look forward to seeing you!<br><br>Best regards,<br>The Recruitment Team', 
    true
) 
ON CONFLICT (template_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html;
