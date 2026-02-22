import { Eye, ExternalLink, FileText, PhoneCall, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

  const sortedDoctors = useMemo(() => {
    if (!sortField || !sortDirection) {
      return doctors;
    }

    return [...doctors].sort((a, b) => {
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
  }, [doctors, sortField, sortDirection]);

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
            {sortedDoctors.map((doctor) => (
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
    </div>
    </>
  );
}
