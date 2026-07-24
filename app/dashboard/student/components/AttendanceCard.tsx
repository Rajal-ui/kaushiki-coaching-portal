'use client';

interface AttendanceRecord {
  id: string;
  sessionDate: string;
  present: boolean;
  batch: { id: string; subject: { name: string } };
}

interface AttendanceGroup {
  batch: string;
  records: AttendanceRecord[];
}

interface AttendanceCardProps {
  groupedAttendance: AttendanceGroup[];
}

export function AttendanceCard({ groupedAttendance }: AttendanceCardProps) {
  if (groupedAttendance.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
        No attendance records yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groupedAttendance.map(g => {
          const present = g.records.filter(r => r.present).length;
          const total = g.records.length;
          const pct = total > 0 ? Math.round((present / total) * 100) : 0;
          const color = pct >= 75 ? 'text-green-700 bg-green-50 border-green-200' : pct >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200';
          return (
            <div key={g.batch} className={`rounded-xl border p-5 ${color}`}>
              <h3 className="font-semibold">{g.batch}</h3>
              <p className="text-2xl font-bold mt-1">{pct}%</p>
              <p className="text-xs mt-1">{present}/{total} sessions present</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <h3 className="font-semibold text-gray-900 p-5 border-b border-gray-100">Recent Attendance Records</h3>
        {(() => {
          const mostRecent = groupedAttendance.length > 0
            ? groupedAttendance.reduce((a, b) => {
                const aMax = a.records.length > 0 ? new Date(a.records[a.records.length - 1].sessionDate).getTime() : 0;
                const bMax = b.records.length > 0 ? new Date(b.records[b.records.length - 1].sessionDate).getTime() : 0;
                return aMax > bMax ? a : b;
              }).records
            : [];
          return mostRecent.length === 0 ? (
            <p className="p-5 text-gray-400 text-sm">No records.</p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto p-5">
              {mostRecent.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                  <span className="text-sm text-gray-700">
                    {new Date(r.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.present ? 'Present' : 'Absent'}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export function AttendanceSummaryCard({ attendance }: { attendance: AttendanceRecord[] }) {
  if (attendance.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-gray-400 text-center">No attendance records yet.</p>
      </div>
    );
  }

  const map = new Map<string, { subject: string; total: number; present: number }>();
  for (const a of attendance) {
    const key = a.batch.id;
    if (!map.has(key)) map.set(key, { subject: a.batch.subject.name, total: 0, present: 0 });
    const entry = map.get(key)!;
    entry.total++;
    if (a.present) entry.present++;
  }

  const grouped = Array.from(map.entries()).map(([batchId, info]) => ({ batchId, ...info }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">Attendance Overview</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {grouped.map(g => {
          const pct = g.total > 0 ? Math.round((g.present / g.total) * 100) : 0;
          const color = pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
          return (
            <div key={g.batchId} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{g.subject}</p>
                <p className="text-xs text-gray-500">{g.present}/{g.total} sessions</p>
              </div>
              <span className={`ml-3 font-semibold ${color}`}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}