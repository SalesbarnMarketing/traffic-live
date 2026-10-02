import { RegisteredUser } from '../types';

export const isPermittedAdminRole = (role?: string, email?: string): boolean => {
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === 'charlesodendaal43@gmail.com' || cleanEmail === 'salesbarnmarketing101@gmail.com' || cleanEmail === 'sylvester@trafficlive.co.za' || cleanEmail === 'admin@livetraffic.co.za') {
      return true;
    }
  }
  if (!role) return false;
  const lower = role.toLowerCase().trim();
  return (
    lower === 'super_admin' ||
    lower === 'admin' ||
    lower === 'moderator' ||
    lower === 'patrol' ||
    lower.includes('admin') ||
    lower.includes('patrol') ||
    lower.includes('moderator')
  );
};

export interface AdminSessionInfo {
  isAdmin: boolean;
  token: string;
  name: string;
  email: string;
  role: string;
}

export const getAdminSession = (currentUser?: RegisteredUser | null): AdminSessionInfo | null => {
  if (typeof window === 'undefined') return null;

  const isCharles = currentUser?.email?.toLowerCase().trim() === 'charlesodendaal43@gmail.com';

  // 1. Check if currentUser object has an administrative role or is super admin Charles Odendaal
  if (currentUser && (isPermittedAdminRole(currentUser.role, currentUser.email) || isCharles)) {
    const fullName = `${currentUser.fullName || ''} ${currentUser.surname || ''}`.trim() || currentUser.fullName || currentUser.email?.split('@')[0] || (isCharles ? 'Charles Odendaal' : 'Admin Dispatch Officer');
    const token =
      sessionStorage.getItem('adminToken') ||
      localStorage.getItem('adminToken') ||
      `admin-auth-token-${currentUser.id || (currentUser.email ? currentUser.email.toLowerCase().replace(/[^a-z0-9]/g, '') : 'admin')}`;
    return {
      isAdmin: true,
      token,
      name: fullName,
      email: currentUser.email || 'charlesodendaal43@gmail.com',
      role: currentUser.role || (isCharles ? 'super_admin' : 'admin')
    };
  }

  // 2. Check token in sessionStorage or localStorage (Active Admin Portal session)
  const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
  if (token) {
    let adminUserObj: any = null;
    try {
      const stored = sessionStorage.getItem('adminUser') || localStorage.getItem('adminUser');
      if (stored) {
        adminUserObj = JSON.parse(stored);
      }
    } catch (e) {
      // ignore
    }

    let parsedName = '';
    if (adminUserObj) {
      if (adminUserObj.fullName) {
        parsedName = `${adminUserObj.fullName} ${adminUserObj.surname || ''}`.trim();
      } else if (adminUserObj.name) {
        parsedName = adminUserObj.name.trim();
      }
    }

    const email = adminUserObj?.email || (token.includes('charles') ? 'charlesodendaal43@gmail.com' : (token.includes('sylvester') ? 'sylvester@trafficlive.co.za' : 'admin@livetraffic.co.za'));
    const role = adminUserObj?.role || (token.includes('charles') ? 'super_admin' : (token.includes('sylvester') ? 'admin' : 'super_admin'));
    const finalName = parsedName || (token.includes('charles') ? 'Charles Odendaal' : (token.includes('sylvester') ? 'Sylvester Dispatch' : (email ? email.split('@')[0] : 'Admin Dispatch Officer')));

    return {
      isAdmin: true,
      token,
      name: finalName,
      email: email || 'charlesodendaal43@gmail.com',
      role: role || 'super_admin'
    };
  }

  // 3. Fallback check on standard logged-in user in localStorage
  try {
    const storedUser = localStorage.getItem('live_traffic_npc_user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      if (u && isPermittedAdminRole(u.role, u.email)) {
        const name = `${u.fullName || ''} ${u.surname || ''}`.trim() || u.email?.split('@')[0] || 'Admin Dispatch Officer';
        return {
          isAdmin: true,
          token: `admin-auth-token-${u.id || u.email}`,
          name,
          email: u.email || 'admin@livetraffic.co.za',
          role: u.role || 'admin'
        };
      }
    }
  } catch (e) {}

  return null;
};

export const isCurrentUserOrSessionAdmin = (currentUser?: RegisteredUser | null): boolean => {
  return getAdminSession(currentUser) !== null;
};

export const getAdminRequestHeaders = (currentUser?: RegisteredUser | null): Record<string, string> => {
  const session = getAdminSession(currentUser);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (session && session.isAdmin) {
    headers['Authorization'] = `Bearer ${session.token}`;
    headers['x-admin-token'] = session.token;
    headers['x-user-role'] = session.role || 'super_admin';
    headers['x-admin-role'] = session.role || 'super_admin';
    headers['x-user-name'] = session.name;
    headers['x-admin-name'] = session.name;
    headers['x-user-email'] = session.email;
    headers['x-admin-email'] = session.email;
    headers['x-admin-authorized'] = 'true';
  } else {
    let userRole = currentUser?.role || 'user';
    let userEmail = currentUser?.email || '';
    let userName = currentUser?.fullName ? `${currentUser.fullName} ${currentUser.surname || ''}`.trim() : '';

    if (!userEmail && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('live_traffic_npc_user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u?.email) userEmail = u.email;
          if (u?.role) userRole = u.role;
          if (u?.fullName) userName = `${u.fullName} ${u.surname || ''}`.trim();
        }
      } catch {}
    }

    headers['x-user-role'] = userRole;
    if (userEmail) headers['x-user-email'] = userEmail;
    if (userName) headers['x-user-name'] = userName;
  }

  return headers;
};

/**
 * Checks whether the current user is the original author/composer of an incident report or feed item.
 */
export const isOriginalComposer = (
  item: any,
  currentUser?: RegisteredUser | null
): boolean => {
  if (!item) return false;

  let userEmail = currentUser?.email?.toLowerCase().trim() || '';
  let userName = currentUser?.fullName ? `${currentUser.fullName} ${currentUser.surname || ''}`.trim().toLowerCase() : '';

  if (!userEmail && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('live_traffic_npc_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.email) userEmail = String(u.email).toLowerCase().trim();
        if (u?.fullName) userName = `${u.fullName} ${u.surname || ''}`.trim().toLowerCase();
      }
    } catch {}
  }

  // 1. Check direct email match
  if (userEmail) {
    const postEmails = [
      item.postedByUserEmail,
      item.reporterEmail,
      item.postedByAdminEmail,
      item.createdByAdminEmail,
      item.userEmail,
      item.email
    ].filter(Boolean).map((e: any) => String(e).toLowerCase().trim());

    if (postEmails.includes(userEmail)) {
      return true;
    }
  }

  // 2. Check direct name match
  if (userName && userName.length > 2) {
    const cleanUserName = userName.replace(/^[🛡️👤🚨🚗\s]+/, '').replace(/\s*\(Admin\)|\s*\(Patrol\)/gi, '').trim();
    const postAuthors = [
      item.postedByUserName,
      item.reporterName,
      item.author,
      item.postedByAdminName,
      item.createdByAdminName,
      item.userName,
      item.name
    ].filter(Boolean).map((a: any) =>
      String(a)
        .replace(/^[🛡️👤🚨🚗\s]+/, '')
        .replace(/\s*\(Admin\)|\s*\(Patrol\)/gi, '')
        .trim()
        .toLowerCase()
    );

    if (postAuthors.some(author => author && (author === cleanUserName || cleanUserName.includes(author) || author.includes(cleanUserName)))) {
      return true;
    }
  }

  return false;
};

/**
 * Determines if the current user has permission to delete a post or hazard report.
 * Returns true if:
 * 1. The user is an administrator (via explicit flag, role, or valid session)
 * 2. The user is the original composer of the post
 * Otherwise returns false (e.g. motorists who did not compose the post).
 */
export const canUserDeletePost = (
  item: any,
  currentUser?: RegisteredUser | null,
  isAdminExplicit?: boolean
): boolean => {
  if (isAdminExplicit) return true;
  if (isCurrentUserOrSessionAdmin(currentUser)) return true;
  if (currentUser && isPermittedAdminRole(currentUser.role, currentUser.email)) return true;
  return isOriginalComposer(item, currentUser);
};

