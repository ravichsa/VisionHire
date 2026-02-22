import { useState } from 'react';
import { Eye, FileText, PhoneCall, ExternalLink } from 'lucide-react';
import { DataTable, ColumnConfig } from 'dragarwals-react-datatable';
import type { DoctorRecord } from '../lib/database.types';
import { PDFViewer } from './PDFViewer';
import { DoctorProfilePanel } from './DoctorProfilePanel';

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
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRecord | null>(null);

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Not Answering': 'badge badge-light-secondary',
      'Follow-up': 'badge badge-light-primary',
      'Future Lead': 'badge badge-light-info',
      'Interested': 'badge badge-light-success',
      'Not Interested': 'badge badge-light-secondary',
      'Ex-Agarwal': 'badge badge-light-warning',
      'Currently with Agarwal': 'badge badge-light-info',
      'Assessment Planned': 'badge badge-light-warning',
      'Joined': 'badge badge-light-success',
      'Rejected': 'badge badge-light-danger',
      'Backed Out': 'badge badge-light-warning',
      'On-Hold': 'badge badge-light-secondary'
    };
    return colors[status] || 'badge badge-light-secondary';
  };

  const columns: ColumnConfig[] = [
    {
      key: 'date',
      label: 'Date',
      type: 'date',
      format: 'dd-MMM-yyyy',
      sortable: true,
      filterable: true,
      width: '120px'
    },
    {
      key: 'doctor_name',
      label: 'Doctor Name',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '200px',
      template: (value, row: DoctorRecord) => (
        <div>
          <div className="font-medium text-gray-900">{value || '-'}</div>
          {row.linkedin && (
            <a
              href={row.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary d-inline-flex align-items-center gap-1 mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              LinkedIn <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )
    },
    {
      key: 'contact_number',
      label: 'Contact',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '150px',
      template: (value, row: DoctorRecord) => (
        <div>
          <div>{value || '-'}</div>
          {row.alternate_contact_number && (
            <div className="text-xs text-muted">{row.alternate_contact_number}</div>
          )}
        </div>
      )
    },
    {
      key: 'specialisation',
      label: 'Specialisation',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      key: 'experience',
      label: 'Experience',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '120px'
    },
    {
      key: 'current_location',
      label: 'Current Location',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      key: 'preferred_location',
      label: 'Preferred Location',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      key: 'hr_call_status',
      label: 'HR Status',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '180px',
      highlightColumn: {
        type: 'badge',
        getClassFn: (value) => getStatusColor(value || 'Not Set')
      }
    },
    {
      key: 'recruiter_name',
      label: 'Recruiter',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      key: 'source',
      label: 'Source',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '120px'
    },
    {
      key: 'resume_url',
      label: 'Resume',
      type: 'text',
      sortable: false,
      filterable: false,
      width: '100px',
      template: (value, row: DoctorRecord) => (
        value ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResumeClick(value, row.doctor_name);
            }}
            className="btn btn-sm btn-light-primary d-flex align-items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            <span className="small">View</span>
          </button>
        ) : (
          <span className="text-muted small">-</span>
        )
      )
    },
    {
      key: 'id',
      label: 'Actions',
      type: 'text',
      sortable: false,
      filterable: false,
      width: '120px',
      template: (value, row: DoctorRecord) => (
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenProfile(row);
            }}
            className="btn btn-sm btn-light-primary p-1"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewCalls(row);
            }}
            className="btn btn-sm btn-light-success p-1"
            title="View Call Details"
          >
            <PhoneCall className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (doctors.length === 0) {
    return (
      <div className="text-center py-5 bg-white rounded shadow">
        <Eye className="w-12 h-12 text-muted mx-auto mb-3" />
        <p className="text-muted fs-5">No doctor records found</p>
        <p className="text-muted small mt-1">Click "Add New Doctor" to create your first record</p>
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

      <DataTable
        data={doctors}
        columns={columns}
        name="doctor-hiring-tracker"
      />
    </>
  );
}
