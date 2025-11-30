import { supabase } from '../lib/supabase';
import { Client, CareGoal, Visit, Medication, MarRecord, Incident, CarePlan } from '../types';

// ==========================================
// Clients
// ==========================================

export const clientService = {
    async getAll() {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name');

        if (error) throw error;

        return data.map((c: any) => ({
            ...c,
            careLevel: c.care_level,
            fundingDetails: {
                source: c.funding_source,
                ...c.funding_details
            },
            emergencyContact: {
                name: c.emergency_contact_name,
                relation: c.emergency_contact_relation,
                phone: c.emergency_contact_phone
            },
            lastVisit: 'No visits yet' // Placeholder until we join with visits
        })) as Client[];
    },

    // SAFE RPC METHOD
    async getByTenant(tenantId: string) {
        const { data, error } = await supabase.rpc('get_tenant_clients', { p_tenant_id: tenantId });

        if (error) throw error;

        return (data || []).map((c: any) => ({
            ...c,
            careLevel: c.care_level,
            fundingDetails: {
                source: c.funding_source,
                ...c.funding_details
            },
            emergencyContact: {
                name: c.emergency_contact_name,
                relation: c.emergency_contact_relation,
                phone: c.emergency_contact_phone
            },
            lastVisit: 'No visits yet'
        })) as Client[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('clients')
            .select('*, care_plans(*), medications(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(client: Partial<Client>) {
        const { data, error } = await supabase
            .from('clients')
            .insert([client])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Client>) {
        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ==========================================
// Visits / Rostering
// ==========================================

export const visitService = {
    async getUpcoming(limit = 5) {
        const { data, error } = await supabase
            .from('visits')
            .select('*, clients(name, address)')
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true })
            .order('start_time', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    async getByDateRange(start: string, end: string) {
        const { data, error } = await supabase
            .from('visits')
            .select('*, clients(name), employees(name)')
            .gte('date', start)
            .lte('date', end);

        if (error) throw error;
        return data;
    },

    async getUnassigned() {
        const { data, error } = await supabase
            .from('visits')
            .select('*, clients(name)')
            .is('staff_id', null)
            .eq('status', 'Scheduled');

        if (error) throw error;
        return data;
    },

    async assignStaff(visitId: string, staffId: string, date: string) {
        const { data, error } = await supabase
            .from('visits')
            .update({ staff_id: staffId, date: date, status: 'Scheduled' })
            .eq('id', visitId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async create(visit: Partial<Visit>) {
        const { data, error } = await supabase
            .from('visits')
            .insert([{
                client_id: visit.clientId,
                staff_id: visit.staffId,
                date: visit.date,
                start_time: visit.startTime,
                end_time: visit.endTime,
                visit_type: visit.visitType,
                status: visit.status || 'Scheduled',
                notes: 'Created via Rostering'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};

export const medicationService = {
    // Alias for compatibility
    async getByClient(clientId: string) {
        // Try RPC first for safety
        try {
            return await this.getByClientRpc(clientId);
        } catch (e) {
            console.warn('RPC failed, falling back to direct query', e);
            return this.getForClient(clientId);
        }
    },

    // SAFE RPC METHOD
    async getByClientRpc(clientId: string) {
        const { data, error } = await supabase.rpc('get_client_medications', { p_client_id: clientId });
        if (error) throw error;
        return data as Medication[];
    },

    async getForClient(clientId: string) {
        const { data, error } = await supabase
            .from('medications')
            .select('*')
            .eq('client_id', clientId)
            .eq('is_active', true);

        if (error) throw error;
        return data as Medication[];
    },

    async getMar(clientId: string, date: string) {
        // Try RPC first
        try {
            const { data, error } = await supabase.rpc('get_client_mar', { p_client_id: clientId, p_date: date });
            if (error) throw error;

            return (data || []).map((r: any) => ({
                id: r.id,
                medicationId: r.medication_id,
                scheduledDate: r.scheduled_date,
                date: r.scheduled_date, // Map scheduled_date to date property
                timeSlot: r.time_slot,
                status: r.status,
                administeredBy: r.admin_name, // RPC returns joined name
                administeredAt: r.administered_at,
                notes: r.notes
            })) as MarRecord[];

        } catch (e) {
            console.warn('MAR RPC failed, fallback', e);
            // Fallback
            const { data, error } = await supabase
                .from('medication_records')
                .select('*, administeredBy:employees(name)')
                .eq('client_id', clientId)
                .eq('scheduled_date', date);

            if (error) throw error;

            return data.map((r: any) => ({
                id: r.id,
                medicationId: r.medication_id,
                scheduledDate: r.scheduled_date,
                date: r.scheduled_date, // Map scheduled_date to date property
                timeSlot: r.time_slot,
                status: r.status,
                administeredBy: r.administeredBy?.name,
                administeredAt: r.administered_at,
                notes: r.notes
            })) as MarRecord[];
        }
    },

    async signMar(record: { clientId: string, medicationId: string, date: string, timeSlot: string, status: string, staffId: string, note?: string }) {
        const { data, error } = await supabase
            .from('medication_records')
            .insert([{
                client_id: record.clientId,
                medication_id: record.medicationId,
                scheduled_date: record.date,
                time_slot: record.timeSlot,
                status: record.status,
                administered_by: null, // We need to link this to auth user eventually, for now null or staffId if it's a UUID
                notes: record.note,
                administered_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async create(medication: any) {
        const { data, error } = await supabase
            .from('medications')
            .insert([{
                client_id: medication.clientId,
                name: medication.name,
                dosage: medication.dosage,
                frequency: medication.frequency,
                route: medication.route,
                start_date: medication.startDate,
                instructions: medication.instructions,
                stock_level: medication.stockLevel
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async recordAdministration(record: Partial<MarRecord>) {
        const { data, error } = await supabase
            .from('medication_records')
            .insert([record])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ==========================================
// Incidents
// ==========================================

export const incidentService = {
    async getAll() {
        const { data, error } = await supabase
            .from('incidents')
            .select('*, clients(name), employees(name)')
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(incident: Partial<Incident>) {
        const { data, error } = await supabase
            .from('incidents')
            .insert([incident])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ==========================================
// Dashboard Stats
// ==========================================

export const statsService = {
    async getDashboardStats() {
        const { count: clientCount } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Active');

        const { count: visitCount } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('date', new Date().toISOString().split('T')[0]);

        const { count: incidentCount } = await supabase
            .from('incidents')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Open');

        return {
            activeClients: clientCount || 0,
            todayVisits: visitCount || 0,
            openIncidents: incidentCount || 0
        };
    }
};

// ==========================================
// Staff
// ==========================================

export const staffService = {
    async getAll() {
        const { data, error } = await supabase
            .from('employees')
            .select('*, training_records(*)')
            .order('name');

        if (error) throw error;

        return data.map((e: any) => ({
            id: e.id,
            userId: e.user_id,
            name: e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
            role: e.role || 'Staff',
            status: e.status || 'Active',
            avatar: (e.name || e.first_name || '?').charAt(0).toUpperCase(),
            phone: e.phone || 'N/A',
            email: e.email || 'N/A',
            joinedDate: e.created_at ? new Date(e.created_at).toLocaleDateString() : 'N/A',
            availability: 'Flexible', // Placeholder
            skills: ['Care Certificate', 'First Aid'], // Placeholder
            dbsStatus: e.dbs_status || 'Pending',
            rtwStatus: e.right_to_work_status || 'Pending',
            compliance: e.training_records?.map((t: any) => ({
                id: t.id,
                name: t.training_name,
                expiryDate: t.expiry_date,
                status: t.status
            })) || []
        }));
    },

    async create(staff: any) {
        const { data, error } = await supabase
            .from('employees')
            .insert([{
                name: staff.name,
                email: staff.email,
                phone: staff.phone,
                role: staff.role,
                status: 'Active',
                // Add other fields as needed
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async addTrainingRecord(record: { userId: string, trainingName: string, expiryDate: string, status: string, certificateUrl?: string }) {
        // First get the employee ID from the user ID
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('id, tenant_id')
            .eq('user_id', record.userId)
            .single();

        if (empError) throw empError;

        const { data, error } = await supabase
            .from('training_records')
            .insert([{
                tenant_id: employee.tenant_id,
                employee_id: employee.id,
                training_name: record.trainingName,
                expiry_date: record.expiryDate,
                status: record.status,
                certificate_url: record.certificateUrl,
                completion_date: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
