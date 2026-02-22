import { Eye, ExternalLink, FileText, PhoneCall, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { DoctorRecord } from '../lib/database.types';
import { PDFViewer } from './PDFViewer';
import { DoctorProfilePanel } from './DoctorProfilePanel';

type SortField = keyof DoctorRecord | null;
type SortDirection = 'asc' | 'desc' | null;

interface DoctorTableProps {
  doctors: DoctorRecord[];
  onEdit: (doctor: DoctorRecord) => void;
  onDelete: (id: string) => void;
  onViewCalls: (doctor: DoctorRecord) => void;
  onUpdate: () => void;
}

export function DoctorTable({ doctors, onDelete, onViewCalls, onUpdate }: DoctorTableProps) {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<{ url: string; doctorName: string } | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [specialisationFilter, setSpecialisationFilter] = useState<string>('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedDoctors = useMemo(() => {
    let filtered = [...doctors];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(doctor =>
        doctor.doctor_name?.toLowerCase().includes(search) ||
        doctor.contact_number?.toLowerCase().includes(search) ||
        doctor.specialisation?.toLowerCase().includes(search) ||
        doctor.current_location?.toLowerCase().includes(search) ||
        doctor.preferred_location?.toLowerCase().includes(search) ||
        doctor.recruiter_name?.toLowerCase().includes(search) ||
        doctor.source?.toLowerCase().includes(search)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(doctor => doctor.hr_call_status === statusFilter);
    }

    if (specialisationFilter) {
      filtered = filtered.filter(doctor => doctor.specialisation === specialisationFilter);
    }

    if (!sortField || !sortDirection) {
      return filtered;
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined || aValue === '') return 1;
      if (bValue === null || bValue === undefined || bValue === '') return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [doctors, sortField, sortDirection, searchTerm, statusFilter, specialisationFilter]);

  const paginatedDoctors = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedDoctors.slice(startIndex, endIndex);
  }, [filteredAndSortedDoctors, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedDoctors.length / pageSize);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(doctors.map(d => d.hr_call_status).filter(Boolean));
    return Array.from(statuses).sort();
  }, [doctors]);

  const uniqueSpecialisations = useMemo(() => {
    const specs = new Set(doctors.map(d => d.specialisation).filter(Boolean));
    return Array.from(specs).sort();
  }, [doctors]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleResumeClick = (resumeUrl: string, doctorName: string) => {
    setSelectedResume({ url: resumeUrl, doctorName });
    setPdfViewerOpen(true);
  };

  const handleClosePdfViewer = () => {
    setPdfViewerOpen(false);
    setTimeout(() => setSelectedResume(null), 300);
  };

  const handleOpenProfile = (doctor: DoctorRecord) => {
    setSelectedDoctor(doctor);
    setProfilePanelOpen(true);
  };

  const handleCloseProfile = () => {
    setProfilePanelOpen(false);
    setTimeout(() => setSelectedDoctor(null), 300);
  };

  const handleProfileUpdate = () => {
    onUpdate();
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 text-blue-600" />;
    }
    return <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Not Answering': 'bg-gray-100 text-gray-800',
      'Follow-up': 'bg-blue-100 text-blue-800',
      'Future Lead': 'bg-cyan-100 text-cyan-800',
      'Interested': 'bg-green-100 text-green-800',
      'Not Interested': 'bg-gray-200 text-gray-600',
      'Ex-Agarwal': 'bg-amber-100 text-amber-800',
      'Currently with Agarwal': 'bg-teal-100 text-teal-800',
      'Assessment Planned': 'bg-yellow-100 text-yellow-800',
      'Joined': 'bg-emerald-100 text-emerald-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Backed Out': 'bg-orange-100 text-orange-800',
      'On-Hold': 'bg-slate-100 text-slate-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (doctors.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <Eye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-lg">No doctor records found</p>
        <p className="text-gray-400 text-sm mt-1">Click "Add New Doctor" to create your first record</p>
      </div>
    );
  }

  return (
    <>
      <PDFViewer
        isOpen={pdfViewerOpen}
        onClose={handleClosePdfViewer}
        pdfUrl={selectedResume?.url || ''}
        doctorName={selectedResume?.doctorName || ''}
      />

      <DoctorProfilePanel
        isOpen={profilePanelOpen}
        onClose={handleCloseProfile}
        doctor={selectedDoctor}
        onUpdate={handleProfileUpdate}
        onDelete={onDelete}
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={specialisationFilter}
              onChange={(e) => {
                setSpecialisationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Specialisations</option>
              {uniqueSpecialisations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {filteredAndSortedDoctors.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredAndSortedDoctors.length)} of {filteredAndSortedDoctors.length} doctors
            </div>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-2">
                  Date
                  {getSortIcon('date')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('doctor_name')}
              >
                <div className="flex items-center gap-2">
                  Doctor Name
                  {getSortIcon('doctor_name')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('specialisation')}
              >
                <div className="flex items-center gap-2">
                  Specialisation
                  {getSortIcon('specialisation')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('experience')}
              >
                <div className="flex items-center gap-2">
                  Experience
                  {getSortIcon('experience')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('current_location')}
              >
                <div className="flex items-center gap-2">
                  Current Location
                  {getSortIcon('current_location')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('preferred_location')}
              >
                <div className="flex items-center gap-2">
                  Preferred Location
                  {getSortIcon('preferred_location')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('hr_call_status')}
              >
                <div className="flex items-center gap-2">
                  HR Status
                  {getSortIcon('hr_call_status')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('recruiter_name')}
              >
                <div className="flex items-center gap-2">
                  Recruiter
                  {getSortIcon('recruiter_name')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('source')}
              >
                <div className="flex items-center gap-2">
                  Source
                  {getSortIcon('source')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Resume</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedDoctors.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(doctor.date)}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  <div className="flex flex-col">
                    <span>{doctor.doctor_name || '-'}</span>
                    {doctor.linkedin && (
                      <a
                        href={doctor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                      >
                        LinkedIn <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div className="flex flex-col">
                    <span>{doctor.contact_number || '-'}</span>
                    {doctor.alternate_contact_number && (
                      <span className="text-xs text-gray-500">{doctor.alternate_contact_number}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{doctor.specialisation || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{doctor.experience || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{doctor.current_location || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{doctor.preferred_location || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doctor.hr_call_status)}`}>
                    {doctor.hr_call_status || 'Not Set'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{doctor.recruiter_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{doctor.source || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  {doctor.resume_url ? (
                    <button
                      onClick={() => handleResumeClick(doctor.resume_url, doctor.doctor_name)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                      title="View Resume"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-xs">View</span>
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenProfile(doctor)}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-1.5 hover:bg-blue-50 rounded"
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onViewCalls(doctor)}
                      className="text-green-600 hover:text-green-800 transition-colors p-1.5 hover:bg-green-50 rounded"
                      title="View Call Details"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const pages = [];
                const maxVisible = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                if (endPage - startPage < maxVisible - 1) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`px-3 py-1 rounded transition-colors ${
                        currentPage === i
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
