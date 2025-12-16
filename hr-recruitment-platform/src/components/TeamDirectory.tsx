import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { Search, User, Mail, Phone, Building, MapPin, ChevronRight, Grid, List, Filter, SortAsc } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    department: string;
    position: string;
    location?: string;
    avatar_url?: string;
    status: 'active' | 'inactive' | 'on_leave';
    manager_id?: string;
    hire_date: string;
}

export default function TeamDirectory() {
    const { currentTenant } = useTenant();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'name' | 'department' | 'hire_date'>('name');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    useEffect(() => {
        loadEmployees();
    }, [currentTenant]);

    useEffect(() => {
        filterAndSortEmployees();
    }, [employees, searchQuery, selectedDepartment, sortBy]);

    async function loadEmployees() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('tenant_id', currentTenant?.id)
                .order('first_name');

            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            console.error('Error loading employees:', error);
            // Generate mock data
            setEmployees(generateMockEmployees());
        } finally {
            setLoading(false);
        }
    }

    function generateMockEmployees(): Employee[] {
        const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Operations', 'Finance'];
        const positions = ['Manager', 'Senior', 'Junior', 'Lead', 'Director', 'Analyst'];
        const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Emily', 'Robert', 'Lisa', 'William', 'Anna'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];

        return Array.from({ length: 24 }, (_, i) => ({
            id: `emp-${i}`,
            first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
            last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
            email: `user${i}@company.com`,
            phone: `+44 7${Math.random().toString().slice(2, 12)}`,
            department: departments[Math.floor(Math.random() * departments.length)],
            position: `${positions[Math.floor(Math.random() * positions.length)]} ${['Developer', 'Designer', 'Manager', 'Executive'][Math.floor(Math.random() * 4)]}`,
            location: ['London', 'Manchester', 'Remote', 'Birmingham'][Math.floor(Math.random() * 4)],
            status: ['active', 'active', 'active', 'on_leave'][Math.floor(Math.random() * 4)] as any,
            hire_date: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        }));
    }

    function filterAndSortEmployees() {
        let filtered = [...employees];

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(emp =>
                emp.first_name.toLowerCase().includes(query) ||
                emp.last_name.toLowerCase().includes(query) ||
                emp.email.toLowerCase().includes(query) ||
                emp.department.toLowerCase().includes(query) ||
                emp.position.toLowerCase().includes(query)
            );
        }

        // Department filter
        if (selectedDepartment !== 'all') {
            filtered = filtered.filter(emp => emp.department === selectedDepartment);
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
                case 'department':
                    return a.department.localeCompare(b.department);
                case 'hire_date':
                    return new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime();
                default:
                    return 0;
            }
        });

        setFilteredEmployees(filtered);
    }

    const departments = Array.from(new Set(employees.map(e => e.department))).sort();

    function getStatusColor(status: string) {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'inactive': return 'bg-gray-400';
            case 'on_leave': return 'bg-yellow-500';
            default: return 'bg-gray-400';
        }
    }

    function getAvatarColor(name: string) {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
            'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded w-1/3" />
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Team Directory</h2>
                        <p className="text-sm text-gray-500">{employees.length} team members</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-4 flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, department..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="all">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="department">Sort by Department</option>
                        <option value="hire_date">Sort by Hire Date</option>
                    </select>
                </div>
            </div>

            {/* Employee Grid/List */}
            <div className={`p-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}`}>
                {filteredEmployees.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No team members found</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    filteredEmployees.map(employee => (
                        <div
                            key={employee.id}
                            onClick={() => setSelectedEmployee(employee)}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-indigo-300 transition cursor-pointer"
                        >
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="relative">
                                    {employee.avatar_url ? (
                                        <img src={employee.avatar_url} alt="" className="w-12 h-12 rounded-full" />
                                    ) : (
                                        <div className={`w-12 h-12 rounded-full ${getAvatarColor(`${employee.first_name} ${employee.last_name}`)} flex items-center justify-center text-white font-semibold`}>
                                            {getInitials(`${employee.first_name} ${employee.last_name}`)}
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getStatusColor(employee.status)} rounded-full border-2 border-white`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {employee.first_name} {employee.last_name}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">{employee.position}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5 text-sm">
                                <p className="flex items-center text-gray-600">
                                    <Building className="w-4 h-4 mr-2 text-gray-400" />
                                    {employee.department}
                                </p>
                                <p className="flex items-center text-gray-600">
                                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                    <span className="truncate">{employee.email}</span>
                                </p>
                                {employee.location && (
                                    <p className="flex items-center text-gray-600">
                                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                        {employee.location}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    filteredEmployees.map(employee => (
                        <div
                            key={employee.id}
                            onClick={() => setSelectedEmployee(employee)}
                            className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-indigo-300 transition cursor-pointer"
                        >
                            <div className="relative mr-4">
                                {employee.avatar_url ? (
                                    <img src={employee.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                                ) : (
                                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(`${employee.first_name} ${employee.last_name}`)} flex items-center justify-center text-white font-medium text-sm`}>
                                        {getInitials(`${employee.first_name} ${employee.last_name}`)}
                                    </div>
                                )}
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(employee.status)} rounded-full border-2 border-white`} />
                            </div>
                            <div className="flex-1 min-w-0 grid grid-cols-4 gap-4">
                                <div>
                                    <p className="font-medium text-gray-900">{employee.first_name} {employee.last_name}</p>
                                    <p className="text-sm text-gray-500">{employee.position}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{employee.department}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{employee.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{employee.location || '-'}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                    ))
                )}
            </div>

            {/* Employee Detail Modal */}
            {selectedEmployee && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-center">
                            <button
                                onClick={() => setSelectedEmployee(null)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white"
                            >
                                ✕
                            </button>
                            <div className="relative inline-block">
                                {selectedEmployee.avatar_url ? (
                                    <img src={selectedEmployee.avatar_url} alt="" className="w-20 h-20 rounded-full border-4 border-white" />
                                ) : (
                                    <div className={`w-20 h-20 rounded-full ${getAvatarColor(`${selectedEmployee.first_name} ${selectedEmployee.last_name}`)} flex items-center justify-center text-white font-bold text-2xl border-4 border-white`}>
                                        {getInitials(`${selectedEmployee.first_name} ${selectedEmployee.last_name}`)}
                                    </div>
                                )}
                                <div className={`absolute bottom-1 right-1 w-5 h-5 ${getStatusColor(selectedEmployee.status)} rounded-full border-3 border-white`} />
                            </div>
                            <h3 className="mt-3 text-xl font-semibold text-white">
                                {selectedEmployee.first_name} {selectedEmployee.last_name}
                            </h3>
                            <p className="text-indigo-200">{selectedEmployee.position}</p>
                        </div>

                        {/* Details */}
                        <div className="px-6 py-4 space-y-4">
                            <div className="flex items-center">
                                <Building className="w-5 h-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-500">Department</p>
                                    <p className="font-medium text-gray-900">{selectedEmployee.department}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <a href={`mailto:${selectedEmployee.email}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                                        {selectedEmployee.email}
                                    </a>
                                </div>
                            </div>
                            {selectedEmployee.phone && (
                                <div className="flex items-center">
                                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <a href={`tel:${selectedEmployee.phone}`} className="font-medium text-gray-900">
                                            {selectedEmployee.phone}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {selectedEmployee.location && (
                                <div className="flex items-center">
                                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Location</p>
                                        <p className="font-medium text-gray-900">{selectedEmployee.location}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 bg-gray-50 flex space-x-3">
                            <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                Send Message
                            </button>
                            <button className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                View Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
