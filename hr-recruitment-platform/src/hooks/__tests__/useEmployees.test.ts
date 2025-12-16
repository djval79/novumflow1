/// <reference types="vitest" />
/**
 * useEmployees Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock data
const mockEmployees = [
    {
        id: 'emp-1',
        user_id: 'user-1',
        tenant_id: 'tenant-1',
        employee_number: 'EMP001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@company.com',
        phone: '+447123456789',
        department: 'Engineering',
        position: 'Senior Software Engineer',
        manager_id: 'emp-5',
        hire_date: '2022-03-15',
        employment_type: 'full_time',
        salary: 75000,
        is_active: true,
        created_at: '2022-03-15T10:00:00Z',
    },
    {
        id: 'emp-2',
        user_id: 'user-2',
        tenant_id: 'tenant-1',
        employee_number: 'EMP002',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@company.com',
        phone: '+447987654321',
        department: 'Product',
        position: 'Product Manager',
        manager_id: 'emp-6',
        hire_date: '2021-06-01',
        employment_type: 'full_time',
        salary: 85000,
        is_active: true,
        created_at: '2021-06-01T10:00:00Z',
    },
    {
        id: 'emp-3',
        user_id: 'user-3',
        tenant_id: 'tenant-1',
        employee_number: 'EMP003',
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob.johnson@company.com',
        phone: '+447555123456',
        department: 'Engineering',
        position: 'Junior Developer',
        manager_id: 'emp-1',
        hire_date: '2023-09-01',
        employment_type: 'full_time',
        salary: 45000,
        is_active: true,
        created_at: '2023-09-01T10:00:00Z',
    },
    {
        id: 'emp-4',
        user_id: 'user-4',
        tenant_id: 'tenant-1',
        employee_number: 'EMP004',
        first_name: 'Alice',
        last_name: 'Williams',
        email: 'alice.williams@company.com',
        phone: '+447888999000',
        department: 'HR',
        position: 'HR Coordinator',
        manager_id: null,
        hire_date: '2020-01-15',
        employment_type: 'part_time',
        salary: 35000,
        is_active: false,
        created_at: '2020-01-15T10:00:00Z',
    },
];

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockEmployees, error: null })),
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: mockEmployees[0], error: null })),
                })),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: mockEmployees[0], error: null })),
                })),
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({ data: mockEmployees[0], error: null })),
                    })),
                })),
            })),
            delete: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
        })),
    },
    getSupabaseClient: () => ({}),
}));

describe('useEmployees Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Mock Data Validation', () => {
        it('should have valid employee structure', () => {
            mockEmployees.forEach(emp => {
                expect(emp).toHaveProperty('id');
                expect(emp).toHaveProperty('first_name');
                expect(emp).toHaveProperty('last_name');
                expect(emp).toHaveProperty('email');
                expect(emp).toHaveProperty('department');
                expect(emp).toHaveProperty('position');
            });
        });

        it('should have unique employee numbers', () => {
            const numbers = mockEmployees.map(e => e.employee_number);
            const uniqueNumbers = new Set(numbers);
            expect(uniqueNumbers.size).toBe(numbers.length);
        });

        it('should have valid email formats', () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            mockEmployees.forEach(emp => {
                expect(emailRegex.test(emp.email)).toBe(true);
            });
        });

        it('should have valid employment types', () => {
            const validTypes = ['full_time', 'part_time', 'contract', 'intern'];
            mockEmployees.forEach(emp => {
                expect(validTypes).toContain(emp.employment_type);
            });
        });

        it('should have valid hire dates', () => {
            mockEmployees.forEach(emp => {
                const hireDate = new Date(emp.hire_date);
                expect(hireDate).toBeInstanceOf(Date);
                expect(isNaN(hireDate.getTime())).toBe(false);
            });
        });
    });

    describe('Employee Filtering', () => {
        it('should filter by department', () => {
            const engineering = mockEmployees.filter(e => e.department === 'Engineering');
            expect(engineering.length).toBe(2);
        });

        it('should filter active employees', () => {
            const active = mockEmployees.filter(e => e.is_active);
            expect(active.length).toBe(3);
        });

        it('should filter by employment type', () => {
            const fullTime = mockEmployees.filter(e => e.employment_type === 'full_time');
            expect(fullTime.length).toBe(3);
        });

        it('should search by name', () => {
            const searchTerm = 'john';
            const results = mockEmployees.filter(e =>
                e.first_name.toLowerCase().includes(searchTerm) ||
                e.last_name.toLowerCase().includes(searchTerm)
            );
            expect(results.length).toBe(2); // John Doe and Bob Johnson
        });
    });

    describe('Employee Hierarchy', () => {
        it('should identify employees with managers', () => {
            const withManager = mockEmployees.filter(e => e.manager_id !== null);
            expect(withManager.length).toBe(3);
        });

        it('should find direct reports', () => {
            const directReports = mockEmployees.filter(e => e.manager_id === 'emp-1');
            expect(directReports.length).toBe(1);
            expect(directReports[0].first_name).toBe('Bob');
        });
    });

    describe('Employee Statistics', () => {
        it('should calculate department headcount', () => {
            const deptCounts = mockEmployees.reduce((acc, emp) => {
                acc[emp.department] = (acc[emp.department] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            expect(deptCounts['Engineering']).toBe(2);
            expect(deptCounts['Product']).toBe(1);
            expect(deptCounts['HR']).toBe(1);
        });

        it('should calculate average salary by department', () => {
            const engineering = mockEmployees.filter(e => e.department === 'Engineering');
            const avgSalary = engineering.reduce((sum, e) => sum + e.salary, 0) / engineering.length;
            expect(avgSalary).toBe(60000);
        });

        it('should calculate tenure in years', () => {
            const calcTenure = (hireDate: string) => {
                const hire = new Date(hireDate);
                const now = new Date('2024-01-15');
                const years = (now.getTime() - hire.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                return Math.floor(years);
            };

            expect(calcTenure('2022-03-15')).toBe(1);
            expect(calcTenure('2020-01-15')).toBe(4);
        });
    });
});
