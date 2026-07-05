/**
 * @jest-environment node
 */
let mockAuthRole = 'STUDENT';
jest.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: jest.fn().mockImplementation(() => ({
    user: { id: 'user-1', role: mockAuthRole, sessionId: 'sess-1' },
  })),
  getTokenFromRequest: jest.fn().mockReturnValue('mock-token'),
}));

import { NextRequest } from 'next/server';

const mockNotifications: Record<string, unknown>[] = [];

jest.mock('@/lib/db/prisma', () => {
  const notificationModel = {
    findMany: jest.fn().mockImplementation((args: any) => {
      let filtered = mockNotifications.filter((n: any) => {
        if (args?.where?.userId && n.userId !== args.where.userId) return false;
        if (args?.where?.isRead !== undefined && n.isRead !== args.where.isRead) return false;
        return true;
      });
      filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (args?.skip !== undefined && args?.take) {
        filtered = filtered.slice(args.skip, args.skip + args.take);
      }
      return Promise.resolve(filtered);
    }),
    count: jest.fn().mockImplementation(({ where }: any) => {
      let filtered = mockNotifications.filter((n: any) => {
        if (where?.userId && n.userId !== where.userId) return false;
        if (where?.isRead !== undefined && n.isRead !== where.isRead) return false;
        return true;
      });
      return Promise.resolve(filtered.length);
    }),
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(mockNotifications.find((n: any) => n.id === where.id) || null);
    }),
    update: jest.fn().mockImplementation(({ where, data }: any) => {
      const idx = mockNotifications.findIndex((n: any) => n.id === where.id);
      if (idx === -1) return Promise.resolve(null);
      mockNotifications[idx] = { ...mockNotifications[idx] as any, ...data };
      return Promise.resolve(mockNotifications[idx]);
    }),
    updateMany: jest.fn().mockImplementation(({ where, data }: any) => {
      let count = 0;
      for (const n of mockNotifications) {
        const nAny = n as any;
        if (nAny.userId === (where as any).userId && nAny.isRead === (where as any).isRead) {
          nAny.isRead = (data as any).isRead;
          count++;
        }
      }
      return Promise.resolve({ count });
    }),
    __reset(notifications: Record<string, unknown>[]) {
      mockNotifications.length = 0;
      mockNotifications.push(...notifications);
    },
  };

  return { prisma: { notification: notificationModel } };
});

describe('Notifications API', () => {
  const mockNotifs = [
    { id: 'notif-1', userId: 'user-1', title: 'Doubt Answered', message: 'Your doubt was answered', type: 'DOUBT_ANSWERED', link: '/dashboard/student', isRead: false, createdAt: '2026-06-20T10:00:00Z' },
    { id: 'notif-2', userId: 'user-1', title: 'Payment Confirmed', message: 'Payment confirmed', type: 'PAYMENT_CONFIRMED', link: '/dashboard/student', isRead: false, createdAt: '2026-06-19T10:00:00Z' },
    { id: 'notif-3', userId: 'user-1', title: 'Enrollment Active', message: 'Enrollment active', type: 'ENROLLMENT_ACTIVE', link: '/dashboard/student', isRead: true, createdAt: '2026-06-18T10:00:00Z' },
    { id: 'notif-4', userId: 'other-user', title: 'Other Notification', message: 'Not for current user', type: 'SYSTEM', link: null, isRead: false, createdAt: '2026-06-17T10:00:00Z' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthRole = 'STUDENT';
    const { prisma } = require('@/lib/db/prisma');
    prisma.notification.__reset(mockNotifs.map(n => ({ ...n })));
  });

  it('lists notifications for the authenticated user', async () => {
    const { GET } = await import('@/app/api/notifications/route');
    const req = new NextRequest('http://localhost:3000/api/notifications');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(3);
    expect(body.data.every((n: any) => n.userId === 'user-1')).toBe(true);
    expect(body.pagination.total).toBe(3);
  });

  it('returns unread count', async () => {
    const { GET } = await import('@/app/api/notifications/unread-count/route');
    const req = new NextRequest('http://localhost:3000/api/notifications/unread-count');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(2);
  });

  it('marks a notification as read', async () => {
    const { PATCH } = await import('@/app/api/notifications/[id]/read/route');
    const req = new NextRequest('http://localhost:3000/api/notifications/notif-1/read', { method: 'PATCH' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'notif-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isRead).toBe(true);

    const { GET } = await import('@/app/api/notifications/unread-count/route');
    const countReq = new NextRequest('http://localhost:3000/api/notifications/unread-count');
    const countRes = await GET(countReq);
    const countBody = await countRes.json();
    expect(countBody.count).toBe(1);
  });

  it('returns 403 when trying to mark another user\'s notification as read', async () => {
    const { PATCH } = await import('@/app/api/notifications/[id]/read/route');
    const req = new NextRequest('http://localhost:3000/api/notifications/notif-4/read', { method: 'PATCH' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'notif-4' }) });
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe('FORBIDDEN');
  });

  it('returns 404 for non-existent notification', async () => {
    const { PATCH } = await import('@/app/api/notifications/[id]/read/route');
    const req = new NextRequest('http://localhost:3000/api/notifications/non-existent/read', { method: 'PATCH' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(res.status).toBe(404);
  });

  it('marks all notifications as read', async () => {
    const { POST } = await import('@/app/api/notifications/read-all/route');
    const req = new NextRequest('http://localhost:3000/api/notifications/read-all', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const { GET } = await import('@/app/api/notifications/unread-count/route');
    const countReq = new NextRequest('http://localhost:3000/api/notifications/unread-count');
    const countRes = await GET(countReq);
    const body = await countRes.json();
    expect(body.count).toBe(0);
  });

  it('respects unreadOnly filter', async () => {
    const { GET } = await import('@/app/api/notifications/route');
    const req = new NextRequest('http://localhost:3000/api/notifications?unreadOnly=true');
    const res = await GET(req);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data.every((n: any) => n.isRead === false)).toBe(true);
  });

  it('paginates results', async () => {
    const { prisma } = require('@/lib/db/prisma');
    const manyNotifs = Array.from({ length: 25 }, (_, i) => ({
      id: `notif-batch-${i}`,
      userId: 'user-1',
      title: `Notification ${i}`,
      message: `Message ${i}`,
      type: 'SYSTEM',
      link: null,
      isRead: false,
      createdAt: new Date(2026, 5, 20 - i).toISOString(),
    }));
    prisma.notification.__reset(manyNotifs);

    const { GET } = await import('@/app/api/notifications/route');
    const page1Req = new NextRequest('http://localhost:3000/api/notifications?page=1&limit=20');
    const page1Res = await GET(page1Req);
    const page1Body = await page1Res.json();
    expect(page1Body.data).toHaveLength(20);
    expect(page1Body.pagination.total).toBe(25);
    expect(page1Body.pagination.totalPages).toBe(2);

    const page2Req = new NextRequest('http://localhost:3000/api/notifications?page=2&limit=20');
    const page2Res = await GET(page2Req);
    const page2Body = await page2Res.json();
    expect(page2Body.data).toHaveLength(5);
  });
});
