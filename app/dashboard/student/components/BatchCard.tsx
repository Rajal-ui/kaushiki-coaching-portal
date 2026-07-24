'use client';

import { useRouter } from 'next/navigation';
import { GraduationCap, CalendarCheck, User, Video, BarChart3, MessageSquare } from 'lucide-react';

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  batch: {
    id: string;
    capacity: number;
    seatsFilled: number;
    schedule: string;
    subject: { name: string; track: { name: string } };
    faculty: { name: string };
  };
  payment: { status: string; amount: number; paidAt: string } | null;
}

interface BatchCardProps {
  enrollment: Enrollment;
  onViewAttendance?: (batchId: string) => void;
  onAskDoubt?: (batchId: string) => void;
  showActions?: boolean;
}

export function BatchCard({ enrollment, onViewAttendance, onAskDoubt, showActions = true }: BatchCardProps) {
  const router = useRouter();
  const { batch } = enrollment;
  const fillPct = batch.capacity > 0 ? Math.round((batch.seatsFilled / batch.capacity) * 100) : 0;

  const statusBadge = (status: string) => {
    const s: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      REVOKED: 'bg-red-100 text-red-800',
    };
    return s[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{batch.subject.name}</h3>
          <p className="text-xs text-gray-500">{batch.subject.track.name.replace(/_/g, ' ')}</p>
        </div>
        <GraduationCap className="w-5 h-5 text-gray-400" />
      </div>

      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
        <CalendarCheck className="w-3 h-3" />
        {batch.schedule}
      </p>

      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
        <User className="w-3 h-3" />
        {batch.faculty.name}
      </p>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Capacity</span>
          <span>{batch.seatsFilled}/{batch.capacity}</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${fillPct >= 90 ? 'bg-amber-500' : fillPct >= 70 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(100, fillPct)}%` }}
          />
        </div>
      </div>

      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(enrollment.status)}`}>
        {enrollment.status}
      </span>

      {showActions && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onViewAttendance?.(batch.id) || router.push('/dashboard/student/attendance')}
            className="flex-1 py-2 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors inline-flex items-center justify-center gap-1"
          >
            <CalendarCheck className="w-3 h-3" /> Attendance
          </button>
          <button
            onClick={() => onAskDoubt?.(batch.id) || router.push('/dashboard/student/doubts')}
            className="flex-1 py-2 text-xs font-medium bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors inline-flex items-center justify-center gap-1"
          >
            <MessageSquare className="w-3 h-3" /> Doubt
          </button>
          <button
            onClick={() => router.push(`/dashboard/student/batches/${batch.id}/recordings`)}
            className="flex-1 py-2 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center justify-center gap-1"
          >
            <Video className="w-3.5 h-3.5" /> Recordings
          </button>
        </div>
      )}
    </div>
  );
}

export function BatchCardCompact({ batch }: { batch: Enrollment['batch'] }) {
  const router = useRouter();
  const fillPct = batch.capacity > 0 ? Math.round((batch.seatsFilled / batch.capacity) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{batch.subject.name}</h3>
          <p className="text-xs text-gray-500">{batch.subject.track.name.replace(/_/g, ' ')}</p>
        </div>
        <GraduationCap className="w-5 h-5 text-gray-400" />
      </div>

      <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
        <CalendarCheck className="w-3 h-3" />
        {batch.schedule}
      </div>

      <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
        <User className="w-3 h-3" />
        {batch.faculty.name}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Capacity</span>
          <span>{batch.seatsFilled}/{batch.capacity} ({fillPct}%)</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${fillPct >= 90 ? 'bg-amber-500' : fillPct >= 70 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(100, fillPct)}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => router.push(`/dashboard/student/batches/${batch.id}/recordings`)}
          className="flex-1 py-2 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center justify-center gap-1"
        >
          <Video className="w-3.5 h-3.5" /> Recordings
        </button>
        <button
          onClick={() => router.push('/dashboard/student/scores')}
          className="flex-1 py-2 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors inline-flex items-center justify-center gap-1"
        >
          <BarChart3 className="w-3.5 h-3.5" /> Scores
        </button>
        <button
          onClick={() => router.push('/dashboard/student/doubts')}
          className="flex-1 py-2 text-xs font-medium bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors inline-flex items-center justify-center gap-1"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Doubts
        </button>
      </div>
    </div>
  );
}