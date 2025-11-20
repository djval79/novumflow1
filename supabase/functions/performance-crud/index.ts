import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewType {
  name: string;
  description?: string;
  frequency: string;
  auto_schedule: boolean;
  schedule_offset_days?: number;
  trigger_event: string;
  duration_days?: number;
  requires_self_assessment: boolean;
  requires_manager_review: boolean;
  requires_peer_review: boolean;
  peer_review_count?: number;
  allow_skip_level_review: boolean;
  rating_scale_type: string;
  passing_threshold?: number;
  notification_template?: string;
}

interface PerformanceReview {
  review_type_id: string;
  employee_id: string;
  review_period_start: string;
  review_period_end: string;
  review_due_date: string;
  status?: string;
  overall_rating?: number;
  overall_comments?: string;
  strengths?: string;
  areas_for_improvement?: string;
  action_items?: string;
  next_review_date?: string;
}

interface Goal {
  employee_id: string;
  title: string;
  description?: string;
  goal_type: string;
  category?: string;
  target_date?: string;
  status?: string;
  progress_percentage?: number;
  measurement_criteria?: string;
  target_value?: string;
  current_value?: string;
  priority?: string;
  linked_review_id?: string;
  parent_goal_id?: string;
}

interface KPIDefinition {
  name: string;
  description?: string;
  category?: string;
  measurement_unit?: string;
  target_type: string;
  calculation_method?: string;
  data_source?: string;
  frequency: string;
  applicable_roles?: string[];
}

interface KPIValue {
  kpi_definition_id: string;
  employee_id?: string;
  department?: string;
  period_start: string;
  period_end: string;
  target_value?: number;
  actual_value: number;
  notes?: string;
}

interface Criteria {
  review_type_id: string;
  category: string;
  criterion_name: string;
  description?: string;
  weight?: number;
  is_required?: boolean;
  display_order?: number;
}

interface Rating {
  review_id: string;
  participant_id: string;
  criterion_id: string;
  rating: number;
  comments?: string;
  examples?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get user profile and role
    const { data: profile } = await supabaseClient
      .from('users_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = profile?.role;

    const { action, entity, data, id, filters } = await req.json();

    // Log audit trail helper
    const logAudit = async (actionType: string, entityType: string, entityId?: string) => {
      await supabaseClient.from('audit_logs').insert({
        user_id: user.id,
        action: actionType,
        entity_type: entityType,
        entity_id: entityId,
        timestamp: new Date().toISOString(),
      });
    };

    // ==================== REVIEW TYPES ====================
    if (entity === 'review_types') {
      if (action === 'create') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized: Only admin and HR managers can create review types');
        }

        const reviewType: ReviewType = data;
        const { data: newReviewType, error } = await supabaseClient
          .from('performance_review_types')
          .insert({
            ...reviewType,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        await logAudit('CREATE_REVIEW_TYPE', 'performance_review_types', newReviewType.id);

        return new Response(JSON.stringify(newReviewType), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'list') {
        const { data: reviewTypes, error } = await supabaseClient
          .from('performance_review_types')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify(reviewTypes), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized');
        }

        const { data: updated, error } = await supabaseClient
          .from('performance_review_types')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await logAudit('UPDATE_REVIEW_TYPE', 'performance_review_types', id);

        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized');
        }

        const { error } = await supabaseClient
          .from('performance_review_types')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await logAudit('DELETE_REVIEW_TYPE', 'performance_review_types', id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ==================== REVIEWS ====================
    if (entity === 'reviews') {
      if (action === 'create') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized');
        }

        const review: PerformanceReview = data;
        const { data: newReview, error } = await supabaseClient
          .from('performance_reviews')
          .insert({
            ...review,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Auto-create participants based on review type requirements
        const { data: reviewType } = await supabaseClient
          .from('performance_review_types')
          .select('*')
          .eq('id', review.review_type_id)
          .single();

        if (reviewType) {
          const participants = [];

          // Add employee self-assessment
          if (reviewType.requires_self_assessment) {
            const { data: employee } = await supabaseClient
              .from('employees')
              .select('user_id')
              .eq('id', review.employee_id)
              .single();

            if (employee) {
              participants.push({
                review_id: newReview.id,
                participant_id: employee.user_id,
                participant_type: 'self',
              });
            }
          }

          // Add manager review
          if (reviewType.requires_manager_review) {
            const { data: employee } = await supabaseClient
              .from('employees')
              .select('manager_id, employees!manager_id(user_id)')
              .eq('id', review.employee_id)
              .single();

            if (employee?.manager_id) {
              participants.push({
                review_id: newReview.id,
                participant_id: employee.employees.user_id,
                participant_type: 'manager',
              });
            }
          }

          if (participants.length > 0) {
            await supabaseClient.from('review_participants').insert(participants);
          }
        }

        await logAudit('CREATE_REVIEW', 'performance_reviews', newReview.id);

        return new Response(JSON.stringify(newReview), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'list') {
        let query = supabaseClient
          .from('performance_reviews')
          .select(`
            *,
            review_type:performance_review_types(name, frequency),
            employee:employees(first_name, last_name, email, department)
          `)
          .order('created_at', { ascending: false });

        // Filter by employee if not admin/hr_manager
        if (!['admin', 'hr_manager'].includes(userRole)) {
          const { data: userEmployee } = await supabaseClient
            .from('employees')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (userEmployee) {
            query = query.eq('employee_id', userEmployee.id);
          }
        }

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }

        if (filters?.employee_id) {
          query = query.eq('employee_id', filters.employee_id);
        }

        const { data: reviews, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify(reviews), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'get') {
        const { data: review, error } = await supabaseClient
          .from('performance_reviews')
          .select(`
            *,
            review_type:performance_review_types(*),
            employee:employees(first_name, last_name, email, department, position),
            participants:review_participants(
              *,
              participant:users_profiles(full_name, email)
            ),
            ratings:performance_ratings(
              *,
              criterion:performance_criteria(*)
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(review), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update') {
        const { data: updated, error } = await supabaseClient
          .from('performance_reviews')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await logAudit('UPDATE_REVIEW', 'performance_reviews', id);

        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized');
        }

        const { error } = await supabaseClient
          .from('performance_reviews')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await logAudit('DELETE_REVIEW', 'performance_reviews', id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Auto-schedule reviews
      if (action === 'auto_schedule') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized');
        }

        // Get all active review types with auto_schedule enabled
        const { data: reviewTypes } = await supabaseClient
          .from('performance_review_types')
          .select('*')
          .eq('is_active', true)
          .eq('auto_schedule', true);

        // Get all employees
        const { data: employees } = await supabaseClient
          .from('employees')
          .select('*')
          .eq('status', 'active');

        const newReviews = [];

        for (const reviewType of reviewTypes || []) {
          for (const employee of employees || []) {
            let shouldSchedule = false;
            let periodStart = new Date();
            let periodEnd = new Date();
            let dueDate = new Date();

            if (reviewType.trigger_event === 'hire_date' && employee.hire_date) {
              const hireDate = new Date(employee.hire_date);
              const daysSinceHire = Math.floor(
                (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24)
              );

              if (
                daysSinceHire >= reviewType.schedule_offset_days &&
                daysSinceHire < reviewType.schedule_offset_days + 30
              ) {
                shouldSchedule = true;
                periodStart = new Date(hireDate);
                periodEnd = new Date(
                  hireDate.getTime() + reviewType.schedule_offset_days * 24 * 60 * 60 * 1000
                );
                dueDate = new Date(periodEnd.getTime() + reviewType.duration_days * 24 * 60 * 60 * 1000);
              }
            }

            if (shouldSchedule) {
              // Check if review already exists
              const { data: existing } = await supabaseClient
                .from('performance_reviews')
                .select('id')
                .eq('employee_id', employee.id)
                .eq('review_type_id', reviewType.id)
                .gte('review_period_start', periodStart.toISOString().split('T')[0])
                .single();

              if (!existing) {
                newReviews.push({
                  review_type_id: reviewType.id,
                  employee_id: employee.id,
                  review_period_start: periodStart.toISOString().split('T')[0],
                  review_period_end: periodEnd.toISOString().split('T')[0],
                  review_due_date: dueDate.toISOString().split('T')[0],
                  is_auto_generated: true,
                  created_by: user.id,
                });
              }
            }
          }
        }

        if (newReviews.length > 0) {
          const { data: created, error } = await supabaseClient
            .from('performance_reviews')
            .insert(newReviews)
            .select();

          if (error) throw error;

          await logAudit('AUTO_SCHEDULE_REVIEWS', 'performance_reviews');

          return new Response(JSON.stringify({ count: created.length, reviews: created }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ count: 0, reviews: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ==================== GOALS ====================
    if (entity === 'goals') {
      if (action === 'create') {
        const goal: Goal = data;
        const { data: newGoal, error } = await supabaseClient
          .from('performance_goals')
          .insert({
            ...goal,
            assigned_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        await logAudit('CREATE_GOAL', 'performance_goals', newGoal.id);

        return new Response(JSON.stringify(newGoal), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'list') {
        let query = supabaseClient
          .from('performance_goals')
          .select(`
            *,
            employee:employees(first_name, last_name, email, department),
            assigner:users_profiles!assigned_by(full_name)
          `)
          .order('created_at', { ascending: false });

        if (!['admin', 'hr_manager'].includes(userRole)) {
          const { data: userEmployee } = await supabaseClient
            .from('employees')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (userEmployee) {
            query = query.eq('employee_id', userEmployee.id);
          }
        }

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }

        if (filters?.employee_id) {
          query = query.eq('employee_id', filters.employee_id);
        }

        const { data: goals, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify(goals), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update') {
        const { data: updated, error } = await supabaseClient
          .from('performance_goals')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await logAudit('UPDATE_GOAL', 'performance_goals', id);

        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete') {
        const { error } = await supabaseClient
          .from('performance_goals')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await logAudit('DELETE_GOAL', 'performance_goals', id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ==================== KPI DEFINITIONS ====================
    if (entity === 'kpi_definitions') {
      if (action === 'create') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized');
        }

        const kpi: KPIDefinition = data;
        const { data: newKPI, error } = await supabaseClient
          .from('kpi_definitions')
          .insert({
            ...kpi,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        await logAudit('CREATE_KPI_DEFINITION', 'kpi_definitions', newKPI.id);

        return new Response(JSON.stringify(newKPI), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'list') {
        const { data: kpis, error } = await supabaseClient
          .from('kpi_definitions')
          .select('*')
          .order('category', { ascending: true });

        if (error) throw error;

        return new Response(JSON.stringify(kpis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized');
        }

        const { data: updated, error } = await supabaseClient
          .from('kpi_definitions')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await logAudit('UPDATE_KPI_DEFINITION', 'kpi_definitions', id);

        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized');
        }

        const { error } = await supabaseClient
          .from('kpi_definitions')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await logAudit('DELETE_KPI_DEFINITION', 'kpi_definitions', id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ==================== KPI VALUES ====================
    if (entity === 'kpi_values') {
      if (action === 'create') {
        const kpiValue: KPIValue = data;
        const { data: newValue, error } = await supabaseClient
          .from('kpi_values')
          .insert({
            ...kpiValue,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        await logAudit('CREATE_KPI_VALUE', 'kpi_values', newValue.id);

        return new Response(JSON.stringify(newValue), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'list') {
        let query = supabaseClient
          .from('kpi_values')
          .select(`
            *,
            kpi:kpi_definitions(name, category, measurement_unit, target_type),
            employee:employees(first_name, last_name, email, department)
          `)
          .order('period_start', { ascending: false });

        if (!['admin', 'hr_manager'].includes(userRole)) {
          const { data: userEmployee } = await supabaseClient
            .from('employees')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (userEmployee) {
            query = query.eq('employee_id', userEmployee.id);
          }
        }

        if (filters?.employee_id) {
          query = query.eq('employee_id', filters.employee_id);
        }

        if (filters?.kpi_definition_id) {
          query = query.eq('kpi_definition_id', filters.kpi_definition_id);
        }

        const { data: values, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify(values), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update') {
        const { data: updated, error } = await supabaseClient
          .from('kpi_values')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await logAudit('UPDATE_KPI_VALUE', 'kpi_values', id);

        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete') {
        const { error } = await supabaseClient
          .from('kpi_values')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await logAudit('DELETE_KPI_VALUE', 'kpi_values', id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ==================== CRITERIA ====================
    if (entity === 'criteria') {
      if (action === 'create') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized');
        }

        const criteria: Criteria = data;
        const { data: newCriteria, error } = await supabaseClient
          .from('performance_criteria')
          .insert({
            ...criteria,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        await logAudit('CREATE_CRITERIA', 'performance_criteria', newCriteria.id);

        return new Response(JSON.stringify(newCriteria), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'list') {
        let query = supabaseClient
          .from('performance_criteria')
          .select('*')
          .order('display_order', { ascending: true });

        if (filters?.review_type_id) {
          query = query.eq('review_type_id', filters.review_type_id);
        }

        const { data: criteria, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify(criteria), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized');
        }

        const { data: updated, error } = await supabaseClient
          .from('performance_criteria')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await logAudit('UPDATE_CRITERIA', 'performance_criteria', id);

        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized');
        }

        const { error } = await supabaseClient
          .from('performance_criteria')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await logAudit('DELETE_CRITERIA', 'performance_criteria', id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ==================== RATINGS ====================
    if (entity === 'ratings') {
      if (action === 'create') {
        const rating: Rating = data;
        const { data: newRating, error } = await supabaseClient
          .from('performance_ratings')
          .insert(rating)
          .select()
          .single();

        if (error) throw error;

        await logAudit('CREATE_RATING', 'performance_ratings', newRating.id);

        // Check if all ratings are complete for this participant
        const { data: participant } = await supabaseClient
          .from('review_participants')
          .select('*, review:performance_reviews(review_type_id)')
          .eq('id', rating.participant_id)
          .single();

        if (participant) {
          const { data: criteria } = await supabaseClient
            .from('performance_criteria')
            .select('id')
            .eq('review_type_id', participant.review.review_type_id)
            .eq('is_required', true);

          const { data: existingRatings } = await supabaseClient
            .from('performance_ratings')
            .select('id')
            .eq('participant_id', rating.participant_id);

          if (criteria && existingRatings && existingRatings.length >= criteria.length) {
            await supabaseClient
              .from('review_participants')
              .update({ status: 'completed', submitted_at: new Date().toISOString() })
              .eq('id', rating.participant_id);
          }
        }

        return new Response(JSON.stringify(newRating), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'list') {
        let query = supabaseClient
          .from('performance_ratings')
          .select(`
            *,
            criterion:performance_criteria(*)
          `);

        if (filters?.review_id) {
          query = query.eq('review_id', filters.review_id);
        }

        if (filters?.participant_id) {
          query = query.eq('participant_id', filters.participant_id);
        }

        const { data: ratings, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify(ratings), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update') {
        const { data: updated, error } = await supabaseClient
          .from('performance_ratings')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await logAudit('UPDATE_RATING', 'performance_ratings', id);

        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ==================== PARTICIPANTS ====================
    if (entity === 'participants') {
      if (action === 'add') {
        if (!['admin', 'hr_manager'].includes(userRole)) {
          throw new Error('Unauthorized');
        }

        const { data: participant, error } = await supabaseClient
          .from('review_participants')
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        await logAudit('ADD_PARTICIPANT', 'review_participants', participant.id);

        return new Response(JSON.stringify(participant), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'list') {
        let query = supabaseClient
          .from('review_participants')
          .select(`
            *,
            participant:users_profiles(full_name, email)
          `);

        if (filters?.review_id) {
          query = query.eq('review_id', filters.review_id);
        }

        const { data: participants, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify(participants), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'my_pending') {
        const { data: pending, error } = await supabaseClient
          .from('review_participants')
          .select(`
            *,
            review:performance_reviews(
              *,
              employee:employees(first_name, last_name),
              review_type:performance_review_types(name)
            )
          `)
          .eq('participant_id', user.id)
          .in('status', ['pending', 'in_progress'])
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify(pending), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    throw new Error('Invalid action or entity');
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
